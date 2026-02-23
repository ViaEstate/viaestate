/**
 * massTranslate.ts
 * 
 * Script för mass-översättning av properties i Supabase via LibreTranslate.
 * Stöder både Docker och Cloud API
 * 
 * - Batchar 100 properties per gång
 * - 5 parallella översättningar
 * - Kör 1 språk i taget
 * - Uppdaterar endast om översättning är null
 * - Loggar framsteg och fel
 * 
 * Användning:
 * 1. Docker: cd translation && docker compose up -d
 *    Eller Cloud: Sätt TRANSLATION_METHOD=cloud i .env
 * 2. Kör scriptet: bun run translate
 * 
 * Miljövariabler:
 * - TRANSLATION_METHOD=docker|cloud (standard: docker)
 * - VITE_LIBRETRANSLATE_API_KEY (för cloud-läge)
 */

import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// --- Supabase setup ---
// Använd SERVICE_KEY för att ha skrivrättigheter
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

// --- Configuration ---
const BATCH_SIZE = 100;             // properties per batch
const CONCURRENCY = 5;              // antal parallella API-anrop

// Välj översättningsmetod: "docker" eller "cloud" (standard: docker)
const USE_DOCKER = process.env.TRANSLATION_METHOD !== 'cloud';

// LibreTranslate-inställningar
const LIBRE_DOCKER_URL = "http://localhost:5001/translate"; // Docker LibreTranslate på port 5001
const LIBRE_CLOUD_URL = "https://api.libretranslate.com/v1/translate"; // Cloud API
const LIBRE_API_KEY = process.env.VITE_LIBRETRANSLATE_API_KEY;

// Välj URL baserat på metod
const LIBRE_URL = USE_DOCKER ? LIBRE_DOCKER_URL : LIBRE_CLOUD_URL;

console.log(`📡 Using translation method: ${USE_DOCKER ? 'Docker' : 'Cloud API'}`);
console.log(`🌐 Translation URL: ${LIBRE_URL}`);

// Language mapping - database field names match existing schema
const LANGUAGES: Record<string, { code: string; fieldPrefix: string; name: string }> = {
  sv: { code: "sv", fieldPrefix: "swedish", name: "Swedish" },
  nb: { code: "nb", fieldPrefix: "norwegian", name: "Norwegian" },
  da: { code: "da", fieldPrefix: "danish", name: "Danish" },
  fi: { code: "fi", fieldPrefix: "finnish", name: "Finnish" }
};

// --- Helper: translate text via LibreTranslate ---
async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || text.trim() === "") return "";
  
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: Record<string, string> = { 
      q: text, 
      source: "en", 
      target: targetLang 
    };

    // Lägg till API-nyckel om vi använder cloud
    if (!USE_DOCKER && LIBRE_API_KEY && LIBRE_API_KEY !== 'your_libretranslate_api_key_here') {
      headers["X-LibreTranslate-API-Key"] = LIBRE_API_KEY;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(LIBRE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LibreTranslate error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { translatedText?: string };
    return data.translatedText || "";
  } catch (error) {
    console.error(`Translation error for "${text.substring(0, 30)}...":`, error);
    throw error;
  }
}

// --- Helper: batch processing ---
async function processBatch(languageKey: string, langConfig: { code: string; fieldPrefix: string; name: string }) {
  const fieldTitle = `${langConfig.fieldPrefix}_title`;
  const fieldDescription = `${langConfig.fieldPrefix}_description`;

  console.log(`\n📥 Fetching batch for ${langConfig.name} (checking ${fieldTitle} IS NULL)...`);

  // Hämta properties med NULL i detta språkfält
  // Vi behöver både english_title (source) och eventuellt en beskrivning
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, title, description, english_title")
    .or(`${fieldTitle}.is.null,${fieldTitle}.eq."")`)
    .limit(BATCH_SIZE);

  if (error) {
    console.error("❌ Error fetching properties:", error);
    return 0;
  }

  if (!properties || properties.length === 0) {
    console.log(`✅ No more properties to translate for ${langConfig.name}`);
    return 0;
  }

  console.log(`🔄 Translating batch of ${properties.length} properties to ${langConfig.name}...`);

  // Kör parallellt med max CONCURRENCY
  const queue = [...properties];
  let processed = 0;
  let failed = 0;

  async function worker() {
    while (queue.length > 0) {
      const property = queue.shift();
      if (!property) break;

      try {
        // Använd english_title om det finns, annars använd title som källa
        const sourceTitle = property.english_title || property.title || "";
        const sourceDescription = property.description || "";

        if (!sourceTitle && !sourceDescription) {
          console.warn(`⚠️ Property ${property.id} has no source text, skipping`);
          continue;
        }

        const translatedTitle = await translateText(sourceTitle, langConfig.code);
        
        // Översätt beskrivningen endast om det finns en källa
        let translatedDescription = "";
        if (sourceDescription) {
          translatedDescription = await translateText(sourceDescription, langConfig.code);
        }

        // Uppdatera Supabase
        const updateData: Record<string, any> = {};
        if (translatedTitle) updateData[fieldTitle] = translatedTitle;
        if (translatedDescription) updateData[fieldDescription] = translatedDescription;

        if (Object.keys(updateData).length === 0) {
          console.warn(`⚠️ No translations for property ${property.id}`);
          continue;
        }

        const { error: updateError } = await supabase
          .from("properties")
          .update(updateData)
          .eq("id", property.id);

        if (updateError) {
          console.error(`❌ Failed to update property ${property.id}:`, updateError);
          failed++;
        } else {
          console.log(`✅ Updated property ${property.id} to ${langConfig.name}`);
          processed++;
        }

        // Lite fördröjning för att undvika rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (e) {
        console.error(`❌ Error translating property ${property.id}:`, e);
        failed++;
      }
    }
  }

  // Starta CONCURRENCY workers
  const workers = Array(CONCURRENCY).fill(null).map(() => worker());
  await Promise.all(workers);

  console.log(`📊 Batch complete: ${processed} processed, ${failed} failed`);
  return properties.length;
}

// --- Main loop per språk ---
async function main() {
  console.log("🚀 Starting mass translation script...");
  console.log(`📡 LibreTranslate URL: ${LIBRE_URL}`);
  console.log(`📦 Batch size: ${BATCH_SIZE}, Concurrency: ${CONCURRENCY}`);
  
  // Verifiera LibreTranslate-anslutning
  if (USE_DOCKER) {
    try {
      const healthCheck = await fetch("http://localhost:5001/health");
      if (healthCheck.ok) {
        console.log("✅ LibreTranslate Docker is running");
      } else {
        console.error("❌ LibreTranslate Docker health check failed");
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Cannot connect to LibreTranslate Docker. Is Docker running?");
      console.error("   Run: cd translation && docker compose up -d");
      console.error("   Or set TRANSLATION_METHOD=cloud in .env to use cloud API instead");
      process.exit(1);
    }
  } else {
    // Cloud API - verifiera att API-nyckel finns
    if (!LIBRE_API_KEY || LIBRE_API_KEY === 'your_libretranslate_api_key_here') {
      console.error("❌ LibreTranslate cloud API requires VITE_LIBRETRANSLATE_API_KEY in .env");
      process.exit(1);
    }
    console.log("✅ Using LibreTranslate Cloud API");
  }

  const startTime = Date.now();
  let totalTranslated = 0;

  for (const [langKey, langConfig] of Object.entries(LANGUAGES)) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🌐 Starting translation for ${langConfig.name} (${langKey})`);
    console.log("=".repeat(60));

    let processed: number;
    let batchNum = 0;
    
    do {
      batchNum++;
      console.log(`\n📦 Batch #${batchNum}`);
      processed = await processBatch(langKey, langConfig);
      totalTranslated += processed;
    } while (processed > 0);

    console.log(`\n✅ Completed translation for ${langConfig.name}`);
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎉 All translations done!`);
  console.log(`📊 Total properties processed: ${totalTranslated}`);
  console.log(`⏱️  Total time: ${duration}s`);
  console.log("=".repeat(60));
}

main().catch(console.error);
