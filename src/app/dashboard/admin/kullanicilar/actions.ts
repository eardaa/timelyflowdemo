"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Supabase Admin API kullanarak yeni kullanıcı oluşturacak servis
export async function createNewUserAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const adSoyadInput = (formData.get("adSoyad") as string) || "";
  
  // Ad Soyad parse et
  const parts = adSoyadInput.trim().split(" ");
  const ad = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "";
  const soyad = parts.length > 1 ? parts[parts.length - 1] : "";

  // Supabase URL ve Service Role Key al
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      success: false,
      message: "Projede gerekli ortam değişkenleri tanımlı değil! (.env.local içine SUPABASE_SERVICE_ROLE_KEY eklenmeli)"
    };
  }

  try {
    // Supabase Admin İstemcisi oluştur (Bu işlem public API anahtarıyla yapılamaz)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Auth Create User işlemi
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Otomatik onaylandı sayılır
      app_metadata: { role: role } // Metadata içerisinde de rolü tutabiliriz
    });

    if (authError || !authData.user) {
      console.error("Auth oluşturma hatası:", authError);
      return { success: false, message: authError?.message || "Kullanıcı oluşturulamadı!" };
    }

    const userId = authData.user.id;

    // 2. User Roles kaydını gir (Trigger zaten ekliyor olabilir, ancak manuel tetiklemek güvenlidir veya yetkisizlikte on conflict do nothing yapılabilir)
    // Varsayım: veritabanı schema'sında insert yetkisi service_role ile yapılacağından sorun çıkarmayacaktır.
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: role }, { onConflict: "user_id" });

    if (rolesError) {
      console.error("User Roles kayıt hatası:", rolesError);
    }

    // 3. Admin / Doktor tablolarına kayıt işlemi
    if (role === "admin") {
      await supabaseAdmin.from("admin").upsert({
        kullanici_adi: email,
        ad: ad,
        soyad: soyad
      }, { onConflict: "kullanici_adi" });
    } else if (role === "doktor") {
      const doktorId = formData.get("doktor_id") as string;
      if (!doktorId) {
        return { success: false, message: "Lütfen bir doktor seçin." };
      }

      // Var olan doktoru auth_user_id ile güncelleyelim, email ataması yapalım
      const { error: doktorError } = await supabaseAdmin
        .from("doktor")
        .update({ email: email, auth_user_id: userId })
        .eq("id", doktorId);

      if (!doktorError) {
        // Doktor girişine kayıt (eğer o tablo kullanımda kalacaksa)
        await supabaseAdmin.from("doktor_giris").upsert({
          doktor_id: doktorId,
          kullanici_adi: email
        }, { onConflict: "doktor_id" });
      } else {
        console.error("Doktora hesap bağlama sırasında hata:", doktorError);
        return { success: false, message: "Doktor hesaba bağlanamadı." };
      }
    }

    revalidatePath("/dashboard/admin/kullanicilar");
    return { success: true, message: "Kullanıcı başarıyla oluşturuldu." };

  } catch (err: any) {
    console.error("Bilinmeyen Server Action Hatası:", err);
    return { success: false, message: "Beklenmeyen bir hata oluştu: " + err.message };
  }
}

// Supabase Admin API kullanarak kullanıcı bilgilerini (ve şifresini) güncelleyecek servis
export async function updateUserAction(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const newEmail = formData.get("email") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string; // Yeni şifre alanı
  const adSoyadInput = (formData.get("adSoyad") as string) || "";
  
  // Ad Soyad parse et
  const parts = adSoyadInput.trim().split(" ");
  const ad = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "";
  const soyad = parts.length > 1 ? parts[parts.length - 1] : "";

  // Supabase URL ve Service Role Key al
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      success: false,
      message: "Projede gerekli ortam değişkenleri tanımlı değil! (.env.local içine SUPABASE_SERVICE_ROLE_KEY eklenmeli)"
    };
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Şifre alanı doldurulduysa Auth kullanıcısının şifresini güncelle
    if (password && password.length >= 6) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: password }
      );
      
      if (passwordError) {
        console.error("Şifre güncelleme hatası:", passwordError);
        return { success: false, message: passwordError.message || "Şifre güncellenemedi!" };
      }
    }

    // 2. RPC çağrısı ile diğer veritabanı kısımlarını güncelle (E-posta, Rol, Admin/Doktor bilgileri)
    const { error: rpcError } = await supabaseAdmin.rpc("update_kullanici_info", {
      p_user_id: userId,
      p_new_email: newEmail,
      p_role: role,
      p_ad: ad,
      p_soyad: soyad
    });

    if (rpcError) {
      console.error("Kullanıcı güncellenirken hata oluştu:", rpcError);
      return { success: false, message: rpcError.message || "Kullanıcı bilgileri güncellenemedi!" };
    }

    revalidatePath("/dashboard/admin/kullanicilar");
    return { success: true, message: "Kullanıcı başarıyla güncellendi." };

  } catch (err: any) {
    console.error("Bilinmeyen Güncelleme Hatası:", err);
    return { success: false, message: "Beklenmeyen bir hata oluştu: " + err.message };
  }
}


// Kullanıcıyı silme
export async function deleteUserAction(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const role = formData.get("role") as string;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { success: false, message: "Sunucu yapılandırma hatası." };
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    if (role === "doktor") {
      const { data: doktorData } = await supabaseAdmin
        .from("doktor")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

      if (doktorData) {
        await supabaseAdmin.from("doktor_giris").delete().eq("doktor_id", doktorData.id);
        await supabaseAdmin.from("doktor").update({ aktif: false, auth_user_id: null }).eq("id", doktorData.id);
      }
    } else if (role === "admin") {
      return { success: false, message: "Admin kullanıcıları arayüzden silinemez." };
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return { success: false, message: "Kullanıcının auth hesabı silinemedi: " + authDeleteError.message };
    }

    revalidatePath("/dashboard/admin/kullanicilar");
    return { success: true, message: "Kullanıcı başarıyla silindi ve pasife alındı." };

  } catch (err: any) {
    return { success: false, message: "Beklenmeyen bir hata oluştu: " + err.message };
  }
}
