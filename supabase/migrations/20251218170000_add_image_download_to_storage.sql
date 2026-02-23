-- Add image download to Supabase Storage functionality
-- This migration updates the Croatia import function to download images to Storage

-- Check for available HTTP extensions
DO $$
BEGIN
    -- Try pg_net first (Supabase standard)
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        CREATE EXTENSION IF NOT EXISTS "pg_net";
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net extension not available, trying http extension';
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
            CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No HTTP extension available, image download will use fallback URLs';
    END;
END $$;

-- Update the import function to download images to Storage
DROP FUNCTION IF EXISTS process_croatia_xml_simple(TEXT, UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION process_croatia_xml_simple(xml_url TEXT, owner_id UUID DEFAULT NULL, batch_size INTEGER DEFAULT 10, offset_count INTEGER DEFAULT 0)
RETURNS JSON AS $$
DECLARE
    xml_content TEXT;
    objects XML[];
    new_id UUID;
    processed_count INT := 0;
    created_count INT := 0;
    updated_count INT := 0;
    skipped_count INT := 0;
    error_count INT := 0;
    image_urls TEXT[];
    storage_urls TEXT[];
    obj_id TEXT;
    obj_type TEXT;
    obj_price TEXT;
    city TEXT;
    country TEXT;
    description TEXT;
    bedrooms TEXT;
    bathrooms TEXT;
    living_area TEXT;
    price_value NUMERIC := 0;
    errors TEXT[] := ARRAY[]::TEXT[];
    i INT;
    start_index INT;
    end_index INT;
    actual_owner_id UUID;
    upload_response TEXT;
    supabase_project_url TEXT := 'https://mjtotgylgnmlpgyzxadj.supabase.co';
BEGIN
    -- Hantera owner_id
    IF owner_id IS NOT NULL THEN
        actual_owner_id := owner_id;
    ELSE
        -- För test, använd första admin-användaren
        SELECT id INTO actual_owner_id
        FROM profiles
        WHERE role = 'admin' AND status = 'approved'
        ORDER BY created_at LIMIT 1;

        IF actual_owner_id IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'No admin user found and no owner_id provided');
        END IF;
    END IF;

    SELECT content INTO xml_content FROM http_get(xml_url);

    IF xml_content IS NULL OR xml_content = '' THEN
        RETURN json_build_object('success', false, 'error', 'Failed to fetch XML');
    END IF;

    objects := xpath('//object', xmlparse(document xml_content));

    -- Calculate batch range
    start_index := offset_count + 1;
    end_index := LEAST(offset_count + batch_size, array_length(objects, 1));

    FOR i IN start_index..end_index LOOP
        processed_count := processed_count + 1;

        -- Extract all data for this object
        obj_id := (xpath('//object[' || i || ']/object_id/text()', xml_content::xml))[1]::text;
        obj_type := (xpath('//object[' || i || ']/object_type/text()', xml_content::xml))[1]::text;
        obj_price := (xpath('//object[' || i || ']/object_price/text()', xml_content::xml))[1]::text;
        city := (xpath('//object[' || i || ']/object_address/object_city/text()', xml_content::xml))[1]::text;
        country := (xpath('//object[' || i || ']/object_address/object_country/text()', xml_content::xml))[1]::text;
        description := (xpath('//object[' || i || ']/object_descriptions/object_description/text()', xml_content::xml))[1]::text;
        bedrooms := (xpath('//object[' || i || ']/object_bedrooms/text()', xml_content::xml))[1]::text;
        bathrooms := (xpath('//object[' || i || ']/object_bathrooms/text()', xml_content::xml))[1]::text;
        living_area := (xpath('//object[' || i || ']/living_area_unit/text()', xml_content::xml))[1]::text;

        -- Fixed image extraction for CDATA
        image_urls := ARRAY(
            SELECT trim(substring(x::text from 17 for length(x::text) - 27))
            FROM unnest(xpath('//object[' || i || ']/object_images/image', xml_content::xml)) AS t(x)
            WHERE length(x::text) > 27
        );

        RAISE NOTICE 'Property %: Found % images', obj_id, array_length(image_urls, 1);
        IF array_length(image_urls, 1) > 0 THEN
            RAISE NOTICE 'First image URL: %', image_urls[1];
        END IF;

        IF obj_id IS NULL OR obj_id = '' THEN
            errors := array_append(errors, 'Object ' || i || ': Missing object_id');
            CONTINUE;
        END IF;

        IF EXISTS (SELECT 1 FROM properties WHERE xml_object_id = obj_id) THEN
            -- Uppdatera alltid bilder
            UPDATE properties SET
                images = image_urls,
                updated_at = NOW()
            WHERE xml_object_id = obj_id;
            updated_count := updated_count + 1;
            CONTINUE;
        END IF;

        -- Download images to Storage
        storage_urls := ARRAY[]::TEXT[];
        IF array_length(image_urls, 1) > 0 THEN
            FOR j IN 1..LEAST(array_length(image_urls, 1), 10) LOOP
                BEGIN
                    -- Call Edge Function to download and upload image
                    RAISE NOTICE 'Calling Edge Function for image % of property %: %', j, obj_id, image_urls[j];

                    -- Try pg_net first, then http extension
                    BEGIN
                        SELECT content INTO upload_response
                        FROM net.http_post(
                            url := supabase_project_url || '/functions/v1/download-image',
                            body := json_build_object(
                                'imageUrl', image_urls[j],
                                'propertyId', obj_id,
                                'imageIndex', j
                            ),
                            headers := jsonb_build_object(
                                'Content-Type', 'application/json',
                                'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'service_role_key'
                            )
                        );
                    EXCEPTION WHEN undefined_function THEN
                        -- Fallback to http extension
                        SELECT content INTO upload_response
                        FROM extensions.http_post(
                            supabase_project_url || '/functions/v1/download-image',
                            json_build_object(
                                'imageUrl', image_urls[j],
                                'propertyId', obj_id,
                                'imageIndex', j
                            )::text,
                            'application/json'
                        );
                    END;

                    RAISE NOTICE 'Edge Function response for image %: %', j, upload_response;

                    -- Parse response
                    IF upload_response::json->>'success' = 'true' THEN
                        storage_urls := array_append(storage_urls, upload_response::json->>'url');
                        RAISE NOTICE 'Successfully uploaded image % to: %', j, upload_response::json->>'url';
                    ELSE
                        -- Fallback: keep original URL
                        storage_urls := array_append(storage_urls, image_urls[j]);
                        errors := array_append(errors, 'Object ' || obj_id || ': Failed to upload image ' || j || ': ' || (upload_response::json->>'error'));
                        RAISE NOTICE 'Failed to upload image %: %', j, (upload_response::json->>'error');
                    END IF;
                EXCEPTION WHEN OTHERS THEN
                    -- Fallback: keep original URL
                    storage_urls := array_append(storage_urls, image_urls[j]);
                    errors := array_append(errors, 'Object ' || obj_id || ': Exception uploading image ' || j || ': ' || SQLERRM);
                    RAISE NOTICE 'Exception uploading image %: %', j, SQLERRM;
                END;
            END LOOP;
        END IF;

        -- Extract price
        price_value := 0;
        IF obj_price NOT ILIKE '%Price%' AND obj_price ~ '^[0-9]+(\.[0-9]+)?$' THEN
            BEGIN
                price_value := obj_price::numeric;
            EXCEPTION
                WHEN OTHERS THEN
                    price_value := 0;
            END;
        END IF;

        BEGIN
            INSERT INTO properties (
                title,
                description,
                country,
                city,
                price,
                property_type,
                bedrooms,
                bathrooms,
                area,
                images,
                status,
                seller_id,
                seller_type,
                xml_object_id
            ) VALUES (
                COALESCE(obj_type, 'Property') || ' in ' || COALESCE(city, 'Unknown'),
                COALESCE(description, 'No description available'),
                COALESCE(country, 'Croatia'),
                COALESCE(city, 'Unknown'),
                price_value,
                lower(COALESCE(obj_type, 'house')),
                CASE WHEN bedrooms ~ '^[0-9]+$' THEN bedrooms::integer ELSE NULL END,
                CASE WHEN bathrooms ~ '^[0-9]+$' THEN bathrooms::integer ELSE NULL END,
                CASE WHEN living_area ~ '^[0-9]+(\.[0-9]+)?$' THEN living_area::integer ELSE NULL END,
                storage_urls, -- Use Storage URLs instead of external URLs
                'published',
                actual_owner_id,
                'broker',
                obj_id
            )
            RETURNING id INTO new_id;

            IF new_id IS NOT NULL THEN
                created_count := created_count + 1;
            ELSE
                errors := array_append(errors, 'Object ' || obj_id || ': INSERT returned NULL');
                error_count := error_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            errors := array_append(errors, 'Object ' || obj_id || ': ' || SQLERRM);
            error_count := error_count + 1;
        END;

    END LOOP;

    RETURN json_build_object(
        'success', true,
        'processed', processed_count,
        'created', created_count,
        'updated', updated_count,
        'skipped', skipped_count,
        'errors', error_count,
        'error_samples', errors[1:5],
        'batch_offset', offset_count,
        'batch_size', batch_size,
        'has_more', end_index < array_length(objects, 1)
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION process_croatia_xml_simple(TEXT, UUID, INTEGER, INTEGER) TO authenticated;