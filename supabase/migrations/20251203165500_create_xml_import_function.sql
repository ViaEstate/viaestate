-- Create Edge Function for XML property import
-- This function processes XML from URLs and creates properties

-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Create the function
CREATE OR REPLACE FUNCTION process_xml_properties(xml_url TEXT, owner_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    xml_content TEXT;
    properties_data JSON[];
    result_data JSON;
    property_record RECORD;
    image_urls TEXT[];
    video_urls TEXT[];
    created_properties UUID[];
BEGIN
    -- Fetch XML content from URL
    SELECT content INTO xml_content
    FROM http_get(xml_url);

    IF xml_content IS NULL OR xml_content = '' THEN
        RETURN json_build_object('success', false, 'error', 'Failed to fetch XML from URL');
    END IF;

    -- Parse XML and extract properties
    -- Supports both standard format and extended real estate format (xml2u.com)
    WITH parsed_properties AS (
        SELECT
            -- Try extended format first (Property with capital P), fall back to standard format
            COALESCE(
                (xpath('//Property/Description/title/text()', xml_content::xml))[1]::text,
                (xpath('//property/title/text()', xml_content::xml))[1]::text
            ) as title,
            COALESCE(
                (xpath('//Property/Description/shortDescription/text()', xml_content::xml))[1]::text,
                (xpath('//Property/Description/description/en/text()', xml_content::xml))[1]::text,
                (xpath('//property/description/text()', xml_content::xml))[1]::text
            ) as description,
            COALESCE(
                (xpath('//Property/Address/country/text()', xml_content::xml))[1]::text,
                (xpath('//property/country/text()', xml_content::xml))[1]::text
            ) as country,
            COALESCE(
                (xpath('//Property/Address/location/text()', xml_content::xml))[1]::text,
                (xpath('//property/city/text()', xml_content::xml))[1]::text
            ) as city,
            COALESCE(
                (xpath('//Property/Price/price/text()', xml_content::xml))[1]::text,
                (xpath('//property/price/text()', xml_content::xml))[1]::text
            ) as price,
            COALESCE(
                (xpath('//Property/Description/propertyType/text()', xml_content::xml))[1]::text,
                (xpath('//property/property_type/text()', xml_content::xml))[1]::text
            ) as property_type,
            COALESCE(
                (xpath('//Property/Description/bedrooms/text()', xml_content::xml))[1]::text,
                (xpath('//property/bedrooms/text()', xml_content::xml))[1]::text
            ) as bedrooms,
            COALESCE(
                (xpath('//Property/Description/fullBathrooms/text()', xml_content::xml))[1]::text,
                (xpath('//property/bathrooms/text()', xml_content::xml))[1]::text
            ) as bathrooms,
            COALESCE(
                (xpath('//Property/Description/FloorSize/floorSize/text()', xml_content::xml))[1]::text,
                (xpath('//property/area/text()', xml_content::xml))[1]::text
            ) as area,
            COALESCE(
                (xpath('//Property/Description/PlotSize/plotSize/text()', xml_content::xml))[1]::text,
                (xpath('//property/plot_area/text()', xml_content::xml))[1]::text
            ) as plot_area,
            (xpath('//property/distance_to_city/text()', xml_content::xml))[1]::text as distance_to_city,
            (xpath('//property/distance_to_sea/text()', xml_content::xml))[1]::text as distance_to_sea,
            (xpath('//property/distance_to_lake/text()', xml_content::xml))[1]::text as distance_to_lake,
            COALESCE(
                array(
                    SELECT unnest(xpath('//Property/images/image/image/text()', xml_content::xml))::text
                ),
                array(
                    SELECT unnest(xpath('//property/images/image/text()', xml_content::xml))::text
                )
            ) as images,
            array(
                SELECT unnest(xpath('//property/videos/video/text()', xml_content::xml))::text
            ) as videos
        FROM (SELECT xml_content) as xml_data
    )
    SELECT array_agg(row_to_json(p)) INTO properties_data
    FROM parsed_properties p;

    -- Process each property
    created_properties := ARRAY[]::UUID[];

    FOREACH property_record IN ARRAY properties_data LOOP
        -- Validate required fields
        IF property_record.title IS NULL OR trim(property_record.title) = '' THEN
            CONTINUE; -- Skip invalid properties
        END IF;
        IF property_record.description IS NULL OR trim(property_record.description) = '' THEN
            CONTINUE;
        END IF;
        IF property_record.country IS NULL OR trim(property_record.country) = '' THEN
            CONTINUE;
        END IF;
        IF property_record.city IS NULL OR trim(property_record.city) = '' THEN
            CONTINUE;
        END IF;
        IF property_record.price IS NULL OR property_record.price::numeric <= 0 THEN
            CONTINUE;
        END IF;

        -- Determine owner
        DECLARE
            actual_owner_id UUID;
            owner_type TEXT;
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

            -- Create property
            INSERT INTO properties (
                title, description, country, city, price, property_type,
                bedrooms, bathrooms, area, plot_area,
                distance_to_city, distance_to_sea, distance_to_lake,
                images, videos,
                owner_id, owner_type, status
            ) VALUES (
                trim(property_record.title),
                trim(property_record.description),
                trim(property_record.country),
                trim(property_record.city),
                property_record.price::numeric,
                CASE WHEN property_record.property_type IS NOT NULL
                     THEN trim(property_record.property_type)
                     ELSE NULL END,
                CASE WHEN property_record.bedrooms IS NOT NULL
                     THEN property_record.bedrooms::integer
                     ELSE NULL END,
                CASE WHEN property_record.bathrooms IS NOT NULL
                     THEN property_record.bathrooms::integer
                     ELSE NULL END,
                CASE WHEN property_record.area IS NOT NULL
                     THEN property_record.area::integer
                     ELSE NULL END,
                CASE WHEN property_record.plot_area IS NOT NULL
                     THEN property_record.plot_area::integer
                     ELSE NULL END,
                CASE WHEN property_record.distance_to_city IS NOT NULL
                     THEN property_record.distance_to_city::integer
                     ELSE NULL END,
                CASE WHEN property_record.distance_to_sea IS NOT NULL
                     THEN property_record.distance_to_sea::integer
                     ELSE NULL END,
                CASE WHEN property_record.distance_to_lake IS NOT NULL
                     THEN property_record.distance_to_lake::integer
                     ELSE NULL END,
                CASE WHEN property_record.images IS NOT NULL AND array_length(property_record.images, 1) > 0
                     THEN property_record.images[1:10] -- Limit to 10 images
                     ELSE NULL END,
                CASE WHEN property_record.videos IS NOT NULL AND array_length(property_record.videos, 1) > 0
                     THEN property_record.videos[1:3] -- Limit to 3 videos
                     ELSE NULL END,
                actual_owner_id,
                owner_type,
                'published' -- Auto-publish imported properties
            )
            RETURNING id INTO property_record.id;

            created_properties := array_append(created_properties, property_record.id);
        END;
    END LOOP;

    -- Return results
    RETURN json_build_object(
        'success', true,
        'processed', array_length(properties_data, 1),
        'created', array_length(created_properties, 1),
        'property_ids', created_properties
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'processed', 0,
            'created', 0
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_xml_properties(TEXT, UUID) TO authenticated;