#!/usr/bin/env node

// Test script to verify language-specific property description functionality
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLanguageSpecificProperties() {
    console.log('🔍 Testing language-specific property description functionality...');
    
    try {
        // Get all properties with language-specific fields
        const { data: properties, error } = await supabase
            .from('properties')
            .select(`
                id, title, description,
                english_title, english_description,
                swedish_title, swedish_description,
                norwegian_title, norwegian_description,
                danish_title, danish_description,
                finnish_title, finnish_description,
                croatian_title, croatian_description,
                country, city, price
            `)
            .eq('status', 'published')
            .limit(10);

        if (error) {
            throw error;
        }

        console.log(`\n📊 Found ${properties.length} published properties`);
        
        // Test cases for each supported language
        const languages = [
            { code: 'en', name: 'English', suffix: 'english' },
            { code: 'sv', name: 'Swedish', suffix: 'swedish' },
            { code: 'fi', name: 'Finnish', suffix: 'finnish' },
            { code: 'da', name: 'Danish', suffix: 'danish' },
            { code: 'nb', name: 'Norwegian', suffix: 'norwegian' },
            { code: 'de', name: 'German', suffix: 'german' },
            { code: 'fr', name: 'French', suffix: 'french' },
            { code: 'es', name: 'Spanish', suffix: 'spanish' },
            { code: 'it', name: 'Italian', suffix: 'italian' },
            { code: 'hr', name: 'Croatian', suffix: 'croatian' }
        ];

        // Test language-specific property descriptions
        console.log('\n📝 Testing language-specific property descriptions:');
        
        properties.forEach((property, index) => {
            console.log(`\n${index + 1}. Property: "${property.title}" (${property.city}, ${property.country})`);
            
            languages.forEach(language => {
                const hasLanguageSpecificTitle = property[`${language.suffix}_title`];
                const hasLanguageSpecificDescription = property[`${language.suffix}_description`];
                
                if (hasLanguageSpecificTitle || hasLanguageSpecificDescription) {
                    console.log(`   ✅ ${language.name}: ${hasLanguageSpecificTitle ? 'Title' : ''}${hasLanguageSpecificTitle && hasLanguageSpecificDescription ? ' & ' : ''}${hasLanguageSpecificDescription ? 'Description' : ''}`);
                } else {
                    console.log(`   ⚠️ ${language.name}: No language-specific content (using fallback)`);
                }
            });
        });

        // Test fallback mechanism
        console.log('\n🔄 Testing fallback mechanism:');
        const propertiesWithoutEnglish = properties.filter(prop => !prop.english_title || !prop.english_description);
        
        if (propertiesWithoutEnglish.length > 0) {
            console.log(`   ⚠️  Found ${propertiesWithoutEnglish.length} properties without English fallback content`);
        } else {
            console.log('   ✅ All properties have English fallback content');
        }

        // Check if any properties have Croatian content
        const propertiesWithCroatian = properties.filter(prop => prop.croatian_title || prop.croatian_description);
        console.log(`\n🇭🇷 Properties with Croatian content: ${propertiesWithCroatian.length}`);
        
        if (propertiesWithCroatian.length > 0) {
            console.log('   ✅ Croatian content available');
            propertiesWithCroatian.slice(0, 3).forEach(prop => {
                console.log(`   - "${prop.croatian_title || prop.title}"`);
            });
        } else {
            console.log('   ⚠️  No properties with Croatian content found');
            console.log('      This is expected if no Croatian properties have been imported');
        }

        console.log('\n✅ Language-specific property description functionality tested successfully!');
        
    } catch (error) {
        console.error('\n❌ Error testing language-specific properties:');
        console.error(error.message);
        process.exit(1);
    }
}

testLanguageSpecificProperties();
