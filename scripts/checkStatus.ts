import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkStatus() {
  console.log("📊 Checking translation status...\n");

  // Get total properties
  const { count: total } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true });

  // Get properties with Swedish translation
  const { count: swedish } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .not("swedish_title", "is", null);

  // Get properties with Norwegian translation
  const { count: norwegian } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .not("norwegian_title", "is", null);

  // Get properties with Danish translation
  const { count: danish } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .not("danish_title", "is", null);

  // Get properties with Finnish translation
  const { count: finnish } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .not("finnish_title", "is", null);

  const totalCount = total || 0;
  const swedishCount = swedish || 0;
  const norwegianCount = norwegian || 0;
  const danishCount = danish || 0;
  const finnishCount = finnish || 0;

  console.log(`📈 Total properties: ${totalCount}`);
  console.log(`🇸🇪 Swedish translated: ${swedishCount} (${totalCount > 0 ? ((swedishCount/totalCount)*100).toFixed(1) : 0}%)`);
  console.log(`🇳🇴 Norwegian translated: ${norwegianCount} (${totalCount > 0 ? ((norwegianCount/totalCount)*100).toFixed(1) : 0}%)`);
  console.log(`🇩🇰 Danish translated: ${danishCount} (${totalCount > 0 ? ((danishCount/totalCount)*100).toFixed(1) : 0}%)`);
  console.log(`🇫🇮 Finnish translated: ${finnishCount} (${totalCount > 0 ? ((finnishCount/totalCount)*100).toFixed(1) : 0}%)`);
  
  // Get some sample translated properties
  console.log("\n📝 Sample Swedish translations:");
  const { data: samples } = await supabase
    .from("properties")
    .select("id, title, swedish_title")
    .not("swedish_title", "is", null)
    .limit(5);
  
  samples?.forEach(p => {
    console.log(`  - ${p.title?.substring(0, 40)}...`);
    console.log(`    → ${p.swedish_title?.substring(0, 40)}...`);
  });
}

checkStatus().catch(console.error);
