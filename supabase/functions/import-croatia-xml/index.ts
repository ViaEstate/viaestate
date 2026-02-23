import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY")!
  });

  // Translation functions
  async function detectLanguage(text: string): Promise<string> {
    if (!text || text.trim().length === 0) return 'en';

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a language detection expert. Respond with only the ISO 639-1 language code (e.g., "en", "es", "fr", "de", "sv").'
          },
          {
            role: 'user',
            content: `Detect the language of this text: "${text.substring(0, 500)}"`
          }
        ],
        max_tokens: 10,
        temperature: 0
      });

      return response.choices[0]?.message?.content?.trim().toLowerCase() || 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  async function translateToEnglish(text: string, sourceLang: string): Promise<string> {
    if (!text || text.trim().length === 0 || sourceLang === 'en') {
      return text;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the given text to English. Maintain a natural, professional tone suitable for real estate descriptions. Keep the translation concise but complete.'
          },
          {
            role: 'user',
            content: `Translate this text to English: "${text}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content?.trim() || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  const XML_URL =
    "https://croatiarealestates.com/wp-content/uploads/xmls/adriaxml.xml";

  const xmlText = await fetch(XML_URL).then(r => r.text());
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");

  const objects = Array.from(xml.querySelectorAll("object"));

  let created = 0;
  let skipped = 0;
  let imageErrors = 0;

  for (const obj of objects) {
    const external_id = obj.querySelector("object_id")?.textContent?.trim();
    if (!external_id) continue;

    const { data: exists } = await supabase
      .from("properties")
      .select("id")
      .eq("external_id", external_id)
      .maybeSingle();

    if (exists) {
      skipped++;
      continue;
    }

    const title = obj.querySelector("object_type")?.textContent ?? "Property";
    const description =
      obj.querySelector("object_description")?.textContent ?? "";
    const city = obj.querySelector("object_city")?.textContent ?? "";
    const country = obj.querySelector("object_country")?.textContent ?? "Croatia";

    const priceRaw = obj.querySelector("object_price")?.textContent ?? "0";
    const price = Number(priceRaw.replace(/[^\d]/g, "")) || 0;

    // Generate English translation if needed
    console.log("Checking translation for:", title);
    const detectedLang = await detectLanguage(description);
    let englishDescription = description;

    if (detectedLang !== 'en') {
      console.log(`Translating from ${detectedLang} to English...`);
      englishDescription = await translateToEnglish(description, detectedLang);
      console.log("Translation complete");
    } else {
      console.log("Description is already in English");
    }

    /* ---------- IMAGES ---------- */
    const imageNodes = Array.from(
      obj.querySelectorAll("object_images image")
    );

    const publicImages: string[] = [];
    let index = 1;

    for (const node of imageNodes) {
      const rawUrl = node.textContent?.trim();
      if (!rawUrl) continue;

      try {
        console.log(`Fetching image: ${rawUrl}`);
        const res = await fetch(rawUrl);
        if (!res.ok) {
          console.log(`Failed to fetch: ${res.status}`);
          continue;
        }

        const buffer = await res.arrayBuffer();
        const ext =
          rawUrl.split(".").pop()?.toLowerCase().replace(/[^a-z]/g, "") || "jpg";

        const fileName = `property_${external_id}_${index}.${ext}`;

        // Ladda upp och KOLLA resultatet
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, buffer, {
            contentType: `image/${ext}`,
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${fileName}:`, uploadError);
          imageErrors++;
          continue;
        }

        // Nu när vi vet att uppladdningen lyckades, hämta URL:en
        const { data } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);

        if (data?.publicUrl) {
          publicImages.push(data.publicUrl);
          console.log(`Successfully uploaded: ${data.publicUrl}`);
          index++;
        }
      } catch (error) {
        console.error(`Error processing image:`, error);
        imageErrors++;
      }
    }

    await supabase.from("properties").insert({
      external_id,
      title,
      description,
      english_description: englishDescription,
      city,
      country,
      price,
      images: publicImages,
      status: "published",
    });

    created++;
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: objects.length,
      created,
      skipped,
      imageErrors,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});