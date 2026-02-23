# Translation Fix Plan

## Problem Summary

The translations stored in Supabase are not being displayed on property cards and articles. The console shows "Translations loaded for language" which is the **UI translation system** (navigation, buttons, labels), NOT the **content translations** (property titles/descriptions and article content).

## Root Cause Analysis

### 1. Property Cards Issue

**Current Implementation** ([`src/components/PropertyCard.tsx`](src/components/PropertyCard.tsx:62-90)):
```typescript
const languageMap: Record<string, string> = {
  en: "english",
  sv: "swedish",
  fi: "finnish",
  da: "danish",
  nb: "norwegian",
  de: "german",
  fr: "french",
  es: "spanish",
  it: "italian",
  hr: "croatian"
};
```

**Database Fields** ([`src/integrations/supabase/types.ts`](src/integrations/supabase/types.ts:290-301)):
- ✅ english_title, english_description
- ✅ finnish_title, finnish_description
- ✅ danish_title, danish_description
- ✅ norwegian_title, norwegian_description
- ✅ swedish_title, swedish_description
- ✅ croatian_title, croatian_description
- ❌ **MISSING**: german, french, spanish, italian

**Additional Bug** (line 78):
```typescript
if (languageSuffix && languageSuffix !== "english") // This skips English!
```

### 2. Articles Issue

**Database Schema** ([`src/lib/supabase.ts`](src/lib/supabase.ts:98-118)):
- The Article table has **NO translation fields at all**
- Only has: id, title, slug, excerpt, content, cover_url, pdf_url, etc.
- No language-specific fields like `swedish_title`

---

## Solution Options

### Option A: Expand Database Columns (Recommended)

Add missing translation columns to existing tables.

**Pros:**
- Simple to implement
- Fast queries (no JOINs)
- Works with existing PropertyCard code

**Cons:**
- Schema becomes wider with many nullable columns
- Adding new languages requires schema changes

### Option B: Translation Table (Normalized)

Create a separate `translations` table with foreign keys.

**Pros:**
- Scalable - add new languages without schema changes
- Single source of truth for all translations

**Cons:**
- More complex queries (JOINs required)
- Requires updating multiple components

### Option C: Client-Side Translation (Fallback)

Translate content on-the-fly using LibreTranslate/Google Translate API.

**Pros:**
- No database changes needed
- Supports any language pair

**Cons:**
- API costs
- Slower performance
- May have accuracy issues

---

## Recommended Solution: Option A (Expand Columns)

This approach extends the existing implementation with minimal code changes.

### Implementation Steps

#### Step 1: Add Missing Database Columns

**For Properties:**
```sql
-- Add missing translation columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS german_title TEXT,
ADD COLUMN IF NOT EXISTS german_description TEXT,
ADD COLUMN IF NOT EXISTS french_title TEXT,
ADD COLUMN IF NOT EXISTS french_description TEXT,
ADD COLUMN IF NOT EXISTS spanish_title TEXT,
ADD COLUMN IF NOT EXISTS spanish_description TEXT,
ADD COLUMN IF NOT EXISTS italian_title TEXT,
ADD COLUMN IF NOT EXISTS italian_description TEXT;
```

**For Articles:**
```sql
-- Add translation columns to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS swedish_title TEXT,
ADD COLUMN IF NOT EXISTS swedish_description TEXT,
ADD COLUMN IF NOT EXISTS german_title TEXT,
ADD COLUMN IF NOT EXISTS german_description TEXT,
ADD COLUMN IF NOT EXISTS french_title TEXT,
ADD COLUMN IF NOT EXISTS french_description TEXT,
ADD COLUMN IF NOT EXISTS finnish_title TEXT,
ADD COLUMN IF NOT EXISTS finnish_description TEXT;
```

#### Step 2: Update TypeScript Types

**Update** [`src/integrations/supabase/types.ts`](src/integrations/supabase/types.ts):
- Add missing property translation fields (german, french, spanish, italian)
- Add article translation fields (swedish, german, french, finnish, etc.)

**Update** [`src/lib/supabase.ts`](src/lib/supabase.ts):
- Add translation fields to Article interface

#### Step 3: Fix PropertyCard Logic

**Fix** [`src/components/PropertyCard.tsx`](src/components/PropertyCard.tsx:78):
```typescript
// BEFORE (bug):
if (languageSuffix && languageSuffix !== "english")

// AFTER (fix):
if (languageSuffix)
```

#### Step 4: Update Articles Components

**Update** [`src/pages/Articles.tsx`](src/pages/Articles.tsx):
- Add language-specific field getter similar to PropertyCard

**Update** [`src/pages/ArticleView.tsx`](src/pages/ArticleView.tsx):
- Add language-specific field getter

#### Step 5: Add Translation Management in Admin Panel

**Update** [`src/pages/AdminPanel.tsx`](src/pages/AdminPanel.tsx):
- Add UI for editing property translations
- Add UI for editing article translations

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/YYYYMMDD_add_translation_columns.sql` | New migration file |
| `src/integrations/supabase/types.ts` | Add TypeScript types for new columns |
| `src/lib/supabase.ts` | Add translation fields to Article interface |
| `src/components/PropertyCard.tsx` | Fix English translation bug |
| `src/pages/Articles.tsx` | Add language-specific display |
| `src/pages/ArticleView.tsx` | Add language-specific display |
| `src/pages/AdminPanel.tsx` | Add translation editing UI |

---

## Verification Steps

1. **Property Cards:**
   - Change language to Swedish (sv) → title/description should change
   - Change language to German (de) → title/description should change
   - Change language to English (en) → should show English translations

2. **Articles:**
   - Change language → title/excerpt should use translated fields

3. **Database:**
   - Verify new columns exist in properties table
   - Verify new columns exist in articles table

---

## Questions Before Implementation

1. Which languages should be supported for articles? (currently: en, sv, fi, da, nb, de, fr, es, it, hr)
2. Should I also add translation support for property features/amenities?
3. Do you want to populate translations for existing properties/articles, or will that be done manually?
