import { createClient } from "@/lib/supabase/server";
import { KullanicilarClient } from "@/components/kullanicilar-client";
import { revalidatePath } from "next/cache";
import { createNewUserAction, updateUserAction, deleteUserAction } from "./actions";

export default async function AdminKullanicilarPage() {
  const supabase = await createClient();

  // Veritabanı görünümünden (view) tüm kullanıcıları çek
  // Bu view auth.users ve user_roles tablolarını birleştirir
  const { data: kullanicilarData } = await supabase
    .from("kullanicilar_view")
    .select("*")
    .order("created_at", { ascending: false });

  // Veriyi client component'in beklediği formata çevir
  const kullanicilar = kullanicilarData?.map((kullanici) => {
    return {
      id: kullanici.id,
      user_id: kullanici.user_id,
      role: kullanici.role,
      email: kullanici.auth_email || null,
      ad: kullanici.ad || "",
      soyad: kullanici.soyad || "",
      telefon: kullanici.telefon || "",
      adSoyad: kullanici.ad && kullanici.soyad ? `${kullanici.ad} ${kullanici.soyad}` : null,
    };
  }) || [];

  // Henüz hesabı olmayan (auth_user_id IS NULL) doktorları çekiyoruz
  const { data: availableDoctorsData } = await supabase
    .from("doktor")
    .select("id, ad, soyad, email")
    .is("auth_user_id", null)
    .eq("aktif", true);

  const availableDoctors = availableDoctorsData || [];

  return (
    <KullanicilarClient 
      kullanicilar={kullanicilar}
      availableDoctors={availableDoctors}
      updateAction={updateUserAction} 
      addAction={createNewUserAction}
      deleteAction={deleteUserAction}
    />
  );
}
