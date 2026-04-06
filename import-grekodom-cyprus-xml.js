// import-grekodom-cyprus-xml.js - Script för att importera Grekodom Cyprus XML och ladda upp bilder till Supabase
import 'dotenv/config';
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import path from "path";
import crypto from "crypto";
import OpenAI from 'openai';

// =====================================================
// GREKODOM CYPRUS XML IMPORT SCRIPT
// This script imports properties from grekodom_cyprus.xml
// =====================================================

// Static configuration - DO NOT CHANGE unless you know what you're doing
const GREKODOM_XML_FILE = "./grekodom_cyprus.xml";

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
console.log("  GREKODOM CYPRUS XML IMPORT");
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

async function translateToEnglish(text) {
  if (!text || text.trim().length === 0) return text;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the following text to English. Only respond with the translation, nothing else.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 2000,
      temperature: 0
    });

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// =====================================================
// IMAGE UPLOAD FUNCTIONS
// =====================================================

// Generate a unique filename
function generateUniqueFilename(originalUrl, propertyRef) {
  let urlStr = originalUrl;
  
  // Handle xml2js object format: { _: 'url', $: { order: '1' } }
  if (originalUrl && typeof originalUrl === 'object') {
    urlStr = originalUrl._ || originalUrl['text'] || Object.values(originalUrl)[0];
  }
  
  try {
    const ext = path.extname(new URL(urlStr).pathname) || '.jpg';
    const hash = crypto.createHash('md5').update(propertyRef + urlStr).digest('hex');
    return `${propertyRef}-${hash.substring(0, 8)}${ext}`;
  } catch (e) {
    // Fallback if URL is invalid
    const hash = crypto.createHash('md5').update(propertyRef + 'unknown').digest('hex');
    return `${propertyRef}-${hash.substring(0, 8)}.jpg`;
  }
}

// Upload image to Supabase Storage
async function uploadImage(imageUrl, propertyRef, imageIndex) {
  try {
    // Handle xml2js object format: { _: 'url', $: { order: '1' } }
    let urlStr = imageUrl;
    if (imageUrl && typeof imageUrl === 'object') {
      urlStr = imageUrl._ || imageUrl['text'] || Object.values(imageUrl).find(v => typeof v === 'string' && v.startsWith('http'));
    }
    
    if (!urlStr || !urlStr.startsWith('http')) {
      console.error(`  ❌ Invalid image URL: ${JSON.stringify(imageUrl)}`);
      return null;
    }
    
    const response = await fetch(urlStr);
    if (!response.ok) {
      console.error(`  ❌ Failed to fetch image: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    const filename = generateUniqueFilename(urlStr, propertyRef);
    const cleanFilename = `${propertyRef}/${filename}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(cleanFilename, Buffer.from(buffer), {
        contentType,
        upsert: true
      });

    if (error) {
      console.error(`  ❌ Upload error: ${error.message}`);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(cleanFilename);

    return urlData.publicUrl;
  } catch (error) {
    console.error(`  ❌ Exception uploading image: ${error.message}`);
    return null;
  }
}

// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

async function importProperties() {
  try {
    // Read and parse XML
    const xmlContent = fs.readFileSync(GREKODOM_XML_FILE, 'utf-8');
    const parsed = await parseStringPromise(xmlContent);
    
    const properties = parsed.properties.property;
    console.log(`📊 Found ${properties.length} properties in XML`);
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process each property
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      
      try {
        // Extract required fields
        const reference = prop.reference?.[0];
        const xmlObjectId = prop.xml_object_id?.[0];
        
        if (!reference || !xmlObjectId) {
          console.log(`  ⚠️ Skipping property ${i + 1}: Missing reference or xml_object_id`);
          skippedCount++;
          continue;
        }

        // Check if property already exists
        const { data: existing } = await supabase
          .from('properties')
          .select('id')
          .eq('reference', reference)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`  ⏭️ Property ${reference} already exists - skipping`);
          skippedCount++;
          continue;
        }

        console.log(`\n🏠 Processing property ${i + 1}/${properties.length}: ${reference}`);

        // Extract basic fields
        const title = prop.title?.[0] || '';
        const description = prop.description?.[0] || '';
        const price = parseInt(prop.price?.[0]?.['_'] || prop.price?.[0] || '0') || 0;
        const area = parseInt(prop.area?.[0]?.['_'] || prop.area?.[0] || '0') || 0;
        
        const propertyType = prop.property_type?.[0] || '';
        const country = prop.country?.[0] || '';
        const city = prop.city?.[0] || '';
        const location = prop.location?.[0] || '';
        
        const yearBuilt = prop.year_built?.[0] || null;
        const condition = prop.condition?.[0] || '';
        const distanceSea = prop.distance_sea?.[0] || null;
        const distanceAirport = prop.distance_airport?.[0] || null;
        
        const url = prop.url?.[0] || '';
        const source = prop.source?.[0] || 'grekodom_cyprus';

        // Extract agent info
        const agent = prop.agent?.[0] || {};
        const agentName = agent.name?.[0] || '';
        const agentPhone = agent.phone?.[0] || '';
        const agentEmail = agent.email?.[0] || '';

        // Decode HTML entities
        const cleanTitle = decodeHtmlEntities(title);
        const cleanDescription = decodeHtmlEntities(description);
        const cleanPropertyType = decodeHtmlEntities(propertyType);
        const cleanLocation = decodeHtmlEntities(location);
        const cleanCondition = decodeHtmlEntities(condition);
        const cleanAgentName = decodeHtmlEntities(agentName);

        // Handle translations (for Greek/Cypriot text)
        let translatedTitle = cleanTitle;
        let translatedDescription = cleanDescription;

        if (process.env.AUTO_TRANSLATE === 'true') {
          const lang = await detectLanguage(cleanTitle + ' ' + cleanDescription);
          console.log(`  🌐 Detected language: ${lang}`);
          
          if (lang !== 'en') {
            console.log(`  🔄 Translating to English...`);
            translatedTitle = await translateToEnglish(cleanTitle);
            translatedDescription = await translateToEnglish(cleanDescription);
          }
        }

        // Upload images
        // Handle both string arrays and xml2js object arrays
        let images = prop.images?.[0]?.image || [];
        
        // Normalize images to strings (xml2js creates objects with _ and $)
        images = images.map(img => {
          if (!img) return null;
          if (typeof img === 'string') return img.trim();
          if (typeof img === 'object') {
            // Handle { _: 'url', $: { order: '1' } } format
            return img._ || img['text'] || Object.values(img).find(v => typeof v === 'string' && v.startsWith('http')) || null;
          }
          return String(img).trim();
        }).filter(url => url && url.startsWith('http'));
        
        console.log(`  📷 Uploading ${images.length} images...`);
        
        const uploadedImages = [];
        for (let j = 0; j < Math.min(images.length, 20); j++) {
          const imgUrl = images[j];
          const uploadedUrl = await uploadImage(imgUrl, reference, j);
          if (uploadedUrl) {
            uploadedImages.push(uploadedUrl);
          }
          
          // Small delay between uploads
          await new Promise(r => setTimeout(r, 100));
        }

        console.log(`  ✅ Uploaded ${uploadedImages.length} images`);

        // Insert into Supabase
        const propertyData = {
          reference,
          xml_object_id: xmlObjectId,
          title: translatedTitle || cleanTitle,
          description: translatedDescription || cleanDescription,
          price,
          area,
          property_type: cleanPropertyType,
          country,
          city,
          location: cleanLocation,
          year_built: yearBuilt,
          condition: cleanCondition,
          distance_sea: distanceSea,
          distance_airport: distanceAirport,
          status: 'published',
          owner_id: DEFAULT_OWNER_ID,
          url,
          source,
          images: uploadedImages,
          agent_name: cleanAgentName,
          agent_phone: agentPhone,
          agent_email: agentEmail
        };

        const { data, error } = await supabase
          .from('properties')
          .insert(propertyData);

        if (error) {
          console.error(`  ❌ Database error: ${error.message}`);
          failedCount++;
        } else {
          console.log(`  ✅ Successfully imported: ${reference}`);
          successCount++;
        }

      } catch (error) {
        console.error(`  ❌ Error processing property: ${error.message}`);
        failedCount++;
      }

      // Delay between properties
      if (i < properties.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log("\n" + "=".replace(/=/g, "=").repeat(40));
    console.log("  IMPORT COMPLETE");
    console.log("=".replace(/=/g, "=").repeat(40));
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Failed: ${failedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log("=".replace(/=/g, "=").repeat(40));

  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run import
importProperties();
