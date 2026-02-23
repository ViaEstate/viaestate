#!/usr/bin/env node
import fetch from 'node-fetch';

console.log('🔍 Testing available LibreTranslate endpoints...\n');

const endpoints = [
  'https://libretranslate.de/v1/translate',
  'https://libretranslate.com/v1/translate',
  'https://api.mymemory.translated.net/get', // Alternative free translation API
  'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=', // Google Translate API (free tier)
  'https://api-free.deepl.com/v2/translate', // DeepL free tier
  'https://translated-mymemory---translation-memory.p.rapidapi.com/get' // RapidAPI MyMemory
];

async function testEndpoint(endpoint) {
  try {
    console.log(`📡 Testing: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: 'Hello',
        source: 'en',
        target: 'es',
        format: 'text'
      })
    });

    const responseBody = await response.text();
    console.log(`   ✅ Status: ${response.status} - ${response.statusText}`);
    console.log(`   Response snippet: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? '...' : ''}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const workingEndpoints = [];
  
  for (const endpoint of endpoints) {
    const isWorking = await testEndpoint(endpoint);
    if (isWorking) {
      workingEndpoints.push(endpoint);
    }
    console.log('');
  }

  console.log('✅ Working endpoints found:', workingEndpoints.length);
  if (workingEndpoints.length > 0) {
    console.log('📋 Working endpoints:');
    workingEndpoints.forEach((ep, index) => {
      console.log(`   ${index + 1}. ${ep}`);
    });
  } else {
    console.log('❌ No working LibreTranslate endpoints found');
  }
}

main();