#!/usr/bin/env node
import 'dotenv/config';
import fetch from 'node-fetch';

console.log('🐛 Debugging LibreTranslate API...\n');

const API_KEY = process.env.VITE_LIBRETRANSLATE_API_KEY;
const API_URL = 'https://api.libretranslate.com/v1/translate';

async function debugRequest() {
  try {
    const testData = {
      q: 'Hello, world!',
      source: 'en',
      target: 'es',
      format: 'text'
    };
    
    console.log('📝 Request URL:', API_URL);
    console.log('📝 Request Headers:', {
      'Content-Type': 'application/json',
      'X-LibreTranslate-API-Key': API_KEY ? '***' + API_KEY.slice(-4) : 'NOT FOUND'
    });
    console.log('📝 Request Body:', JSON.stringify(testData, null, 2));
    console.log('');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LibreTranslate-API-Key': API_KEY
      },
      body: JSON.stringify(testData)
    });

    console.log('📝 Response Status:', response.status);
    console.log('📝 Response Status Text:', response.statusText);
    console.log('📝 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseBody = await response.text();
    console.log('📝 Response Body:', responseBody);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testAlternateEndpoints() {
  console.log('\n🔍 Testing alternate LibreTranslate endpoints...\n');
  
  const endpoints = [
    'https://libretranslate.com/translate',
    'https://api.libretranslate.com/translate',
    'https://translate.argosopentech.com/translate'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LibreTranslate-API-Key': API_KEY
        },
        body: JSON.stringify({
          q: 'Hello',
          source: 'en',
          target: 'es',
          format: 'text'
        })
      });

      const responseBody = await response.text();
      console.log(`   Status: ${response.status} - ${response.statusText}`);
      console.log(`   Response: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? '...' : ''}`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
}

async function main() {
  await debugRequest();
  await testAlternateEndpoints();
}

main();
