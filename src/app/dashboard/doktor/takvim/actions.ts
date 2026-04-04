"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMusaitlik(formData: FormData) {
  const tarih = formData.get("tarih") as string;
  const baslangic = formData.get("baslangic") as string;
  const bitis = formData.get("bitis") as string;
  const notBilgi = formData.get("not") as string;
  const doktor_id = formData.get("doktor_id") as string;
  const durum = formData.get("durum") as string; // 'musait' veya 'dolu'
  
  if (!tarih || !baslangic || !bitis || !doktor_id) return { success: false, error: "Eksik bilgi" };

  const isMusait = durum !== "dolu"; // default to true unless explicitly 'dolu'

  // Time format handling (SS:DD to SS:DD:00)
  const formattedBaslangic = baslangic.length === 5 ? `${baslangic}:00` : baslangic;
  const formattedBitis = bitis.length === 5 ? `${bitis}:00` : bitis;

  const supabase = await createClient();
  const { error } = await supabase
    .from("doktor_takvim")
    .insert({
      doktor_id,
      tarih,
      baslangic_saat: formattedBaslangic,
      bitis_saat: formattedBitis,
      musait: isMusait,
      not_bilgi: notBilgi || null
    });
    
  if (error) {
    console.error("Müsaitlik eklerken hata:", error);
    return { success: false, error: error.message };
  }
    
  revalidatePath("/dashboard/doktor/takvim");
  return { success: true };
}

export async function deleteMusaitlik(formData: FormData) {
  const musaitlik_id = formData.get("id") as string;
  if (!musaitlik_id) return { success: false };
  
  const supabase = await createClient();
  const { error } = await supabase
    .from("doktor_takvim")
    .delete()
    .eq("id", musaitlik_id);
    
  if (error) {
    console.error("Müsaitlik silerken hata:", error);
    return { success: false, error: error.message };
  }
    
  revalidatePath("/dashboard/doktor/takvim");
  return { success: true };
}
