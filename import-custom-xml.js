// import-custom-xml.js - Förbättrad version med språkdetektering
import 'dotenv/config';
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import path from "path";

// ============================================================================
// KONFIGURATION
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL || "din-supabase-url-här";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "din-service-key-här";
const XML_FILE_PATH = process.env.XML_FILE_PATH || "./casariviera.xml";
const BUCKET = "property-images";
const DEFAULT_OWNER_ID = "48c20fcc-38d4-4e95-9d43-d46cd578bc97";

// VIKTIG ÄNDRING: Inaktivera översättningar som standard
const ENABLE_TRANSLATIONS = false; // Sätt till true när du har API-nyckel

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL === "din-supabase-url-här") {
  console.error("❌ Konfigurera SUPABASE_URL och SUPABASE_SERVICE_KEY först!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// HJÄLPFUNKTIONER
// ============================================================================

function stripHtmlTags(text) {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}

function decodeHtmlEntities(text) {
  if (!text) return text;

  const entityMap = {
    'nbsp': ' ', 'lt': '<', 'gt': '>', 'amp': '&', 'quot': '"',
    'apos': "'", 'hellip': '…', 'mdash': '—', 'ndash': '–',
    'lsquo': "'", 'rsquo': "'", 'ldquo': '"', 'rdquo': '"'
  };

  return text.replace(/&([#a-zA-Z0-9]+);/g, (match, entity) => {
    if (entityMap[entity]) return entityMap[entity];
    if (entity.startsWith('#')) {
      const code = entity.startsWith('#x') 
        ? parseInt(entity.substring(2), 16) 
        : parseInt(entity.substring(1), 10);
      return String.fromCharCode(code);
    }
    return match;
  });
}

function makeSafeFilename(url) {
  try {
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname);
    return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  } catch {
    return 'image_' + Date.now() + '.jpg';
  }
}

async function loadXmlFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// ============================================================================
// BILDFUNKTIONER
// ============================================================================

async function downloadImageToBuffer(url) {
  try {
    console.log(`⬇️ Laddar ner: ${url.substring(0, 80)}...`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`❌ Bildnedladdning misslyckades: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error(`❌ Fel vid bildnedladdning: ${err.message}`);
    return null;
  }
}

async function uploadToSupabase(buffer, filename) {
  try {
    const contentType = filename.endsWith(".jpg") || filename.endsWith(".jpeg")
      ? "image/jpeg"
      : filename.endsWith(".png")
      ? "image/png"
      : "image/webp";

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error("❌ Supabase-uppladdningsfel:", error);
      return null;
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
    console.log(`✅ Uppladdad: ${path.basename(filename)}`);
    return publicUrl;
  } catch (err) {
    console.error("❌ Uppladdningsfel:", err.message);
    return null;
  }
}

// ============================================================================
// ÖVERSÄTTNINGSFUNKTIONER (FÖRENKLAD)
// ============================================================================

async function translateWithLibreTranslate(text, targetLang, sourceLang = 'auto') {
  const apiKey = process.env.VITE_LIBRETRANSLATE_API_KEY;
  
  if (!apiKey || apiKey === 'your_libretranslate_api_key_here') {
    return null; // Ingen API-nyckel, hoppa över
  }

  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
        api_key: apiKey
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.translatedText;
    }
    
    return null;
  } catch (error) {
    console.error(`Översättningsfel (${targetLang}):`, error.message);
    return null;
  }
}

// ============================================================================
// HUVUDFUNKTION
// ============================================================================

async function main() {
  console.log("🚀 Startar XML-import...\n");
  
  if (!ENABLE_TRANSLATIONS) {
    console.log("ℹ️ ÖVERSÄTTNINGAR INAKTIVERADE");
    console.log("   Data kommer sparas utan översättningar");
    console.log("   För att aktivera: sätt ENABLE_TRANSLATIONS = true\n");
  }

  try {
    // 1. Läs XML
    console.log(`📂 Läser XML-fil: ${XML_FILE_PATH}`);
    const xml = await loadXmlFromFile(XML_FILE_PATH);

    // 2. Parsa XML
    console.log("🔍 Parsar XML...");
    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: false
    });

    // 3. Extrahera fastigheter
    let properties = [];
    if (parsed.properties && parsed.properties.property) {
      properties = Array.isArray(parsed.properties.property)
        ? parsed.properties.property
        : [parsed.properties.property];
    }

    // Deduplicera
    const uniqueMap = new Map();
    for (const prop of properties) {
      const ref = prop.reference;
      if (ref && !uniqueMap.has(ref)) {
        uniqueMap.set(ref, prop);
      }
    }
    
    properties = Array.from(uniqueMap.values());
    console.log(`📊 Hittade ${properties.length} unika fastigheter\n`);

    let successCount = 0;
    let errorCount = 0;
    let totalImages = 0;

    // 4. Bearbeta varje fastighet
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🏠 FASTIGHET ${i + 1}/${properties.length}`);
      console.log(`${'='.repeat(80)}`);

      try {
        // Extrahera data
        const reference = prop.reference || `custom_${Date.now()}_${i}`;
        const title = prop.title || "Untitled Property";
        const rawDescription = prop.description || "No description available";
        const strippedDescription = stripHtmlTags(rawDescription);
        const description = decodeHtmlEntities(strippedDescription);
        const location = prop.location || "Unknown Location";
        const country = "Italy";

        // Hantera pris
        let price = 0;
        if (prop.price && prop.price !== '0') {
          const cleanPrice = prop.price.replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '');
          const match = cleanPrice.match(/(\d+)/);
          if (match) price = parseFloat(match[1]);
        }

        const bedrooms = prop.rooms ? parseInt(prop.rooms) : null;
        const bathrooms = prop.baths ? parseInt(prop.baths) : null;
        
        let area = null;
        if (prop.area) {
          const areaMatch = prop.area.toString().match(/(\d+)/);
          if (areaMatch) area = parseInt(areaMatch[1]);
        }

        let plotArea = null;
        if (prop.plot && prop.plot !== '0 m²') {
          const plotMatch = prop.plot.toString().match(/(\d+)/);
          if (plotMatch) plotArea = parseInt(plotMatch[1]);
        }

        console.log(`📝 ${title.substring(0, 60)}...`);
        console.log(`📍 ${location}, ${country}`);
        console.log(`💰 €${price.toLocaleString()}`);

        // Hantera bilder
        let imageUrls = [];
        if (prop.images && prop.images.image) {
          const images = Array.isArray(prop.images.image) ? prop.images.image : [prop.images.image];
          imageUrls = images.filter(img => img && img.trim()).map(img => img.trim());
        }

        console.log(`\n🖼️ Bearbetar ${imageUrls.length} bilder (max 10)...`);

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

        console.log(`✅ ${uploadedImages.length} bilder uppladdade`);

        // Förbered data för databas
        const propertyData = {
          xml_object_id: reference,
          title: title.substring(0, 255),
          description: description,
          country,
          city: location,
          price,
          property_type: 'apartment',
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

        // Översättningar (om aktiverade)
        if (ENABLE_TRANSLATIONS) {
          console.log(`\n🌐 Översätter...`);
          
          const languages = [
            { code: 'en', name: 'english' },
            { code: 'sv', name: 'swedish' },
            { code: 'da', name: 'danish' },
            { code: 'nb', name: 'norwegian' },
            { code: 'fi', name: 'finnish' }
          ];

          for (const lang of languages) {
            const translatedTitle = await translateWithLibreTranslate(title, lang.code);
            const translatedDesc = await translateWithLibreTranslate(description, lang.code);

            if (translatedTitle) {
              propertyData[`${lang.name}_title`] = translatedTitle.substring(0, 255);
              propertyData[`${lang.name}_description`] = translatedDesc || description;
              console.log(`✅ ${lang.code.toUpperCase()} översatt`);
            } else {
              console.log(`⚠️ ${lang.code.toUpperCase()} misslyckades, använder original`);
              propertyData[`${lang.name}_title`] = title.substring(0, 255);
              propertyData[`${lang.name}_description`] = description;
            }

            // Paus mellan översättningar
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.log(`\nℹ️ Översättningar inaktiverade`);
        }

        // Spara i databasen
        console.log(`\n💾 Sparar i databasen...`);

        const { data, error } = await supabase
          .from("properties")
          .upsert([propertyData], { onConflict: 'xml_object_id' });

        if (error) {
          console.error("\n❌ DATABASFEL:");
          console.error(error.message);
          
          if (error.message.includes('column')) {
            console.error("\n💡 Kolumn saknas i databasen!");
            console.error("Se FELSÖKNINGSGUIDE.md för SQL-kommandon");
          }
          
          errorCount++;
        } else {
          console.log(`✅ Sparad!`);
          successCount++;
        }

      } catch (err) {
        console.error(`\n❌ Fel:`, err.message);
        errorCount++;
      }

      // Liten paus mellan fastigheter
      if (i < properties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Sammanfattning
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 IMPORT SLUTFÖRD!`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Lyckades: ${successCount} fastigheter`);
    console.log(`❌ Misslyckades: ${errorCount} fastigheter`);
    console.log(`🖼️ Bilder: ${totalImages} uppladdade`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (err) {
    console.error("\n💥 FATALT FEL:", err);
    console.error(err.stack);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("💥 Oväntat fel:", err);
  process.exit(1);
});