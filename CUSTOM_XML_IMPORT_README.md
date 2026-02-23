# Anpassad XML Import Guide

Denna guide förklarar hur du importerar din egen XML-fil till Supabase.

## Förberedelser

### 1. Installera beroenden
```bash
# Om du använder npm:
npm install

# Om du använder bun:
bun install
```

### 2. Konfigurera miljövariabler
Skapa eller uppdatera din `.env`-fil med följande variabler:

```env
SUPABASE_URL=din-supabase-url-här
SUPABASE_SERVICE_KEY=din-service-key-här
XML_FILE_PATH=./din-xml-fil.xml
OPENAI_API_KEY=din-openai-api-key-här (valfritt, för översättning)
```

Du hittar dina Supabase-värden i Supabase Dashboard under Settings > API.

### 3. Placera din XML-fil
- Placera din XML-fil i projektets rotmapp (samma plats som `package.json`)
- Uppdatera `XML_FILE_PATH` i `.env` om du använder ett annat filnamn

## Kör importen

### Använd npm script (rekommenderas):
```bash
npm run import-custom
```

### Eller kör direkt:
```bash
node import-custom-xml.js
```

## Vad händer under importen?

1. **XML-läsning**: Scriptet läser din XML-fil
2. **Dataparsning**: Extraherar fastighetsdata från XML-strukturen
3. **Bildnedladdning**: Laddar ner bilder från URL:er i XML:en
4. **Bilduppladdning**: Laddar upp bilderna till Supabase Storage
5. **Översättning**: Översätter beskrivningar till engelska (om OpenAI API-nyckel finns)
6. **Databasimport**: Sparar fastigheterna i Supabase-databasen

## XML-format som stöds

Scriptet förväntar sig följande XML-struktur:

```xml
<properties>
  <property>
    <title>Titel på fastigheten</title>
    <images>
      <image>https://exempel.com/bild1.jpg</image>
      <image>https://exempel.com/bild2.jpg</image>
    </images>
    <price>675.000 €</price>
    <location>Plats</location>
    <rooms>2</rooms>
    <baths>2</baths>
    <area>110 m²</area>
    <plot>0 m²</plot>
    <reference>REF123</reference>
    <description>Beskrivning av fastigheten...</description>
  </property>
</properties>
```

## Anpassningar

Om din XML har en annan struktur, kan du modifiera `import-custom-xml.js`:

- **Rad ~197-207**: Ändra hur properties extraheras från XML
- **Rad ~220-240**: Ändra fältmappningen
- **Rad ~155**: Ändra landet (för närvarande hårdkodat till "Spain")

## Felsökning

### Vanliga problem:

1. **"XML-filen finns inte"**: Kontrollera att `XML_FILE_PATH` i `.env` pekar på rätt fil
2. **"Supabase connection failed"**: Kontrollera dina SUPABASE_URL och SUPABASE_SERVICE_KEY
3. **"OpenAI API error"**: OPENAI_API_KEY saknas eller är ogiltig (översättning hoppar över)
4. **Bilder laddas inte upp**: Kontrollera att "property-images" bucket finns i Supabase Storage

### Loggning:
Scriptet skriver detaljerad information till konsolen under körning.

## Verifiering

Efter importen kan du kontrollera att fastigheterna har importerats:

1. Öppna Supabase Dashboard
2. Gå till Table Editor > properties
3. Sök efter dina importerade fastigheter

Eller använd applikationens fastighetssida för att se dem.