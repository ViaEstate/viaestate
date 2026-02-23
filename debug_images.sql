-- Debug image extraction from Croatia XML
CREATE OR REPLACE FUNCTION debug_croatia_images(xml_url TEXT, object_index INTEGER DEFAULT 1)
RETURNS JSON AS $$
DECLARE
    xml_content TEXT;
    image_urls TEXT[];
    raw_images XML[];
BEGIN
    SELECT content INTO xml_content FROM http_get(xml_url);

    IF xml_content IS NULL OR xml_content = '' THEN
        RETURN json_build_object('error', 'Failed to fetch XML');
    END IF;

    -- Test different XPath approaches
    SELECT xpath('//object[' || object_index || ']/object_images/image', xml_content::xml) INTO raw_images;

    image_urls := ARRAY(
        SELECT trim(substring(x::text from 10 for length(x::text) - 12))
        FROM unnest(raw_images) AS t(x)
        WHERE trim(x::text) != ''
    );

    RETURN json_build_object(
        'object_index', object_index,
        'raw_images_count', array_length(raw_images, 1),
        'image_urls', image_urls,
        'first_raw', (raw_images[1])::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION debug_croatia_images(TEXT, INTEGER) TO authenticated;