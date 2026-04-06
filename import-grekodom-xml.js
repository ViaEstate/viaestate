// import-grekodom-xml.js - Script för att importera Grekodom XML och ladda upp bilder till Supabase
import 'dotenv/config';
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import path from "path";
import crypto from "crypto";
import OpenAI from 'openai';

// =====================================================
// GREKODOM XML IMPORT SCRIPT
// This script imports properties from grekodom.xml
// =====================================================

// Static configuration - DO NOT CHANGE unless you know what you're doing
const GREKODOM_XML_FILE = "./grekodom.xml";

// Supabase configuration - set these as environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Other settings
const BUCKET = "property-images";
const DEFAULT_OWNER_ID = "48c20fcc-38d4-4e95-9d43-d46cd578bc97";

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required!");
  console.error("\nSet them with:");
  console.error("  export SUPABASE_URL='your-url'");
  console.error("  export SUPABASE_SERVICE_KEY='your-key'");
  console.error("\nOr create a .env file in the project root.");
  process.exit(1);
}

console.log("===========================================");
console.log("  GREKODOM XML IMPORT");
console.log("===========================================");
console.log(`📁 XML file: ${GREKODOM_XML_FILE}`);
console.log(`☁️  Supabase: ${SUPABASE_URL}`);
console.log("===========================================\n");

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
    const hash = crypto.createHash("md5").update(originalUrl || 'default').digest("hex");
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
  // Validate URL before attempting download
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    console.warn(`⚠️ Ogiltig bild-URL: ${url}`);
    return null;
  }
  
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

// Map Grekodom property type to standard type
function mapPropertyType(grekodomType) {
  if (!grekodomType || grekodomType.trim() === '') {
    return 'apartment'; // Default
  }
  
  const type = grekodomType.toLowerCase();
  
  if (type.includes('house') || type.includes('villa') || type.includes('detached')) {
    return 'house';
  } else if (type.includes('apartment') || type.includes('flat')) {
    return 'apartment';
  } else if (type.includes('studio')) {
    return 'studio';
  } else if (type.includes('land') || type.includes('plot')) {
    return 'land';
  } else if (type.includes('commercial') || type.includes('business')) {
    return 'commercial';
  }
  
  return 'apartment'; // Default
}

async function main() {
  console.log("🚀 Startar Grekodom XML-import...\n");

  try {
    // 1. Läs XML från fil
    const xml = await loadXmlFromFile(GREKODOM_XML_FILE);

    // 2. Parsa XML
    console.log("🔍 Parsar XML...");
    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: false
    });

    // 3. Extrahera properties från Grekodom-format
    let properties = [];
    if (parsed.properties && parsed.properties.property) {
      properties = Array.isArray(parsed.properties.property)
        ? parsed.properties.property
        : [parsed.properties.property];
    }

    const totalBeforeDedup = properties.length;
    
    // Deduplicera fastigheter baserat på xml_object_id (förhindrar import av dubbletter)
    const uniqueMap = new Map();
    for (const prop of properties) {
      const objId = prop.xml_object_id || prop.reference;
      if (!uniqueMap.has(objId)) {
        uniqueMap.set(objId, prop);
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
        // Extrahera fält från Grekodom-format
        const xmlObjectId = prop.xml_object_id || `grekodom_${i}`;
        const reference = prop.reference || `Grekodom-${xmlObjectId}`;
        const title = prop.title || "Untitled Property";
        const rawDescription = prop.description || "No description available";
        const description = decodeHtmlEntities(rawDescription);
        
        // Location
        const location = prop.location || prop.city || prop.region || "Unknown Location";
        
        // Country - Grekodom är alltid Greece
        const country = prop.country || "Greece";

        // Hantera pris - hantera både vanliga strängar och objekt från xml2js (när element har attribut)
        let price = 0;
        if (prop.price) {
          // Om price är ett objekt med _ (text content) eller $ (attributes)
          let priceValue = prop.price;
          if (typeof priceValue === 'object' && priceValue._) {
            priceValue = priceValue._;
          } else if (typeof priceValue === 'object' && priceValue.$ && priceValue.$.formatted) {
            // Försök först med attributet om det finns
            const attrValue = priceValue.$.formatted;
            const attrMatch = attrValue.replace(/[^\d]/g, '');
            if (attrMatch) {
              price = parseFloat(attrMatch);
              priceValue = null; // Använd attributet istället
            }
          }
          
          if (priceValue && typeof priceValue === 'string' && priceValue !== '0') {
            let cleanPrice = priceValue.replace(/€/g, '').replace(/\s/g, '').trim();
            // Ta bort decimaldel (komma = decimalseparator i europeiskt format)
            if (cleanPrice.includes(',')) {
              cleanPrice = cleanPrice.split(',')[0];
            }
            // Ta bort tusentalsavgränsare (punkter i europeiskt format)
            cleanPrice = cleanPrice.replace(/\./g, '');
            const match = cleanPrice.match(/(\d+)/);
            if (match) price = parseFloat(match[1]);
          }
        }

        // Area (Grekodom har area i m²)
        let area = null;
        if (prop.area && prop.area !== '0') {
          const areaMatch = prop.area.toString().match(/(\d+)/);
          if (areaMatch) area = parseInt(areaMatch[1]);
        }

        // Rooms och baths - dessa finns inte i Grekodom XML så vi sätter null
        const bedrooms = null; // Finns inte i Grekodom
        const bathrooms = null; // Finns inte i Grekodom

        // Plot/land - finns inte i Grekodom XML
        const plotArea = null;

        // Property type
        const propertyType = mapPropertyType(prop.property_type);

        console.log(`📝 ${title} - ${location}, ${country} - €${price.toLocaleString()}`);

        // Extrahera bilder - hantera både strängar och objekt med @-attribut
        let imageUrls = [];
        if (prop.images && prop.images.image) {
          const rawImages = Array.isArray(prop.images.image) ? prop.images.image : [prop.images.image];
          imageUrls = rawImages
            .filter(img => img)
            .map(img => {
              // Om det är en sträng, returnera den direkt
              if (typeof img === 'string') return img.trim();
              // Om det är ett objekt med $-attribut (xml2js default), använd det
              if (typeof img === 'object' && img.$) return img._ || img.$['text'] || Object.values(img)[0];
              // Annars, försök konvertera till sträng
              return String(img).trim();
            })
            .filter(url => url && url.startsWith('http'));
        }

        console.log(`🖼️ Hittade ${imageUrls.length} bilder`);

        // Ladda ner och ladda upp bilder (max 10 per property)
        const uploadedImages = [];
        const maxImages = Math.min(imageUrls.length, 10);

        for (let j = 0; j < maxImages; j++) {
          const imgUrl = imageUrls[j];
          const buffer = await downloadImageToBuffer(imgUrl);

          if (buffer) {
            const filename = `grekodom/${reference}/${makeSafeFilename(imgUrl)}`;
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

        // Endast fält som finns i databasen
        const propertyData = {
          xml_object_id: xmlObjectId,
          title: title.substring(0, 255),
          description,
          english_description: englishDescription,
          country,
          city: location,
          price,
          property_type: propertyType,
          bedrooms,
          bathrooms,
          area,
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
