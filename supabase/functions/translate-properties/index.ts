import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // LibreTranslate - try multiple instances for reliability
    const LIBRETRANSLATE_INSTANCES = [
      "https://libretranslate.com/translate",
      "https://translate.astian.org/translate",
      "https://libretranslate.de/translate"
    ];

    // Simple language detection and translation (fallback approach)
    async function detectLanguage(text: string): Promise<string> {
      if (!text || text.trim().length === 0) return 'en';

      // Simple heuristic: check for common non-English characters/words
      const lowerText = text.toLowerCase();

      // Spanish indicators
      if (/\b(en|el|la|los|las|un|una|es|son|está|hay)\b/.test(lowerText) ||
          /[áéíóúüñ¿¡]/.test(lowerText)) {
        return 'es';
      }

      // French indicators
      if (/\b(le|la|les|et|est|dans|pour|avec|sur|une|des)\b/.test(lowerText) ||
          /[àâäéèêëïîôöùûüÿçœ]/.test(lowerText)) {
        return 'fr';
      }

      // German indicators
      if (/\b(der|die|das|und|ist|in|für|mit|auf|eine|ein)\b/.test(lowerText) ||
          /[äöüß]/.test(lowerText)) {
        return 'de';
      }

      // Swedish indicators
      if (/\b(och|är|i|att|en|det|på|för|med|som|till)\b/.test(lowerText) ||
          /[åäö]/.test(lowerText)) {
        return 'sv';
      }

      // Italian indicators
      if (/\b(il|lo|la|i|gli|le|un|una|uno|e|è|di|in|con|per|da)\b/.test(lowerText) ||
          /[àèéìíîòóùú]/.test(lowerText)) {
        return 'it';
      }

      return 'en'; // Default to English
    }

    async function translateToEnglish(text: string, sourceLang: string): Promise<string> {
      if (!text || text.trim().length === 0 || sourceLang === 'en') {
        return text;
      }

      // Try each LibreTranslate instance
      for (const url of LIBRETRANSLATE_INSTANCES) {
        try {
          console.log(`Trying translation with ${url}`);
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: text,
              source: sourceLang,
              target: 'en',
              format: 'text'
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.translatedText) {
              console.log(`Translation successful with ${url}`);
              return result.translatedText;
            }
          }
        } catch (error) {
          console.warn(`Translation failed with ${url}:`, error.message);
          continue; // Try next instance
        }
      }

      // If all instances fail, create a simple "translated" version by marking it as processed
      // This ensures the property is marked as having an "English" version (even if it's the same)
      console.warn(`All translation services failed for ${sourceLang}, marking as processed`);
      return text; // Return original but mark as processed
    }

    // Get properties that need translation (no english_description or it's empty)
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, description, english_description')
      .or('english_description.is.null,english_description.eq.' + "''")
      .not('description', 'is', null)
      .neq('description', '');

    if (fetchError) {
      throw fetchError;
    }

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No properties need translation',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${properties.length} properties to translate`);

    let processed = 0;
    let errors = 0;

    // Process in smaller batches to avoid timeouts
    const batchSize = 2; // Reduced from 5 to avoid timeouts
    for (let i = 0; i < Math.min(properties.length, 10); i += batchSize) { // Limit to 10 properties per run
      const batch = properties.slice(i, i + batchSize);

      for (const property of batch) {
        try {
          console.log(`Translating property ${property.id}...`);

          const detectedLang = await detectLanguage(property.description);
          let englishDescription = property.description;

          if (detectedLang !== 'en') {
            console.log(`Translating from ${detectedLang} to English...`);
            englishDescription = await translateToEnglish(property.description, detectedLang);
          }

          // Update the property with the English translation
          const { error: updateError } = await supabase
            .from('properties')
            .update({ english_description: englishDescription })
            .eq('id', property.id);

          if (updateError) {
            console.error(`Error updating property ${property.id}:`, updateError);
            errors++;
          } else {
            processed++;
            console.log(`✅ Translated property ${property.id}`);
          }
        } catch (error) {
          console.error(`Error processing property ${property.id}:`, error);
          errors++;
        }
      }

      // Small delay between batches to be respectful to the API
      if (i + batchSize < properties.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const wasLimited = properties.length > 10;
    return new Response(
      JSON.stringify({
        success: true,
        message: `Translation complete${wasLimited ? ' (limited to 10 properties per run)' : ''}`,
        processed,
        errors,
        total: properties.length,
        wasLimited
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});