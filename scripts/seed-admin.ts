/**
 * İlk admin hesabı oluşturma scripti
 * Kullanım: npx tsx scripts/seed-admin.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zmyctowthdzavyplldrw.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function seedAdmin() {
  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY env değişkeni tanımlı değil!");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = "admin@klinik.com";
  const password = "123456";

  // 1. Auth kullanıcısı oluştur
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });

  if (authError) {
    console.error("Auth oluşturma hatası:", authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Auth kullanıcısı oluşturuldu: ${userId}`);

  // 2. user_roles tablosuna ekle
  const { error: rolesError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });

  if (rolesError) {
    console.error("Rol ekleme hatası:", rolesError.message);
  } else {
    console.log("✅ Admin rolü atandı");
  }

  // 3. admin tablosuna ekle
  const { error: adminError } = await supabase.from("admin").insert({
    kullanici_adi: email,
    ad: "Admin",
    soyad: "Kullanıcı",
  });

  if (adminError) {
    console.error("Admin kayıt hatası:", adminError.message);
  } else {
    console.log("✅ Admin tablosuna kaydedildi");
  }

  console.log("\n🎉 İlk admin hesabı başarıyla oluşturuldu!");
  console.log(`   E-posta: ${email}`);
  console.log(`   Şifre: ${password}`);
}

seedAdmin();
