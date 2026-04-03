import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Otomatik randevu durumu güncelleme servisi
 * Tarihi geçmiş randevuların durumlarını otomatik günceller:
 * - 'beklemede' olanlar -> 'gecmis' (çünkü onaylanmadı ve zamanı geçti)
 * - 'onaylandi' olanlar -> 'tamamlandi'
 */
export async function autoUpdatePastAppointments(supabase: SupabaseClient) {
  try {
    // Current time in ISO format to compare with randevu_tarihi
    // Turkey time is UTC+3 but using generic ISO is safer if dates are stored in ISO
    const now = new Date();
    
    // YYYY-MM-DD HH:mm formatında string oluştur (Türkiye saatine göre)
    // Supabase'deki randevu_tarihi "2024-03-25T14:30" veya "2024-03-25 14:30" formatlarında olabilir.
    // Locale "sv-SE" veya "tr-TR" stringleri üzerinden ISO-like bir format alabiliriz.
    // Ancak en güvenlisi yerel saati alıp YYYY-MM-DDTHH:mm:ss formatına dönüştürmektir.
    const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16); 
    // Format: "2024-03-17T14:30"
    
    // 1. Beklemede olan geçmiş randevuları 'gecmis' yap
    const { error: errorBeklemede } = await supabase
      .from("randevu")
      .update({ durum: "gecmis" })
      .eq("durum", "beklemede")
      .lt("randevu_tarihi", localISOTime);

    if (errorBeklemede) {
      console.error("Beklemede randevuları güncelleme hatası:", errorBeklemede);
    }

    // 2. Onaylanmış olan geçmiş randevuları 'tamamlandi' yap
    const { error: errorOnaylandi } = await supabase
      .from("randevu")
      .update({ durum: "tamamlandi" })
      .eq("durum", "onaylandi")
      .lt("randevu_tarihi", localISOTime);

    if (errorOnaylandi) {
      console.error("Onaylı randevuları güncelleme hatası:", errorOnaylandi);
    }

  } catch (error) {
    console.error("Randevu otomatik güncelleme servisinde genel hata:", error);
  }
}
