# Plan för Bildnedladdning till Supabase Storage

## Översikt
Implementera funktioner för att ladda ner bilder från externa XML-källor och spara dem i Supabase Storage under importprocessen. Detta löser CORS-problem och ger bättre prestanda.

## Arkitektur

### 1. PostgreSQL Funktioner
Skapa hjälpfunktioner för bildhantering:

#### `download_and_upload_image(image_url TEXT, property_id UUID, image_index INTEGER) RETURNS TEXT`
- Hämtar bilden från extern URL med `http_get`
- Laddar upp till Supabase Storage
- Returnerar den publika Storage-URL:en
- Hanterar fel och timeouts

#### `upload_to_supabase_storage(file_content BYTEA, file_name TEXT, bucket_name TEXT DEFAULT 'properties') RETURNS TEXT`
- Använder Supabase Storage REST API
- Kräver service role key för autentisering
- Returnerar publika URL:en för den uppladdade filen

### 2. Modifierad Importfunktion
Uppdatera `process_croatia_xml_simple` att:

1. För varje bild-URL i `image_urls`:
   - Anropa `download_and_upload_image()`
   - Ersätta extern URL med Storage-URL
   - Hoppa över om uppladdning misslyckas (behåll extern URL som fallback)

2. Spara endast Storage-URL:er i `images` arrayen

### 3. Supabase Storage Konfiguration
- Se till att `properties` bucket finns och är publik
- Konfigurera CORS-policies för bucket
- Sätta upp rättigheter för service role

## Implementation Steps

### Steg 1: Skapa Storage Upload Funktion
```sql
CREATE OR REPLACE FUNCTION upload_to_supabase_storage(
    file_content BYTEA,
    file_name TEXT,
    bucket_name TEXT DEFAULT 'properties'
) RETURNS TEXT AS $$
DECLARE
    supabase_url TEXT := 'https://[project-ref].supabase.co';
    service_key TEXT := '[service-role-key]';
    upload_url TEXT;
    response JSON;
BEGIN
    upload_url := supabase_url || '/storage/v1/object/' || bucket_name || '/' || file_name;

    -- Använd http_post eller liknande för att ladda upp
    -- Detta kräver en HTTP klient extension eller Edge Function

    RETURN supabase_url || '/storage/v1/object/public/' || bucket_name || '/' || file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Steg 2: Implementera Bildnedladdning
Eftersom PostgreSQL har begränsade HTTP-klientmöjligheter, använd Edge Function istället:

#### Skapa Edge Function: `supabase/functions/download-image/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const { imageUrl, propertyId, imageIndex } = await req.json()

  try {
    // Hämta bilden
    const response = await fetch(imageUrl)
    const imageBlob = await response.blob()

    // Skapa unikt filnamn
    const fileName = `property-${propertyId}-${imageIndex}.jpg`

    // Ladda upp till Storage
    const { data, error } = await supabase.storage
      .from('properties')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (error) throw error

    // Hämta publik URL
    const { data: { publicUrl } } = supabase.storage
      .from('properties')
      .getPublicUrl(fileName)

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

### Steg 3: Uppdatera Importfunktion
Modifiera bildprocesseringen i `process_croatia_xml_simple`:

```sql
-- För varje bild-URL
storage_urls := ARRAY[]::TEXT[];
FOR i IN 1..array_length(image_urls, 1) LOOP
    -- Anropa Edge Function för att ladda upp bilden
    SELECT content INTO upload_response
    FROM http_post(
        'https://[project-ref].supabase.co/functions/v1/download-image',
        json_build_object(
            'imageUrl', image_urls[i],
            'propertyId', new_id,
            'imageIndex', i
        )::text,
        'application/json'
    );

    -- Extrahera URL från response
    IF upload_response::json->>'success' = 'true' THEN
        storage_urls := array_append(storage_urls, upload_response::json->>'url');
    ELSE
        -- Fallback: behåll extern URL
        storage_urls := array_append(storage_urls, image_urls[i]);
    END IF;
END LOOP;

-- Använd storage_urls istället för image_urls
```

## Fördelar
- ✅ Ingen CORS-problem
- ✅ Bilder cachas i Supabase
- ✅ Bättre prestanda
- ✅ Kontroll över bildkvalitet/storlek

## Nackdelar
- ❌ Ökad komplexitet
- ❌ Extra HTTP-anrop per bild
- ❌ Lagringskostnader
- ❌ Kan ta längre tid att importera

## Alternativ Lösning
Använd en enkel CORS-proxy i frontend istället för nedladdning till Storage. Detta är enklare att implementera men kan vara mindre tillförlitligt.

## Nästa Steg
1. Implementera Edge Function för bilduppladdning
2. Testa funktionen med en enskild bild
3. Uppdatera importfunktionen
4. Testa full import