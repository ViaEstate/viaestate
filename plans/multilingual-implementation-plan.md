# ViaEstate Multilingual Implementation Plan

## Current State Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| Locale files (8 languages) | ✅ Complete | en, sv, da, de, it, es, hr, fr all exist with translations |
| LanguageContext | ❌ Empty | Needs full implementation |
| Routing | ❌ HashRouter | Needs BrowserRouter for path-based URLs |
| 404.html | ⚠️ Partial | Uses query-string pattern, needs update |
| hreflang tags | ❌ Missing | Not in index.html |
| Language switcher | ❌ Missing | Component needs creation |
| Translation hook | ❌ Missing | Needs creation |

## Architecture Overview

```mermaid
graph TB
    subgraph BrowserRouter - Path-based Routing
        A[BrowserRouter] --> B[/en/ path]
        A --> C[/sv/ path]
        A --> D[...other lang paths]
        A --> E[Default - redirects to /en]
    end
    
    subgraph LanguageContext
        F[LanguageProvider] --> G[currentLang]
        F --> H[translations]
        F --> I[loadLanguage]
        F --> J[setLanguage]
    end
    
    subgraph Components
        K[Navigation] --> L[LanguageSwitcher]
        M[All Pages] --> N[useTranslation hook]
    end
    
    K --> F
    M --> F
```

## Implementation Steps

### Phase 1: Core Language Infrastructure

- [ ] **1.1** Create `src/lib/i18n.ts` - Core i18n utilities
  - `getLangFromPath()` function
  - `loadLanguage()` function
  - `applyTranslations()` function

- [ ] **1.2** Implement `src/contexts/LanguageContext.tsx`
  - `LanguageProvider` component
  - `useLanguage()` hook
  - `useTranslation()` hook
  - LocalStorage persistence for language preference

- [ ] **1.3** Update `src/App.tsx`
  - Change from `HashRouter` to `BrowserRouter`
  - Wrap app with `LanguageProvider`
  - Add language-prefixed routes: `/:lang/*`

### Phase 2: Language Switcher Component

- [ ] **2.1** Create `src/components/LanguageSwitcher.tsx`
  - Dropdown with all 8 languages
  - Active language indicator
  - Proper href links for each language
  - Mobile-friendly design

- [ ] **2.2** Update `src/components/Navigation.tsx`
  - Add LanguageSwitcher to nav bar
  - Use translated labels from context

### Phase 3: Translation Application

- [ ] **3.1** Create translation helper utilities
  - `useTranslation()` hook for component-level translations
  - Direct translation function for dynamic content

- [ ] **3.2** Update key components with translations
  - Navigation labels
  - Hero section
  - Property cards
  - Search filters
  - Footer content

### Phase 4: SEO Enhancements

- [ ] **4.1** Update `index.html`
  - Add hreflang tags for all 8 languages
  - Add `lang` attribute management via JS

- [ ] **4.2** Update `public/404.html`
  - Implement language-aware redirect
  - Preserve language prefix in redirect

### Phase 5: Configuration & Testing

- [ ] **5.1** Update `vite.config.ts` if needed
  - Ensure proper SPA fallback configuration

- [ ] **5.2** Create `src/lib/translation-utils.ts`
  - Helper functions for nested translation keys
  - Fallback value handling

- [ ] **5.3** Test checklist
  - [ ] Direct links: /sv, /de, /fr work
  - [ ] Page reload on each language preserves language
  - [ ] Fallback to English for unsupported paths
  - [ ] All UI text translates correctly
  - [ ] No 404 errors
  - [ ] Mobile and desktop views
  - [ ] Language switcher works correctly

## Route Structure

```
/                     → Redirect to /en
/:lang/               → Language-prefixed routes
/:lang/               → Index page
/:lang/properties     → Properties page
/:lang/properties/:id → Property detail
/:lang/login          → Login page
...                   → All other pages with :lang prefix
```

## Supported Languages

| Code | Name (Native) | Name (English) |
|------|---------------|-----------------|
| en   | English       | English         |
| sv   | Svenska       | Swedish         |
| da   | Dansk         | Danish          |
| de   | Deutsch       | German          |
| it   | Italiano      | Italian         |
| es   | Español       | Spanish         |
| hr   | Hrvatski      | Croatian        |
| fr   | Français      | French          |

## Files to Modify

1. `src/App.tsx` - Router and provider setup
2. `src/contexts/LanguageContext.tsx` - Core language context
3. `src/components/Navigation.tsx` - Add language switcher
4. `src/components/LanguageSwitcher.tsx` - New component
5. `src/lib/i18n.ts` - New core i18n utilities
6. `index.html` - Add hreflang tags
7. `public/404.html` - Update redirect logic

## Files to Create

1. `src/lib/i18n.ts` - Core i18n utilities
2. `src/components/LanguageSwitcher.tsx` - Language dropdown

## Files Already Complete (verify)

1. ✅ `locales/en.json` - Master translations
2. ✅ `locales/sv.json` - Swedish
3. ✅ `locales/da.json` - Danish
4. ✅ `locales/de.json` - German
5. ✅ `locales/it.json` - Italian
6. ✅ `locales/es.json` - Spanish
7. ✅ `locales/hr.json` - Croatian
8. ✅ `locales/fr.json` - French
