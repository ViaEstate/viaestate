-- Debug version for simple xpath
CREATE OR REPLACE FUNCTION debug_croatia_xml_simple(xml_url TEXT)
RETURNS JSON AS $$
DECLARE
    xml_content TEXT;
    objects XML[];
    obj XML;
    obj_id TEXT;
    adv_type TEXT;
    obj_type TEXT;
    obj_price TEXT;
    country TEXT;
    city TEXT;
BEGIN
    SELECT content INTO xml_content FROM http_get(xml_url);
    IF xml_content IS NULL THEN
        RETURN json_build_object('error', 'Failed to fetch XML');
    END IF;

    objects := xpath('//object', xmlparse(document xml_content));
    obj := objects[1];
    
    obj_id := (xpath('object_id', obj))[1]::text;
    adv_type := (xpath('advert_type', obj))[1]::text;
    obj_type := (xpath('object_type', obj))[1]::text;
    obj_price := (xpath('object_price', obj))[1]::text;
    country := (xpath('object_address/object_country', obj))[1]::text;
    city := (xpath('object_address/object_city', obj))[1]::text;

    RETURN json_build_object(
        'object_xml', obj::text,
        'object_id', obj_id,
        'advert_type', adv_type,
        'object_type', obj_type,
        'object_price', obj_price,
        'country', country,
        'city', city,
        'total_objects', array_length(objects, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_croatia_xml(xml_url TEXT, owner_id UUID DEFAULT NULL, max_properties INTEGER DEFAULT 50, offset_count INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
    xml_content TEXT;
    property_count INTEGER := 0;
    created_count INTEGER := 0;
    processed_count INTEGER := 0;
    property_ids UUID[] := ARRAY[]::UUID[];
    current_property RECORD;
BEGIN
    -- Check if owner_id is provided
    IF owner_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'owner_id is required',
            'processed', 0,
            'created', 0
        );
    END IF;

    -- Fetch XML content from URL
    SELECT content INTO xml_content
    FROM http_get(xml_url);

    IF xml_content IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to fetch XML from URL',
            'processed', 0,
            'created', 0,
            'xml_length', 0
        );
    END IF;

    -- Parse XML and extract properties
    FOR current_property IN
        SELECT
            t.object_id,
            t.advert_type,
            t.object_type,
            t.object_updated,
            t.object_area,
            t.object_price,
            t.bedrooms,
            t.bathrooms,
            t.living_area,
            t.country_code,
            t.country,
            t.city,
            t.description,
            t.images
        FROM xmltable(
            '//object' PASSING xmlparse(document xml_content)
            COLUMNS
                    object_id TEXT PATH 'string(object_id[1])',
                    advert_type TEXT PATH 'string(advert_type[1])',
                    object_type TEXT PATH 'string(object_type[1])',
                    object_updated TEXT PATH 'string(object_updated[1])',
                    object_area TEXT PATH 'string(object_Area[1])',
                    object_price TEXT PATH 'string(object_price[1])',
                    bedrooms TEXT PATH 'string(bedrooms[1])',
                    bathrooms TEXT PATH 'string(bathrooms[1])',
                    living_area TEXT PATH 'string(living_area_unit[1])',
                    country_code TEXT PATH 'string(object_country[1])',
                    country TEXT PATH 'string(object_address[1]/object_country[1])',
                    city TEXT PATH 'string(object_address[1]/object_city[1])',
                    description TEXT PATH 'string(object_descriptions[1]/object_description[1])',
                    images TEXT[] PATH 'object_images[1]/image'
        ) AS t
        OFFSET offset_count
        LIMIT max_properties
    LOOP
        processed_count := processed_count + 1;

        -- Skip if not for sale
        IF lower(current_property.advert_type) != 'sale' THEN
            CONTINUE;
        END IF;

        -- Extract price (handle "Price Upon Request")
        DECLARE
            price_value NUMERIC := 0;
        BEGIN
            IF current_property.object_price != 'Price Upon Request' AND current_property.object_price ~ '^[0-9]+(\.[0-9]+)?$' THEN
                price_value := current_property.object_price::numeric;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                price_value := 0;
        END;

        -- Insert property
        DECLARE
            new_property_id UUID;
        BEGIN
            INSERT INTO properties (
                title,
                description,
                croatian_title,
                croatian_description,
                country,
                city,
                price,
                property_type,
                bedrooms,
                bathrooms,
                area,
                images,
                status,
                owner_id
            ) VALUES (
                COALESCE(current_property.object_type, 'Property') || ' in ' || COALESCE(current_property.city, 'Unknown City'),
                COALESCE(current_property.description, 'No description available'),
                COALESCE(current_property.object_type, 'Nekretnina') || ' u ' || COALESCE(current_property.city, 'Nepoznat Grad'),
                COALESCE(current_property.description, 'Nema opisa dostupnog'),
                COALESCE(current_property.country, 'Croatia'),
                COALESCE(current_property.city, 'Unknown City'),
                price_value,
                lower(COALESCE(current_property.object_type, 'house')),
                CASE WHEN current_property.bedrooms ~ '^[0-9]+$' THEN current_property.bedrooms::integer ELSE NULL END,
                CASE WHEN current_property.bathrooms ~ '^[0-9]+$' THEN current_property.bathrooms::integer ELSE NULL END,
                CASE WHEN current_property.living_area ~ '^[0-9]+(\.[0-9]+)?$' THEN current_property.living_area::numeric ELSE NULL END,
                COALESCE(current_property.images, ARRAY[]::text[]),
                'published',
                owner_id
            )
            ON CONFLICT (title, city, price) DO NOTHING
            RETURNING id INTO new_property_id;

            IF new_property_id IS NOT NULL THEN
                created_count := created_count + 1;
                property_ids := array_append(property_ids, new_property_id);
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but continue
                RAISE NOTICE 'Error inserting property %: %', current_property.object_id, SQLERRM;
        END;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'processed', processed_count,
        'created', created_count,
        'property_ids', property_ids,
        'xml_length', length(xml_content)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'processed', processed_count,
            'created', created_count,
            'xml_length', length(xml_content)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_croatia_xml(TEXT, UUID, INTEGER, INTEGER) TO authenticated;