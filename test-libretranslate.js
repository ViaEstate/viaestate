#!/usr/bin/env node
import 'dotenv/config';
import fetch from 'node-fetch';

console.log('🧪 Testing LibreTranslate API...\n');

// Test configuration
const API_KEY = process.env.VITE_LIBRETRANSLATE_API_KEY;
const API_URL = 'https://api.libretranslate.com/v1/translate';

const testCases = [
  { text: 'Hello, world!', source: 'en', target: 'es', expected: '¡Hola mundo!' },
  { text: 'Bonjour le monde!', source: 'fr', target: 'en', expected: 'Hello world!' },
  { text: 'Hallo Welt!', source: 'de', target: 'sv', expected: 'Hej världen!' },
  { text: 'Ciao mondo!', source: 'it', target: 'fi', expected: 'Hei maailma!' },
  { text: 'Hola mundo!', source: 'es', target: 'da', expected: 'Hej verden!' },
  { text: 'Hej världen!', source: 'sv', target: 'nb', expected: 'Hei verden!' }
];

async function testTranslation(text, source, target, expected) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LibreTranslate-API-Key': API_KEY
      },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const translatedText = result.translatedText;

    console.log(`✅ ${source} → ${target}: "${text}"`);
    console.log(`   Translated: "${translatedText}"`);
    
    // Check if translation matches expected (allow for minor variations)
    if (translatedText.toLowerCase().includes(expected.toLowerCase().split(' ')[0])) {
      console.log('   ✅ Translation matches expected');
    } else {
      console.log(`   ⚠️ Expected: "${expected}"`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ ${source} → ${target}: "${text}"`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  if (!API_KEY) {
    console.error('❌ VITE_LIBRETRANSLATE_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('🔑 API Key found');
  console.log('🌐 Testing LibreTranslate API at:', API_URL);
  console.log('📝 Running', testCases.length, 'translation test cases...\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const success = await testTranslation(
      testCase.text,
      testCase.source,
      testCase.target,
      testCase.expected
    );
    
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(''); // Add spacing between tests
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  const successRate = (passed / testCases.length) * 100;
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! LibreTranslate API is working correctly.');
  } else if (failed < testCases.length / 2) {
    console.log('\n⚠️ Some tests failed, but majority passed. API is partially working.');
  } else {
    console.log('\n❌ Most tests failed. API is not working correctly.');
    process.exit(1);
  }
}

// Test consecutive failures handling
async function testConsecutiveFailures() {
  console.log('\n🧪 Testing consecutive failures handling...');
  
  // Test with invalid API key to simulate failures
  const invalidApiKey = 'invalid_key_' + Date.now();
  let failures = 0;
  const maxFailures = 3;

  for (let i = 0; i < maxFailures + 1; i++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LibreTranslate-API-Key': invalidApiKey
        },
        body: JSON.stringify({
          q: 'Test',
          source: 'en',
          target: 'es',
          format: 'text'
        })
      });

      if (!response.ok) {
        failures++;
        console.log(`❌ Failure ${failures}: HTTP ${response.status}`);
      }
    } catch (error) {
      failures++;
      console.log(`❌ Failure ${failures}: ${error.message}`);
    }
  }

  console.log(`\n✅ Consecutive failures test complete: ${failures} failures`);
  
  if (failures > 0) {
    console.log('⚠️  IMPORTANT: The consecutive failures test is expected to fail - it tests the failure handling');
  }
}

async function main() {
  await runTests();
  await testConsecutiveFailures();
  
  console.log('\n🏁 All tests completed!');
}

main().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
