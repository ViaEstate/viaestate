// fix-grekodom-cyprus-images.js - Script to fix missing images for Grekodom Cyprus properties
// This script finds properties that are missing images and re-imports them from the XML

import 'dotenv/config';
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import path from "path";
import crypto from "crypto";

// =====================================================
// CONFIGURATION
// =====================================================

const GREKODOM_XML_FILE = "./grekodom_cyprus.xml";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = "property-images";

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Generate a unique filename
function generateUniqueFilename(originalUrl, propertyRef) {
  let urlStr = originalUrl;
  
  if (originalUrl && typeof originalUrl === 'object') {
    urlStr = originalUrl._ || originalUrl['text'] || Object.values(originalUrl)[0];
  }
  
  try {
    const ext = path.extname(new URL(urlStr).pathname) || '.jpg';
    const hash = crypto.createHash('md5').update(propertyRef + urlStr).digest('hex');
    return `${propertyRef}-${hash.substring(0, 8)}${ext}`;
  } catch (e) {
    const hash = crypto.createHash('md5').update(propertyRef + 'unknown').digest('hex');
    return `${propertyRef}-${hash.substring(0, 8)}.jpg`;
  }
}

// Upload image to Supabase Storage
async function uploadImage(imageUrl, propertyRef) {
  try {
    let urlStr = imageUrl;
    if (imageUrl && typeof imageUrl === 'object') {
      urlStr = imageUrl._ || imageUrl['text'] || Object.values(imageUrl).find(v => typeof v === 'string' && v.startsWith('http'));
    }
    
    if (!urlStr || !urlStr.startsWith('http')) {
      return null;
    }
    
    const response = await fetch(urlStr);
    if (!response.ok) {
      console.error(`  ❌ Failed to fetch image: ${response.status} - ${urlStr}`);
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
    console.error(`  ❌ Exception: ${error.message}`);
    return null;
  }
}

// =====================================================
// MAIN FUNCTION
// =====================================================

async function fixMissingImages() {
  try {
    console.log("===========================================");
    console.log("  FIX GREKODOM CYPRUS MISSING IMAGES");
    console.log("===========================================\n");

    // Step 1: Get all Grekodom Cyprus properties from database
    console.log("📊 Fetching Grekodom Cyprus properties from database...");
    
    const { data: properties, error: dbError } = await supabase
      .from('properties')
      .select('id, reference, xml_object_id, images, source')
      .eq('source', 'grekodom_cyprus');

    if (dbError) {
      console.error("❌ Database error:", dbError.message);
      process.exit(1);
    }

    console.log(`📊 Found ${properties.length} Grekodom Cyprus properties in database`);

    // Step 2: Find properties with empty or null images
    const propertiesWithMissingImages = properties.filter(p => {
      return !p.images || !Array.isArray(p.images) || p.images.length === 0;
    });

    console.log(`📊 Found ${propertiesWithMissingImages.length} properties with missing/empty images\n`);

    if (propertiesWithMissingImages.length === 0) {
      console.log("✅ All properties already have images!");
      process.exit(0);
    }

    // Step 3: Read and parse XML
    console.log("📂 Reading XML file...");
    const xmlContent = fs.readFileSync(GREKODOM_XML_FILE, 'utf-8');
    const parsed = await parseStringPromise(xmlContent);
    const xmlProperties = parsed.properties.property;
    
    console.log(`📊 Found ${xmlProperties.length} properties in XML\n`);

    // Step 4: Create a map of xml_object_id to images from XML
    const xmlImageMap = new Map();
    for (const prop of xmlProperties) {
      const xmlObjectId = prop.xml_object_id?.[0];
      if (xmlObjectId) {
        // Extract image URLs from XML
        let images = prop.images?.[0]?.image || [];
        images = images.map(img => {
          if (!img) return null;
          if (typeof img === 'string') return img.trim();
          if (typeof img === 'object') {
            return img._ || img['text'] || Object.values(img).find(v => typeof v === 'string' && v.startsWith('http')) || null;
          }
          return String(img).trim();
        }).filter(url => url && url.startsWith('http'));
        
        xmlImageMap.set(xmlObjectId, images);
      }
    }

    // Step 5: Process properties with missing images
    let fixedCount = 0;
    let failedCount = 0;

    for (const prop of propertiesWithMissingImages) {
      console.log(`\n🏠 Processing: ${prop.reference} (${prop.xml_object_id})`);
      
      const xmlImages = xmlImageMap.get(prop.xml_object_id);
      
      if (!xmlImages || xmlImages.length === 0) {
        console.log(`  ⚠️ No images found in XML for this property`);
        failedCount++;
        continue;
      }

      console.log(`  📷 Found ${xmlImages.length} images in XML, attempting to download...`);

      const uploadedImages = [];
      for (let i = 0; i < Math.min(xmlImages.length, 20); i++) {
        const imgUrl = xmlImages[i];
        const uploadedUrl = await uploadImage(imgUrl, prop.reference);
        if (uploadedUrl) {
          uploadedImages.push(uploadedUrl);
        }
        
        // Small delay between uploads
        await new Promise(r => setTimeout(r, 100));
        
        // Progress indicator
        if ((i + 1) % 5 === 0) {
          process.stdout.write(`  📷 ${i + 1}/${Math.min(xmlImages.length, 20)}...`);
        }
      }

      console.log(`\n  ✅ Successfully uploaded ${uploadedImages.length} images`);

      if (uploadedImages.length > 0) {
        // Update database
        const { error: updateError } = await supabase
          .from('properties')
          .update({ images: uploadedImages })
          .eq('id', prop.id);

        if (updateError) {
          console.error(`  ❌ Database update error: ${updateError.message}`);
          failedCount++;
        } else {
          console.log(`  ✅ Updated database with ${uploadedImages.length} images`);
          fixedCount++;
        }
      } else {
        console.log(`  ❌ Failed to upload any images`);
        failedCount++;
      }

      // Delay between properties
      await new Promise(r => setTimeout(r, 500));
    }

    console.log("\n" + "=".replace(/=/g, "=").repeat(40));
    console.log("  COMPLETE");
    console.log("=".replace(/=/g, "=").repeat(40));
    console.log(`  ✅ Fixed: ${fixedCount}`);
    console.log(`  ❌ Failed: ${failedCount}`);
    console.log(`  Total processed: ${propertiesWithMissingImages.length}`);
    console.log("=".replace(/=/g, "=").repeat(40));

  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the fix
fixMissingImages();
