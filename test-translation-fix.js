#!/usr/bin/env node
import 'dotenv/config';

console.log('Testing LibreTranslate without API key...');

const endpoints = [
  'https://api.libretranslate.com/v1/translate',
  'https://libretranslate.de/v1/translate',
  'https://translate.argosopentech.com/v1/translate',
  'https://libretranslate.com/translate'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\nTesting: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: 'Hello, world!',
        source: 'en',
        target: 'es',
        format: 'text'
      })
    });
    
    const data = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
    
    if (response.ok) {
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.translatedText) {
          console.log(`✅ Success! Translated to: ${jsonData.translatedText}`);
          return true;
        }
      } catch (parseError) {
        console.log('⚠️ Response is not valid JSON');
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
  
  return false;
}

async function main() {
  console.log('Testing if LibreTranslate works without API key...');
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      console.log('\n🎉 Found working endpoint!');
      return;
    }
  }
  
  console.log('\n❌ All endpoints failed without API key');
}

main();
