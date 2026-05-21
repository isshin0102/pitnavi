import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Testing Supabase connection...");
console.log("URL:", url);
console.log("Key:", key?.substring(0, 20) + "...");

const supabase = createClient(url, key);

// Test auth
const { data: authData, error: authError } = await supabase.auth.getSession();
if (authError) {
  console.log("Auth error:", authError.message);
} else {
  console.log("Auth connection OK");
}

// Test if shops table exists
const { data, error } = await supabase.from("shops").select("id").limit(1);
if (error) {
  console.log("Shops table:", error.message);
  console.log("Code:", error.code);
} else {
  console.log("Shops table exists, rows:", data.length);
}

// Test if platform_fee_rules table exists
const { data: feeData, error: feeError } = await supabase
  .from("platform_fee_rules")
  .select("*")
  .limit(1);
if (feeError) {
  console.log("Fee rules table:", feeError.message);
} else {
  console.log("Fee rules table exists, rows:", feeData.length);
}
