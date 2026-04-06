// import-custom-xml.js - Script för att importera anpassad XML och ladda upp bilder till Supabase
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
const XML_FILE_PATH = process.env.XML_FILE_PATH || "./casariviera.xml"; // Sökväg till din XML-fil
const BUCKET = "property-images";
const DEFAULT_OWNER_ID = "48c20fcc-38d4-4e95-9d43-d46cd578bc97"; // Admin user ID

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

async function translateToEnglish(text, sourceLang) {
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

async function loadXmlFromFile(filePath) {
  console.log(`📂 Läser XML från fil: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`XML-filen finns inte: ${filePath}`);
  }

  const xml = fs.readFileSync(filePath, 'utf8');
  console.log(`✅ XML läst (${xml.length} tecken)`);
  return xml;
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
  console.log("🚀 Startar anpassad XML-import...\n");

  try {
    // 1. Läs XML från fil
    const xml = await loadXmlFromFile(XML_FILE_PATH);

    // 2. Parsa XML
    console.log("🔍 Parsar XML...");
    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: false
    });

    // 3. Extrahera properties från anpassat format
    let properties = [];
    if (parsed.properties && parsed.properties.property) {
      properties = Array.isArray(parsed.properties.property)
        ? parsed.properties.property
        : [parsed.properties.property];
    }

    const totalBeforeDedup = properties.length;
    
    // Bilder att filtrera bort (logotyper, platshållare)
    const BLOCKED_IMAGE_PATTERNS = [
      /Bild1\.png/i,
      /logo/i,
      /placeholder/i,
    ];
    
    // Filtrera bort thumbnails (t.ex. -600x450.jpg, -150x150.jpg) och blockerade bilder
    function isValidPropertyImage(url) {
      if (!url) return false;
      // Filtrera thumbnails med dimensions-suffix som -600x450 eller -150x150
      if (/\-\d+x\d+\.(jpe?g|png|webp)$/i.test(url)) return false;
      // Filtrera blockerade mönster
      for (const pattern of BLOCKED_IMAGE_PATTERNS) {
        if (pattern.test(url)) return false;
      }
      return true;
    }
    
    // Deduplicera fastigheter baserat på reference och MERGA bilder från alla förekomster
    const uniqueMap = new Map();
    for (const prop of properties) {
      const ref = prop.reference;
      
      // Extrahera bilder från denna förekomst
      let newImgs = [];
      if (prop.images && prop.images.image) {
        const rawImgs = Array.isArray(prop.images.image) ? prop.images.image : [prop.images.image];
        newImgs = rawImgs
          .filter(img => img && img.trim())
          .map(img => img.trim())
          .filter(isValidPropertyImage);
      }
      
      if (!uniqueMap.has(ref)) {
        // Första gången vi ser denna ref — spara prop med filtrerade bilder
        const merged = { ...prop };
        merged._mergedImages = newImgs;
        uniqueMap.set(ref, merged);
      } else {
        // Merga in bilder från denna förekomst (undvik dubbletter)
        const existing = uniqueMap.get(ref);
        const existingSet = new Set(existing._mergedImages);
        for (const img of newImgs) {
          if (!existingSet.has(img)) {
            existing._mergedImages.push(img);
            existingSet.add(img);
          }
        }
      }
    }
    
    properties = Array.from(uniqueMap.values());
    console.log(`📊 Hittade ${properties.length} unika fastigheter i XML-filen (filtrerade från ${totalBeforeDedup} totalt)\n`);

    let successCount = 0;
    let errorCount = 0;
    let totalImages = 0;

    // 4. Bearbeta varje property
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      console.log(`\n🏠 Bearbetar fastighet ${i + 1}/${properties.length}...`);

      try {
        // Extrahera fält från anpassat format
        const reference = prop.reference || `custom_${i}`;
        const title = prop.title || "Untitled Property";
        const rawDescription = prop.description || "No description available";
        const description = decodeHtmlEntities(rawDescription);
        const location = prop.location || "Unknown Location";
        const country = "Italy"; // Kan anpassas baserat på dina behov

        // Hantera pris — stöder europeiskt format: "450.000,00 €" eller "450.000 €"
        const priceStr = prop.price || "0";
        let price = 0;
        if (priceStr && priceStr !== '0') {
          let cleanPrice = priceStr.replace(/€/g, '').replace(/\s/g, '').trim();
          // Ta bort decimaldel (komma = decimalseparator i europeiskt format)
          if (cleanPrice.includes(',')) {
            cleanPrice = cleanPrice.split(',')[0]; // "450.000,00" → "450.000"
          }
          // Ta bort tusentalsavgränsare (punkter i europeiskt format)
          cleanPrice = cleanPrice.replace(/\./g, '');
          const match = cleanPrice.match(/(\d+)/);
          if (match) price = parseFloat(match[1]);
        }

        // Extrahera andra fält
        const bedrooms = prop.rooms ? parseInt(prop.rooms) : null;
        const bathrooms = prop.baths ? parseInt(prop.baths) : null;

        // Hantera area (ta bort m²)
        let area = null;
        if (prop.area) {
          const areaMatch = prop.area.toString().match(/(\d+)/);
          if (areaMatch) area = parseInt(areaMatch[1]);
        }

        // Hantera plot area
        let plotArea = null;
        if (prop.plot && prop.plot !== '0 m²') {
          const plotMatch = prop.plot.toString().match(/(\d+)/);
          if (plotMatch) plotArea = parseInt(plotMatch[1]);
        }

        console.log(`📝 ${title} - ${location}, ${country} - €${price.toLocaleString()}`);

        // Använd de mergade och filtrerade bilderna (från dedup-steget ovan)
        const imageUrls = prop._mergedImages || [];

        console.log(`🖼️ Hittade ${imageUrls.length} bilder (efter filtrering av thumbnails/logotyper)`);

        // Ladda ner och ladda upp bilder (max 10 per property)
        const uploadedImages = [];
        const maxImages = Math.min(imageUrls.length, 10);

        for (let j = 0; j < maxImages; j++) {
          const imgUrl = imageUrls[j];
          const buffer = await downloadImageToBuffer(imgUrl);

          if (buffer) {
            const filename = `custom/${reference}/${makeSafeFilename(imgUrl)}`;
            const publicUrl = await uploadToSupabase(buffer, filename);

            if (publicUrl) {
              uploadedImages.push(publicUrl);
              totalImages++;
            }
          }
        }

        // Generera engelsk översättning om behövs
        console.log(`🌐 Kontrollerar översättning...`);
        const detectedLang = await detectLanguage(description);
        let englishDescription = description;

        if (detectedLang !== 'en') {
          console.log(`🔄 Översätter från ${detectedLang} till engelska...`);
          englishDescription = await translateToEnglish(description, detectedLang);
          console.log(`✅ Översättning klar`);
        } else {
          console.log(`✅ Beskrivningen är redan på engelska`);
        }

        // Spara property i databasen
        console.log(`💾 Sparar property i databasen...`);

        const propertyData = {
          xml_object_id: reference,
          title: title.substring(0, 255), // Begränsa längd
          description,
          english_description: englishDescription,
          country,
          city: location,
          price,
          property_type: 'apartment', // Kan anpassas baserat på typ
          bedrooms,
          bathrooms,
          area,
          plot_area: plotArea,
          images: uploadedImages,
          status: 'published',
          owner_id: DEFAULT_OWNER_ID,
          owner_type: 'broker',
          seller_id: DEFAULT_OWNER_ID,
          seller_type: 'broker'
        };

        console.log(`💾 Sparar property i databasen...`);
        console.log(`Property data:`, JSON.stringify(propertyData, null, 2));

        const { data, error } = await supabase
          .from("properties")
          .upsert([propertyData], { onConflict: 'xml_object_id' });

        if (error) {
          console.error("❌ Databasfel:", error);
          console.error("❌ Full error details:", JSON.stringify(error, null, 2));
          errorCount++;
        } else {
          console.log(`✅ Sparad: ${title} (${uploadedImages.length} bilder)`);
          console.log(`✅ Database response:`, data);
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