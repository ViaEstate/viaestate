# Environment Setup and Data Source Management

## Overview

This project uses environment-specific configuration files to manage Supabase connections and data sources. The architecture ensures that frontend and XML import processes use the same Supabase instance per environment.

## Environment Files

- `.env.local`: Used for local development (`npm run dev`)
- `.env.staging`: Used for staging builds (`npm run build --mode staging`)
- `.env.production`: Used for production builds (`npm run build`)

Each file contains:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Public anonymous key for frontend
- `VITE_DATA_SOURCE`: Data source type (currently 'supabase')
- `VITE_GOOGLE_TRANSLATE_API_KEY`: Google Translate API key for property description translation
- `SUPABASE_SERVICE_KEY`: Service role key for XML import (not used by frontend)

## Data Source Configuration

The `VITE_DATA_SOURCE` variable controls where data is fetched from:
- `supabase`: Fetch from Supabase database (current implementation)
- Future: `mock` for local development with mock data

## XML Import

The `import-kyero-feed.js` script imports property data from Kyero XML feed into Supabase.

To run the import:
```bash
node import-kyero-feed.js
```

The script reads environment variables from the root `.env` file.

## Switching Environments

- **Local Development**: Uses `.env.local`
- **Staging**: Run `npm run build --mode staging`
- **Production**: Run `npm run build` (uses `.env.production`)

## Changing Supabase Instances

To use different Supabase instances per environment:
1. Update the URL and keys in the respective `.env` files
2. Ensure XML import uses the same instance by updating root `.env`
3. Run import script to populate the new instance with data

## Translation API Setup

The application translates property descriptions from foreign languages to English using multiple fallback services.

### Free Translation (LibreTranslate)

The app uses LibreTranslate (free, open-source) as the primary translation service. No setup required - it uses a public instance with rate limits.

### Paid Translation (Google Translate API)

For higher reliability and unlimited usage, you can set up Google Translate API:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Translation API:
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Translation API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
5. Add the key to your environment files:
   ```
   VITE_GOOGLE_TRANSLATE_API_KEY=your_actual_api_key_here
   ```

### Translation Fallback Order

1. Browser Translation API (if supported)
2. LibreTranslate API (free)
3. Google Translate API (if key provided)
4. Original text (if all fail)

### Important Notes

- LibreTranslate has rate limits on the public instance
- Google Translate API has usage costs - monitor your billing
- The Google API key is exposed client-side (VITE_ prefix), so restrict it to your domains in Google Cloud Console

## Future Enhancements

- Add mock data support for offline development
- Implement automatic environment detection
- Add data source switching UI for testing