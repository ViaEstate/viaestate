// import-kyero-feed.js - Standalone script för att importera KYERO XML och ladda upp bilder till Supabase
import 'dotenv/config';
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import path from "path";
import crypto from "crypto";
import OpenAI from 'openai';

// Konfiguration - sätt dina värden här eller använd ENV-variabler
const SUPABASE_URL = process.env.SUPABASE_URL || "din-supabase-url-här";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "din-service-key-här";
const FEED_URL = process.env.KYERO_FEED_URL || "./sample-properties.xml";
const BUCKET = "property-images";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL === "din-supabase-url-här") {
  console.error("❌ Konfigurera SUPABASE_URL och SUPABASE_SERVICE_KEY först!");
  console.error("Använd ENV-variabler eller redigera scriptet direkt.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initialize OpenAI client for translations
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to decode HTML entities
function decodeHtmlEntities(text) {
  if (!text) return text;

  // Manual decoding of common HTML entities
  return text
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/'/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

// Function to infer property type from title
function inferPropertyType(title) {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('villa') || titleLower.includes('detached')) return 'villa';
  if (titleLower.includes('apartment') || titleLower.includes('flat')) return 'apartment';
  if (titleLower.includes('house')) return 'house';
  if (titleLower.includes('penthouse')) return 'penthouse';
  if (titleLower.includes('townhouse')) return 'townhouse';
  if (titleLower.includes('commercial')) return 'commercial';
  if (titleLower.includes('land')) return 'land';
  return 'house'; // default
}

// Translation functions
async function detectLanguage(text) {
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

async function translateText(text, targetLang, sourceLang = 'auto') {
  if (!text || text.trim().length === 0 || targetLang === sourceLang) {
    return text;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text to ${targetLang === 'sv' ? 'Swedish' : 
                     targetLang === 'nb' ? 'Norwegian' : 
                     targetLang === 'da' ? 'Danish' : 
                     targetLang === 'fi' ? 'Finnish' : 
                     'English'}. Maintain a natural, professional tone suitable for real estate descriptions. Keep the translation concise but complete.`
        },
        {
          role: 'user',
          content: `Translate this text to ${targetLang === 'sv' ? 'Swedish' : 
                     targetLang === 'nb' ? 'Norwegian' : 
                     targetLang === 'da' ? 'Danish' : 
                     targetLang === 'fi' ? 'Finnish' : 
                     'English'}: "${text}"`
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

async function translateToEnglish(text, sourceLang) {
  return translateText(text, 'en', sourceLang);
}

function makeSafeFilename(originalUrl) {
  try {
    const url = new URL(originalUrl);
    const ext = path.extname(url.pathname) || ".jpg";
    const hash = crypto.createHash("md5").update(originalUrl).digest("hex");
    return `${hash}${ext}`;
  } catch (e) {
    // Fallback om URL inte är valid
    const hash = crypto.createHash("md5").update(originalUrl).digest("hex");
    return `${hash}.jpg`;
  }
}

async function fetchXml(url) {
  console.log(`📡 Hämtar XML från: ${url}`);
  const res = await fetch(url, {
    redirect: "follow",
    timeout: 30000 // 30 sekunder timeout
  });

  if (!res.ok) {
    throw new Error(`Kunde inte hämta XML: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  console.log(`✅ XML hämtad (${text.length} tecken)`);
  return text;
}

async function downloadImageToBuffer(url) {
  try {
    console.log(`🖼️ Laddar ner bild: ${url}`);
    const res = await fetch(url, {
      redirect: "follow",
      timeout: 15000 // 15 sekunder för bilder
    });

    if (!res.ok) {
      throw new Error(`Bild gav status ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    console.log(`✅ Bild nedladdad (${buffer.byteLength} bytes)`);
    return Buffer.from(buffer);
  } catch (err) {
    console.warn(`⚠️ Kunde inte ladda ner bild ${url}:`, err.message);
    return null;
  }
}

async function uploadToSupabase(buffer, filename, contentType = "image/jpeg") {
  try {
    console.log(`☁️ Laddar upp ${filename} till Supabase Storage...`);

    const { data, error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
      contentType,
      upsert: true // Tillåt överskrivning
    });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      return null;
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
    console.log(`✅ Uppladdad: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Startar KYERO XML-import...\n");

  try {
    // 1. Hämta XML
    const xml = await fetchXml(FEED_URL);

    // 2. Parsa XML
    console.log("🔍 Parsar XML...");
    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: false
    });

    // 3. Extrahera properties från flat XML format
    let properties = [];
    if (parsed.properties && parsed.properties.property) {
      properties = Array.isArray(parsed.properties.property)
        ? parsed.properties.property
        : [parsed.properties.property];
    }

    console.log(`📊 Hittade ${properties.length} fastigheter i KYERO-feed\n`);

    let successCount = 0;
    let errorCount = 0;
    let totalImages = 0;

    // 4. Bearbeta varje property
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      console.log(`\n🏠 Bearbetar fastighet ${i + 1}/${properties.length}...`);

      try {
        // Extrahera fält från flat XML format
        const externalId = prop.reference || `property_${i}`;
        const title = prop.title || "Untitled Property";
        const rawDescription = prop.description || "No description available";
        const description = decodeHtmlEntities(rawDescription);
        const country = "Spain"; // Hardcoded for Spain properties
        const city = prop.location || "Unknown City";

        // Parse price (e.g., "590.000 €" -> 590000)
        const priceStr = prop.price || "";
        let price = 0;
        const priceMatch = priceStr.match(/(\d+(?:\.\d+)*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(/\./g, ''));
        }

        // Infer property type from title
        const propertyType = inferPropertyType(title);

        // Parse numeric fields
        const bedrooms = prop.rooms ? parseInt(prop.rooms) : null;
        const bathrooms = prop.baths ? parseInt(prop.baths) : null;
        const area = prop.area ? parseInt(prop.area.match(/(\d+)/)?.[1]) : null;
        const plotArea = prop.plot ? parseInt(prop.plot.match(/(\d+)/)?.[1]) : null;

        // Additional fields
        const terrace = prop.terrace || null;
        const ibiFees = prop.ibi_fees || null;
        const communityFees = prop.community_fees || null;
        const basuraTax = prop.basura_tax || null;
        const reference = prop.reference || null;

        console.log(`📝 ${title} - ${city}, ${country} - €${price.toLocaleString()}`);

        // Extrahera bilder från flat format
        let imageUrls = [];
        if (prop.images && prop.images.image) {
          const images = Array.isArray(prop.images.image) ? prop.images.image : [prop.images.image];
          imageUrls = images.map(img => img).filter(Boolean);
        }

        console.log(`🖼️ Hittade ${imageUrls.length} bilder`);

        // Ladda ner och ladda upp bilder (max 10 per property)
        const uploadedImages = [];
        const maxImages = Math.min(imageUrls.length, 10);

        for (let j = 0; j < maxImages; j++) {
          const imgUrl = imageUrls[j];
          const buffer = await downloadImageToBuffer(imgUrl);

          if (buffer) {
            const filename = `kyero/${externalId}/${makeSafeFilename(imgUrl)}`;
            const publicUrl = await uploadToSupabase(buffer, filename);

            if (publicUrl) {
              uploadedImages.push(publicUrl);
              totalImages++;
            }
          }
        }

        // Generera översättningar för alla språk
        console.log(`🌐 Kontrollerar översättning...`);
        const detectedLang = await detectLanguage(description);
        let englishTitle = title;
        let englishDescription = description;
        let swedishTitle = title;
        let swedishDescription = description;
        let norwegianTitle = title;
        let norwegianDescription = description;
        let danishTitle = title;
        let danishDescription = description;
        let finnishTitle = title;
        let finnishDescription = description;

        if (detectedLang !== 'en') {
          console.log(`🔄 Översätter från ${detectedLang} till engelska...`);
          englishTitle = await translateText(title, 'en', detectedLang);
          englishDescription = await translateText(description, 'en', detectedLang);
          console.log(`✅ Engelska översättning klar`);
        } else {
          console.log(`✅ Texten är redan på engelska`);
        }

        // Översätt till svenska, norsk, danska och finska om källspråket inte är det språket
        if (detectedLang !== 'sv') {
          console.log(`🔄 Översätter till svenska...`);
          swedishTitle = await translateText(title, 'sv', detectedLang);
          swedishDescription = await translateText(description, 'sv', detectedLang);
          console.log(`✅ Svenska översättning klar`);
        }
        
        if (detectedLang !== 'nb') {
          console.log(`🔄 Översätter till norsk...`);
          norwegianTitle = await translateText(title, 'nb', detectedLang);
          norwegianDescription = await translateText(description, 'nb', detectedLang);
          console.log(`✅ Norsk översättning klar`);
        }
        
        if (detectedLang !== 'da') {
          console.log(`🔄 Översätter till danska...`);
          danishTitle = await translateText(title, 'da', detectedLang);
          danishDescription = await translateText(description, 'da', detectedLang);
          console.log(`✅ Danska översättning klar`);
        }
        
        if (detectedLang !== 'fi') {
          console.log(`🔄 Översätter till finska...`);
          finnishTitle = await translateText(title, 'fi', detectedLang);
          finnishDescription = await translateText(description, 'fi', detectedLang);
          console.log(`✅ Finska översättning klar`);
        }

        // Spara property i databasen
        console.log(`💾 Sparar property i databasen...`);

        const propertyData = {
          title: title.substring(0, 255), // Begränsa längd
          description,
          english_title: englishTitle.substring(0, 255),
          english_description: englishDescription,
          swedish_title: swedishTitle.substring(0, 255),
          swedish_description: swedishDescription,
          norwegian_title: norwegianTitle.substring(0, 255),
          norwegian_description: norwegianDescription,
          danish_title: danishTitle.substring(0, 255),
          danish_description: danishDescription,
          finnish_title: finnishTitle.substring(0, 255),
          finnish_description: finnishDescription,
          country,
          city,
          price,
          property_type: propertyType,
          bedrooms,
          bathrooms,
          area,
          images: uploadedImages,
          status: 'published'
        };

        const { data, error } = await supabase
          .from("properties")
          .upsert([propertyData], {
            onConflict: "reference",
            ignoreDuplicates: false
          });

        if (error) {
          console.error("❌ Databasfel:", error);
          errorCount++;
        } else {
          console.log(`✅ Sparad: ${title} (${uploadedImages.length} bilder)`);
          successCount++;
        }

      } catch (err) {
        console.error(`❌ Fel vid hantering av fastighet ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    // Sammanfattning
    console.log(`\n🎉 Import klar!`);
    console.log(`📊 Sammanfattning:`);
    console.log(`   ✅ Lyckades: ${successCount} fastigheter`);
    console.log(`   ❌ Misslyckades: ${errorCount} fastigheter`);
    console.log(`   🖼️ Bilder uppladdade: ${totalImages}`);

  } catch (err) {
    console.error("💥 Fatalt fel:", err);
    process.exit(1);
  }
}

// Kör scriptet
main().catch(err => {
  console.error("💥 Oväntat fel:", err);
  process.exit(1);
});