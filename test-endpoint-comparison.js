#!/usr/bin/env node
import 'dotenv/config';
import fetch from 'node-fetch';

console.log('🧪 Testing LibreTranslate endpoints...\n');

const API_KEY = process.env.VITE_LIBRETRANSLATE_API_KEY;
const testText = 'Ciao mondo!';
const sourceLang = 'it';
const targetLangs = ['en', 'sv', 'da', 'nb', 'fi', 'it'];

const endpoints = [
  'https://libretranslate.com/translate',
  'https://api.libretranslate.com/v1/translate',
  'https://libretranslate.de/v1/translate'
];

async function testEndpoint(endpoint, targetLang) {
  try {
    console.log(`Testing ${endpoint} (${sourceLang} → ${targetLang})...`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LibreTranslate-API-Key': API_KEY
      },
      body: JSON.stringify({
        q: testText,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.translatedText) {
      console.log(`✅ Success: "${result.translatedText}"`);
      return true;
    } else {
      throw new Error('No translated text in response');
    }
    
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function main() {
  if (!API_KEY) {
    console.error('❌ VITE_LIBRETRANSLATE_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('🔑 API Key found');
  console.log('📝 Testing endpoints with:', testText);
  console.log('');

  for (const endpoint of endpoints) {
    console.log(`=== Testing endpoint: ${endpoint} ===`);
    
    for (const targetLang of targetLangs) {
      if (targetLang === sourceLang) continue;
      
      const success = await testEndpoint(endpoint, targetLang);
      
      if (!success) {
        console.log(`⚠️  Endpoint ${endpoint} failed for ${targetLang}`);
      }
      
      console.log('');
      // Wait a little to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

main().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
