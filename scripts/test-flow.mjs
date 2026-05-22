import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(url, key);

const TEST_EMAIL = "garage-new-test@gmail.com";
const TEST_PASSWORD = "TestPass123!";

async function main() {
  console.log("=== Full E2E Test Flow ===\n");

  // Try to sign in first (in case user already exists and is confirmed)
  let session = null;
  const { data: signInData, error: signInErr } =
    await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

  if (!signInErr && signInData?.user) {
    console.log("[SignIn] OK, user id:", signInData.user.id);
    session = signInData;
  } else {
    console.log("[SignIn] Failed:", signInErr?.message, "— trying signup...");

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signUpErr) {
      console.log("[SignUp] Failed:", signUpErr.message);
      console.log(
        "\nTip: If rate-limited, wait a few minutes and try again."
      );
      console.log(
        "Or disable email confirmations in Supabase Dashboard > Auth > Providers > Email."
      );
      process.exit(1);
    }

    // Try signing in after signup (works if email confirmation is disabled)
    const { data: retryData, error: retryErr } =
      await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    if (retryErr) {
      console.log("[SignIn after SignUp] Failed:", retryErr.message);
      process.exit(1);
    }

    session = retryData;
    console.log("[SignUp+SignIn] OK, user id:", session.user.id);
  }

  const userId = session.user.id;

  // Check existing shop
  const { data: existingShop } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  let shopId;

  if (existingShop) {
    console.log(
      "[Shop] Already exists:",
      existingShop.name,
      "id:",
      existingShop.id
    );
    shopId = existingShop.id;
  } else {
    const { data: newShop, error: shopErr } = await supabase
      .from("shops")
      .insert({
        owner_id: userId,
        name: "テスト自動車整備工場",
        address: "東京都渋谷区神宮前1-1-1",
        latitude: 35.6694,
        longitude: 139.7026,
        description: "E2Eテスト用の店舗です",
        phone: "03-0000-0000",
      })
      .select()
      .single();

    if (shopErr) {
      console.log("[CreateShop] FAIL:", shopErr.message);
      process.exit(1);
    }

    console.log("[CreateShop] OK, id:", newShop.id);
    shopId = newShop.id;
  }

  // Check existing menus
  const { data: existingMenus } = await supabase
    .from("service_menus")
    .select("*")
    .eq("shop_id", shopId);

  if (existingMenus?.length > 0) {
    console.log("[Menus] Already have", existingMenus.length, "menus");
  } else {
    // Add tire change menu
    const { data: menu1, error: menuErr1 } = await supabase
      .from("service_menus")
      .insert({
        shop_id: shopId,
        category: "tire_change",
        name: "タイヤ交換（4本）",
        description: "軽〜普通車のタイヤ交換",
        price_light: 4800,
        price_standard: 6800,
        estimated_minutes: 40,
      })
      .select()
      .single();
    console.log(
      "[AddMenu-Tire]",
      menuErr1 ? "FAIL: " + menuErr1.message : "OK id:" + menu1.id
    );

    // Add oil change menu
    const { data: menu2, error: menuErr2 } = await supabase
      .from("service_menus")
      .insert({
        shop_id: shopId,
        category: "oil_change",
        name: "エンジンオイル交換",
        description: "0W-20推奨",
        price_light: 3500,
        price_standard: 4500,
        estimated_minutes: 20,
      })
      .select()
      .single();
    console.log(
      "[AddMenu-Oil]",
      menuErr2 ? "FAIL: " + menuErr2.message : "OK id:" + menu2.id
    );

    // Add inspection menu
    const { data: menu3, error: menuErr3 } = await supabase
      .from("service_menus")
      .insert({
        shop_id: shopId,
        category: "inspection",
        name: "車検（法定費用別）",
        description: "基本点検整備一式",
        price_light: 38000,
        price_standard: 48000,
        estimated_minutes: 120,
      })
      .select()
      .single();
    console.log(
      "[AddMenu-Inspection]",
      menuErr3 ? "FAIL: " + menuErr3.message : "OK id:" + menu3.id
    );
  }

  // Check existing work records
  const { data: existingRecords } = await supabase
    .from("work_records")
    .select("*")
    .eq("shop_id", shopId);

  if (existingRecords?.length > 0) {
    console.log(
      "[Records] Already have",
      existingRecords.length,
      "records"
    );
  } else {
    const { data: rec1, error: recErr1 } = await supabase
      .from("work_records")
      .insert({
        shop_id: shopId,
        title: "N-BOX タイヤ交換",
        description: "155/65R14 スタッドレスからサマータイヤへ交換",
        category: "tire_change",
        car_type: "light",
        labor_cost: 4800,
        duration_minutes: 35,
      })
      .select()
      .single();
    console.log(
      "[AddRecord-1]",
      recErr1 ? "FAIL: " + recErr1.message : "OK id:" + rec1.id
    );

    const { data: rec2, error: recErr2 } = await supabase
      .from("work_records")
      .insert({
        shop_id: shopId,
        title: "プリウス エンジンオイル交換",
        description: "0W-20 フィルター同時交換",
        category: "oil_change",
        car_type: "standard",
        labor_cost: 4500,
        duration_minutes: 25,
      })
      .select()
      .single();
    console.log(
      "[AddRecord-2]",
      recErr2 ? "FAIL: " + recErr2.message : "OK id:" + rec2.id
    );
  }

  // Final verification
  console.log("\n=== Verification ===\n");

  const { data: shops } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", userId);
  console.log(`Shops: ${shops?.length || 0}`);

  const { data: menus } = await supabase
    .from("service_menus")
    .select("*")
    .eq("shop_id", shopId);
  console.log(`Menus: ${menus?.length || 0}`);

  const { data: records } = await supabase
    .from("work_records")
    .select("*")
    .eq("shop_id", shopId);
  console.log(`Work Records: ${records?.length || 0}`);

  const { data: feeRules } = await supabase
    .from("platform_fee_rules")
    .select("*");
  console.log(`Fee Rules: ${feeRules?.length || 0}`);

  if (shops?.length && menus?.length && records?.length) {
    console.log("\n✓ All E2E tests passed! Data is persisted in Supabase.");
    console.log(`\nTest login credentials:`);
    console.log(`  Email: ${TEST_EMAIL}`);
    console.log(`  Password: ${TEST_PASSWORD}`);
    console.log(`  Shop ID: ${shopId}`);
  } else {
    console.log("\n✗ Some data is missing.");
  }

  await supabase.auth.signOut();
  console.log("[SignOut] Done");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
