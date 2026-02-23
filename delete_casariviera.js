// delete_casariviera.js - Script för att ta bort fastigheter importerade från casariviera.xml
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

// Konfiguration
const SUPABASE_URL = process.env.SUPABASE_URL || "din-supabase-url-här";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "din-service-key-här";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL === "din-supabase-url-här") {
  console.error("❌ Konfigurera SUPABASE_URL och SUPABASE_SERVICE_KEY först!");
  console.error("Använd ENV-variabler eller redigera scriptet direkt.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Referenser från casariviera.xml
const casarivieraReferences = [
  'Ref. 829',
  'Ref. 908',
  'Ref. 823',
  'Ref. 730',
  'Ref. 822',
  'Ref. 820',
  'Ref. 850',
  'Ref. 791',
  'Ref. 833',
  'Ref. 844',
  'Ref. 824',
  'Ref. 508'
];

async function main() {
  console.log("🗑️ Startar borttagning av Casariviera-fastigheter...\n");

  try {
    // Först, visa vilka som kommer tas bort
    console.log("🔍 Kontrollerar vilka fastigheter som finns med dessa referenser...");
    const { data: existingProperties, error: selectError } = await supabase
      .from('properties')
      .select('id, title, xml_object_id')
      .in('xml_object_id', casarivieraReferences);

    if (selectError) {
      console.error("❌ Fel vid kontroll:", selectError);
      return;
    }

    console.log(`📊 Hittade ${existingProperties.length} fastigheter att ta bort:\n`);
    existingProperties.forEach(prop => {
      console.log(`- ${prop.xml_object_id}: ${prop.title}`);
    });

    if (existingProperties.length === 0) {
      console.log("ℹ️ Inga fastigheter att ta bort.");
      return;
    }

    // Bekräfta (i scriptet antar vi ja)
    console.log("\n🗑️ Tar bort fastigheterna...");

    const { data, error } = await supabase
      .from('properties')
      .delete()
      .in('xml_object_id', casarivieraReferences);

    if (error) {
      console.error("❌ Fel vid borttagning:", error);
      return;
    }

    console.log(`✅ Borttagning klar! ${existingProperties.length} fastigheter togs bort.`);

  } catch (err) {
    console.error("❌ Oväntat fel:", err.message);
  }
}

main();