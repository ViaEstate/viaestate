const fs = require('fs');
const path = require('path');

const languages = ['en', 'sv', 'fi', 'da', 'nb'];
const files = {};

// Read all language files
languages.forEach(lang => {
    try {
        const content = fs.readFileSync(path.join(__dirname, 'locales', `${lang}.json`), 'utf8');
        files[lang] = JSON.parse(content);
        console.log(`✓ Successfully read ${lang}.json`);
    } catch (error) {
        console.error(`✗ Error reading ${lang}.json:`, error.message);
    }
});

// Function to get all keys from an object
function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (let key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = [...keys, ...getAllKeys(obj[key], fullKey)];
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

// Get all keys from English file (base language)
const baseKeys = getAllKeys(files['en']);
console.log(`\nBase language (English) has ${baseKeys.length} keys`);

// Check each language file against base keys
languages.forEach(lang => {
    if (lang === 'en') return;
    
    console.log(`\nChecking ${lang}.json:`);
    const langKeys = getAllKeys(files[lang]);
    const missingKeys = baseKeys.filter(key => !langKeys.includes(key));
    const extraKeys = langKeys.filter(key => !baseKeys.includes(key));
    
    if (missingKeys.length > 0) {
        console.log(`  Missing keys (${missingKeys.length}):`);
        missingKeys.forEach(key => {
            console.log(`    - ${key}`);
        });
    }
    
    if (extraKeys.length > 0) {
        console.log(`  Extra keys (${extraKeys.length}):`);
        extraKeys.forEach(key => {
            console.log(`    - ${key}`);
        });
    }
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
        console.log(`  ✓ All keys match base language`);
    }
});

// Check for duplicate keys
languages.forEach(lang => {
    console.log(`\nChecking for duplicates in ${lang}.json:`);
    const keys = getAllKeys(files[lang]);
    const duplicates = [];
    const seen = new Set();
    
    keys.forEach(key => {
        if (seen.has(key)) {
            duplicates.push(key);
        }
        seen.add(key);
    });
    
    if (duplicates.length > 0) {
        console.log(`  Duplicate keys (${duplicates.length}):`);
        duplicates.forEach(key => {
            console.log(`    - ${key}`);
        });
    } else {
        console.log(`  ✓ No duplicate keys`);
    }
});

console.log(`\n=== Summary ===`);
languages.forEach(lang => {
    const count = getAllKeys(files[lang]).length;
    const percentage = Math.round((count / baseKeys.length) * 100);
    console.log(`${lang}: ${count}/${baseKeys.length} keys (${percentage}%)`);
});
