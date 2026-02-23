# Multi-Language Property Cards Implementation Plan

## Summary
This plan outlines the implementation of multi-language support for property cards in the ViaEstate application. The goal is to display property content (title and description) in English, Swedish, Norwegian, Danish, and Finnish based on the user's selected language.

## Current Status
- Property table has `title` (default, likely Swedish), `description` (default), and `english_description` fields
- Language switcher supports 5 languages: English (en), Swedish (sv), Finnish (fi), Danish (da), Norwegian (nb)
- PropertyCard component currently uses default title and description, with English description as fallback

## Implementation Steps

### 1. Database Schema Updates
Add missing translation fields to the properties table:
- `swedish_title`
- `swedish_description`
- `norwegian_title`
- `norwegian_description`
- `danish_title`
- `danish_description`
- `finnish_title`
- `finnish_description`

### 2. PropertyCard Component Enhancement
Update the PropertyCard component to:
- Detect current language using useLanguage hook
- Display the appropriate translated title and description
- Fallback to English if translation is missing, then to default
- Handle all 5 supported languages

### 3. Admin Panel Updates
Update the admin panel to:
- Show and edit all translation fields for properties
- Make translation fields optional (fallback system will handle missing content)
- Include translation fields in property creation and editing forms

### 4. Data Migration
Create a database migration to add the new columns:
- SQL migration file for Supabase
- Handle existing properties gracefully

### 5. Testing
Test the implementation:
- Verify all languages display correct content
- Test fallback behavior when translations are missing
- Test language switching functionality
- Test property creation and editing with translations

### 6. Documentation
Update documentation:
- Explain how multi-language content works
- Guide for property owners on adding translations
- Technical documentation for developers

## Files to Modify
- `src/components/PropertyCard.tsx` - Main component updates
- `src/pages/EditProperty.tsx` - Admin panel property editing
- `src/pages/ListProperty.tsx` - Property creation form
- `supabase/migrations/` - Database migration file
- `src/integrations/supabase/types.ts` - Type definitions for new fields

## Expected Result
Property cards will display content in the user's selected language, with proper fallbacks for missing translations. The admin panel will provide an interface to manage multi-language content.
