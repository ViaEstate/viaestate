-- Debug and fix KYERO XML import
-- Add debug function and fix image extraction

-- Debug function for KYERO XML
CREATE OR REPLACE FUNCTION debug_kyero_xml(xml_url TEXT)
RETURNS TABLE(property_count INTEGER, sample_title TEXT, sample_images TEXT[]) AS $$
DECLARE
    xml_content TEXT;
BEGIN
    -- Fetch XML content from URL
    SELECT content INTO xml_content
    FROM http_get(xml_url);

    IF xml_content IS NULL OR xml_content = '' THEN
        RETURN QUERY SELECT 0, 'Failed to fetch XML'::text, NULL::text[];
        RETURN;
    END IF;

    RETURN QUERY SELECT
        (SELECT count(*) FROM (SELECT unnest(xpath('//property', xml_content::xml))) as props)::integer,
        (xpath('//property[1]/type/text()', xml_content::xml))[1]::text,
        (SELECT array_agg(url) FROM (SELECT unnest(xpath('//property[1]/images/image/url/text()', xml_content::xml))::text as url) as urls)[1:3];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION debug_kyero_xml(TEXT) TO authenticated;

-- Simplified KYERO function that keeps original XML image URLs (no storage download)
CREATE OR REPLACE FUNCTION process_kyero_xml_keep_urls(xml_url TEXT, owner_id UUID DEFAULT NULL, batch_size INTEGER DEFAULT 50, batch_offset INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
    xml_content TEXT;
    property_count INTEGER;
    processed_count INTEGER := 0;
    created_properties UUID[];
    updated_properties UUID[];
    skipped_duplicates INTEGER := 0;
    validation_failures INTEGER := 0;
    i INTEGER;
    current_id TEXT;
    current_title TEXT;
    current_description TEXT;
    current_country TEXT;
    current_city TEXT;
    current_province TEXT;
    current_price TEXT;
    current_type TEXT;
    current_beds TEXT;
    current_baths TEXT;
    current_built_area TEXT;
    current_plot_area TEXT;
    batch_end INTEGER;
    existing_property_id UUID;
BEGIN
    -- Fetch XML content from URL
    SELECT content INTO xml_content
    FROM http_get(xml_url);

    IF xml_content IS NULL OR xml_content = '' THEN
        RETURN json_build_object('success', false, 'error', 'Failed to fetch XML from URL');
    END IF;

    -- Get total number of properties (KYERO format has individual <property> elements)
    SELECT count(*) INTO property_count
    FROM (SELECT unnest(xpath('//property', xml_content::xml))) as props;

    -- If no properties found, return error
    IF property_count = 0 THEN
        RETURN json_build_object('success', false, 'error', 'No properties found in XML', 'xml_content_length', length(xml_content));
    END IF;

    -- Calculate batch range
    batch_end := LEAST(batch_offset + batch_size, property_count);

    -- Process properties in this batch
    created_properties := ARRAY[]::UUID[];
    updated_properties := ARRAY[]::UUID[];

    FOR i IN (batch_offset + 1)..batch_end LOOP
        -- Extract data using KYERO XPath
        SELECT
            (xpath('//property[' || i || ']/id/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/type/text()', xml_content::xml))[1]::text,
            COALESCE(
                (xpath('//property[' || i || ']/desc/en/text()', xml_content::xml))[1]::text,
                (xpath('//property[' || i || ']/desc/es/text()', xml_content::xml))[1]::text,
                (xpath('//property[' || i || ']/desc/sv/text()', xml_content::xml))[1]::text,
                'No description available'
            ),
            'Spain', -- KYERO properties are typically in Spain
            (xpath('//property[' || i || ']/town/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/province/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/price/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/beds/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/baths/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/surface_area/built/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/surface_area/plot/text()', xml_content::xml))[1]::text
        INTO current_id, current_title, current_description, current_country, current_city, current_province, current_price, current_beds, current_baths, current_built_area, current_plot_area;

        -- Relaxed validation - only require title and price
        IF current_title IS NULL OR trim(current_title) = '' THEN
            validation_failures := validation_failures + 1;
            CONTINUE;
        END IF;
        IF current_price IS NULL OR current_price::numeric <= 0 THEN
            validation_failures := validation_failures + 1;
            CONTINUE;
        END IF;

        -- Set defaults for missing required fields
        IF current_description IS NULL OR trim(current_description) = '' THEN
            current_description := 'Description not available';
        END IF;
        IF current_city IS NULL OR trim(current_city) = '' THEN
            current_city := 'Location not specified';
        END IF;

        -- Check for existing property
        SELECT id INTO existing_property_id
        FROM properties
        WHERE LOWER(TRIM(title)) = LOWER(TRIM(current_title))
          AND LOWER(TRIM(city)) = LOWER(TRIM(current_city))
          AND price = current_price::numeric
        LIMIT 1;

        IF existing_property_id IS NOT NULL THEN
            -- Update existing property
            UPDATE properties SET
                description = trim(current_description),
                property_type = CASE WHEN current_type IS NOT NULL THEN trim(current_type) ELSE 'house' END,
                bedrooms = CASE WHEN current_beds IS NOT NULL THEN current_beds::integer ELSE NULL END,
                bathrooms = CASE WHEN current_baths IS NOT NULL THEN current_baths::integer ELSE NULL END,
                area = CASE WHEN current_built_area IS NOT NULL THEN current_built_area::integer ELSE NULL END,
                plot_area = CASE WHEN current_plot_area IS NOT NULL THEN current_plot_area::integer ELSE NULL END,
                images = CASE WHEN (SELECT count(*) FROM (SELECT unnest(xpath('//property[' || i || ']/images/image/url/text()', xml_content::xml))) as imgs) > 0
                           THEN (SELECT array_agg(url) FROM (SELECT unnest(xpath('//property[' || i || ']/images/image/url/text()', xml_content::xml))::text as url) as img_array)[1:10]
                           ELSE NULL END,
                updated_at = NOW()
            WHERE id = existing_property_id;

            updated_properties := array_append(updated_properties, existing_property_id);
            skipped_duplicates := skipped_duplicates + 1;
        ELSE
            -- Determine owner and create new property
            DECLARE
                actual_owner_id UUID;
                owner_type TEXT;
                new_property_id UUID;
            BEGIN
                IF owner_id IS NOT NULL THEN
                    actual_owner_id := owner_id;
                    SELECT CASE WHEN role = 'private_user' THEN 'private' ELSE 'broker' END
                    INTO owner_type
                    FROM profiles WHERE id = owner_id;
                ELSE
                    -- Default to first admin user
                    SELECT id INTO actual_owner_id
                    FROM profiles
                    WHERE role = 'admin' AND status = 'approved'
                    ORDER BY created_at LIMIT 1;

                    owner_type := 'broker';
                END IF;

                -- Create new property
                INSERT INTO properties (
                    title, description, country, city, price, property_type,
                    bedrooms, bathrooms, area, plot_area,
                    images, videos,
                    seller_id, seller_type, status
                ) VALUES (
                    trim(current_title),
                    trim(current_description),
                    trim(current_country),
                    trim(current_city),
                    current_price::numeric,
                    CASE WHEN current_type IS NOT NULL THEN trim(current_type) ELSE 'house' END,
                    CASE WHEN current_beds IS NOT NULL THEN current_beds::integer ELSE NULL END,
                    CASE WHEN current_baths IS NOT NULL THEN current_baths::integer ELSE NULL END,
                    CASE WHEN current_built_area IS NOT NULL THEN current_built_area::integer ELSE NULL END,
                    CASE WHEN current_plot_area IS NOT NULL THEN current_plot_area::integer ELSE NULL END,
                    CASE WHEN (SELECT count(*) FROM (SELECT unnest(xpath('//property[' || i || ']/images/image/url/text()', xml_content::xml))) as imgs) > 0
                         THEN (SELECT array_agg(url) FROM (SELECT unnest(xpath('//property[' || i || ']/images/image/url/text()', xml_content::xml))::text as url) as img_array)[1:10]
                         ELSE NULL END,
                    NULL, -- Videos not implemented yet
                    actual_owner_id,
                    owner_type,
                    'published' -- Auto-publish imported properties
                )
                RETURNING id INTO new_property_id;

                created_properties := array_append(created_properties, new_property_id);
            END;
        END IF;

        processed_count := processed_count + 1;
    END LOOP;

    -- Return results
    RETURN json_build_object(
        'success', true,
        'xml_format', 'kyero',
        'total_properties', property_count,
        'batch_offset', batch_offset,
        'batch_size', batch_size,
        'processed_in_batch', processed_count,
        'created_in_batch', array_length(created_properties, 1),
        'updated_in_batch', array_length(updated_properties, 1),
        'skipped_duplicates', skipped_duplicates,
        'validation_failures', validation_failures,
        'property_ids_created', created_properties,
        'property_ids_updated', updated_properties,
        'has_more', (batch_offset + batch_size) < property_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'xml_format', 'kyero',
            'total_properties', property_count,
            'batch_offset', batch_offset,
            'processed_in_batch', processed_count
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_kyero_xml_keep_urls(TEXT, UUID, INTEGER, INTEGER) TO authenticated;

-- Supabase Storage cache solution
-- Funktion för att cache:a bilder i Storage
CREATE OR REPLACE FUNCTION cache_image_in_storage(image_url TEXT, property_id UUID, image_index INTEGER DEFAULT 1)
RETURNS TEXT AS $$
DECLARE
    image_content BYTEA;
    file_name TEXT;
    storage_path TEXT;
    public_url TEXT;
BEGIN
    -- Skapa unikt filnamn baserat på URL:en (för cache)
    file_name := 'cached_' || md5(image_url) || '.jpg';
    storage_path := 'property-cache/' || file_name;

    -- Försök hämta bilden från original-URL
    SELECT content INTO image_content FROM http_get(image_url);

    IF image_content IS NULL OR length(image_content) = 0 THEN
        -- Om hämtning misslyckas, returnera original-URL som fallback
        RETURN image_url;
    END IF;

    -- Här skulle vi i en full implementation ladda upp till Supabase Storage
    -- För nu returnerar vi original-URL men markerar att cache skulle kunna användas
    -- I produktion: använd Supabase Storage API för att ladda upp image_content

    -- Simulera cache-URL (ersätt med riktig Storage-URL i produktion)
    public_url := 'https://your-project.supabase.co/storage/v1/object/public/property-images/' || storage_path;

    -- För denna demo, returnera original-URL så det fungerar direkt
    -- I produktion skulle detta returnera Storage-URL efter uppladdning
    RETURN image_url;

EXCEPTION
    WHEN OTHERS THEN
        -- Vid fel, returnera alltid original-URL som fallback
        RETURN image_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Importfunktion med cache-system
CREATE OR REPLACE FUNCTION process_kyero_xml_with_cache(xml_url TEXT, owner_id UUID DEFAULT NULL, batch_size INTEGER DEFAULT 50, batch_offset INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
    xml_content TEXT;
    property_count INTEGER;
    processed_count INTEGER := 0;
    created_properties UUID[];
    updated_properties UUID[];
    skipped_duplicates INTEGER := 0;
    validation_failures INTEGER := 0;
    images_cached INTEGER := 0;
    i INTEGER;
    current_id TEXT;
    current_title TEXT;
    current_description TEXT;
    current_country TEXT;
    current_city TEXT;
    current_province TEXT;
    current_price TEXT;
    current_type TEXT;
    current_beds TEXT;
    current_baths TEXT;
    current_built_area TEXT;
    current_plot_area TEXT;
    batch_end INTEGER;
    existing_property_id UUID;
    image_urls TEXT[];
    cached_urls TEXT[] := ARRAY[]::TEXT[];
    cached_url TEXT;
BEGIN
    -- Fetch XML content from URL
    SELECT content INTO xml_content
    FROM http_get(xml_url);

    IF xml_content IS NULL OR xml_content = '' THEN
        RETURN json_build_object('success', false, 'error', 'Failed to fetch XML from URL');
    END IF;

    -- Get total number of properties
    SELECT count(*) INTO property_count
    FROM (SELECT unnest(xpath('//property', xml_content::xml))) as props;

    IF property_count = 0 THEN
        RETURN json_build_object('success', false, 'error', 'No properties found in XML', 'xml_content_length', length(xml_content));
    END IF;

    -- Calculate batch range
    batch_end := LEAST(batch_offset + batch_size, property_count);

    -- Process properties in this batch
    created_properties := ARRAY[]::UUID[];
    updated_properties := ARRAY[]::UUID[];

    FOR i IN (batch_offset + 1)..batch_end LOOP
        -- Extract data using KYERO XPath
        SELECT
            (xpath('//property[' || i || ']/id/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/type/text()', xml_content::xml))[1]::text,
            COALESCE(
                (xpath('//property[' || i || ']/desc/en/text()', xml_content::xml))[1]::text,
                (xpath('//property[' || i || ']/desc/es/text()', xml_content::xml))[1]::text,
                (xpath('//property[' || i || ']/desc/sv/text()', xml_content::xml))[1]::text,
                'No description available'
            ),
            'Spain',
            (xpath('//property[' || i || ']/town/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/province/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/price/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/beds/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/baths/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/surface_area/built/text()', xml_content::xml))[1]::text,
            (xpath('//property[' || i || ']/surface_area/plot/text()', xml_content::xml))[1]::text
        INTO current_id, current_title, current_description, current_country, current_city, current_province, current_price, current_beds, current_baths, current_built_area, current_plot_area;

        -- Relaxed validation
        IF current_title IS NULL OR trim(current_title) = '' THEN
            validation_failures := validation_failures + 1;
            CONTINUE;
        END IF;
        IF current_price IS NULL OR current_price::numeric <= 0 THEN
            validation_failures := validation_failures + 1;
            CONTINUE;
        END IF;

        -- Set defaults
        IF current_description IS NULL OR trim(current_description) = '' THEN
            current_description := 'Description not available';
        END IF;
        IF current_city IS NULL OR trim(current_city) = '' THEN
            current_city := 'Location not specified';
        END IF;

        -- Get image URLs and prepare for caching
        cached_urls := ARRAY[]::TEXT[];
        SELECT array_agg(url) INTO image_urls
        FROM (SELECT unnest(xpath('//property[' || i || ']/images/image/url/text()', xml_content::xml))::text as url) as img_array;

        -- Process each image (behåll original-URL:er för nu, men förbered för cache)
        IF image_urls IS NOT NULL AND array_length(image_urls, 1) > 0 THEN
            FOR j IN 1..LEAST(array_length(image_urls, 1), 10) LOOP
                -- För nu, använd original-URL:erna direkt
                -- I framtiden kan cache_image_in_storage() användas för att cache:a
                cached_urls := array_append(cached_urls, image_urls[j]);
                images_cached := images_cached + 1;
            END LOOP;
        END IF;

        -- Check for existing property
        SELECT id INTO existing_property_id
        FROM properties
        WHERE LOWER(TRIM(title)) = LOWER(TRIM(current_title))
          AND LOWER(TRIM(city)) = LOWER(TRIM(current_city))
          AND price = current_price::numeric
        LIMIT 1;

        IF existing_property_id IS NOT NULL THEN
            -- Update existing property
            UPDATE properties SET
                description = trim(current_description),
                property_type = CASE WHEN current_type IS NOT NULL THEN trim(current_type) ELSE 'house' END,
                bedrooms = CASE WHEN current_beds IS NOT NULL THEN current_beds::integer ELSE NULL END,
                bathrooms = CASE WHEN current_baths IS NOT NULL THEN current_baths::integer ELSE NULL END,
                area = CASE WHEN current_built_area IS NOT NULL THEN current_built_area::integer ELSE NULL END,
                plot_area = CASE WHEN current_plot_area IS NOT NULL THEN current_plot_area::integer ELSE NULL END,
                images = CASE WHEN array_length(cached_urls, 1) > 0 THEN cached_urls ELSE NULL END,
                updated_at = NOW()
            WHERE id = existing_property_id;

            updated_properties := array_append(updated_properties, existing_property_id);
            skipped_duplicates := skipped_duplicates + 1;
        ELSE
            -- Determine owner and create new property
            DECLARE
                actual_owner_id UUID;
                owner_type TEXT;
                new_property_id UUID;
            BEGIN
                IF owner_id IS NOT NULL THEN
                    actual_owner_id := owner_id;
                    SELECT CASE WHEN role = 'private_user' THEN 'private' ELSE 'broker' END
                    INTO owner_type
                    FROM profiles WHERE id = owner_id;
                ELSE
                    -- Default to first admin user
                    SELECT id INTO actual_owner_id
                    FROM profiles
                    WHERE role = 'admin' AND status = 'approved'
                    ORDER BY created_at LIMIT 1;

                    owner_type := 'broker';
                END IF;

                -- Create new property
                INSERT INTO properties (
                    title, description, country, city, price, property_type,
                    bedrooms, bathrooms, area, plot_area,
                    images, videos,
                    seller_id, seller_type, status
                ) VALUES (
                    trim(current_title),
                    trim(current_description),
                    trim(current_country),
                    trim(current_city),
                    current_price::numeric,
                    CASE WHEN current_type IS NOT NULL THEN trim(current_type) ELSE 'house' END,
                    CASE WHEN current_beds IS NOT NULL THEN current_beds::integer ELSE NULL END,
                    CASE WHEN current_baths IS NOT NULL THEN current_baths::integer ELSE NULL END,
                    CASE WHEN current_built_area IS NOT NULL THEN current_built_area::integer ELSE NULL END,
                    CASE WHEN current_plot_area IS NOT NULL THEN current_plot_area::integer ELSE NULL END,
                    CASE WHEN array_length(cached_urls, 1) > 0 THEN cached_urls ELSE NULL END,
                    NULL,
                    actual_owner_id,
                    owner_type,
                    'published'
                )
                RETURNING id INTO new_property_id;

                created_properties := array_append(created_properties, new_property_id);
            END;
        END IF;

        processed_count := processed_count + 1;
    END LOOP;

    -- Return results
    RETURN json_build_object(
        'success', true,
        'xml_format', 'kyero',
        'total_properties', property_count,
        'batch_offset', batch_offset,
        'batch_size', batch_size,
        'processed_in_batch', processed_count,
        'created_in_batch', array_length(created_properties, 1),
        'updated_in_batch', array_length(updated_properties, 1),
        'skipped_duplicates', skipped_duplicates,
        'validation_failures', validation_failures,
        'images_processed', images_cached,
        'property_ids_created', created_properties,
        'property_ids_updated', updated_properties,
        'has_more', (batch_offset + batch_size) < property_count
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'xml_format', 'kyero',
            'total_properties', property_count,
            'batch_offset', batch_offset,
            'processed_in_batch', processed_count
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cache_image_in_storage(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION process_kyero_xml_with_cache(TEXT, UUID, INTEGER, INTEGER) TO authenticated;