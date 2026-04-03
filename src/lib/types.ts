export type AppRole = 'admin' | 'doktor';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Uzmanlik {
  id: number;
  ad: string;
  aciklama: string | null;
}

export interface Doktor {
  id: string;
  ad: string;
  soyad: string;
  unvan: string | null;
  telefon: string | null;
  email: string | null;
  aktif: boolean;
  olusturulma_tarihi: string;
  klinik_lokasyon: string | null;
  uzmanlik_id: number;

  // Joins
  uzmanliklar?: Uzmanlik;
}

export interface Hizmet {
  id: string;
  hizmet_adi: string;
  fiyat: number | null;
  sure_dakika: number | null;
  aciklama: string | null;
  aktif: boolean;
  uzmanlik_id: number;

  // Joins
  uzmanliklar?: Uzmanlik;
}

export interface RandevuKisi {
  id: string;
  isim: string;
  soyisim: string;
  telefon: string;
}

export type RandevuDurum = 'beklemede' | 'onaylandi' | 'reddedildi' | 'tamamlandi' | 'iptal' | 'gelmedi' | 'gecmis';
export type RandevuTipi = 'Online' | 'Klinik';

export interface Randevu {
  id: string;
  randevu_kisi_id: string;
  doktor_id: string;
  hizmet_id: string;
  randevu_tipi: RandevuTipi;
  online_link: string | null;
  randevu_notu: string | null;
  durum: RandevuDurum;
  olusturulma_tarihi: string;
  red_nedeni: string | null;
  guncellenme_tarihi: string;
  randevu_tarihi: string;
  sms: string;
  callid: string | null;

  // Joins
  randevu_kisi?: RandevuKisi;
  doktor?: Doktor;
  hizmetler?: Hizmet;
}

export type AramaTipi = 'gelen' | 'form' | 'liste';

export interface AramaKayit {
  id: string;
  arama_tipi: AramaTipi;
  numara: string | null;
  cagri_tarihi: string | null;
  cagri_suresi: number | null;
  ozet: string | null;
  kayit_url: string | null;
  transkript: string | null;
  randevu_id: string | null;
  form_id: string | null;
  liste_kisi_id: string | null;
  kayit_tarihi: string;
  maliyet: number | null;
}

export interface Form {
  id: string;
  isim: string | null;
  soyisim: string | null;
  eposta: string | null;
  telefon: string | null;
  mesaj: string | null;
  arama_tetiklendi: boolean;
  olusturulma_tarihi: string;
}

export interface Liste {
  id: string;
  liste_ismi: string;
  aranma_durumu: boolean;
  toplam_kisi: number;
  tamamlanan: number;
  olusturulma_tarihi: string;
  asistan_mesaji: string;
}

export type AramaDurumu = 'bekliyor' | 'aramada' | 'basarili' | 'mesgul';

export interface ListeKisi {
  id: string;
  liste_id: string;
  isim: string | null;
  soyisim: string | null;
  telefon: string | null;
  arama_durumu: AramaDurumu;
  kayit: string | null;
}

export interface DoktorTakvim {
  id: string;
  doktor_id: string;
  tarih: string;
  baslangic_saat: string;
  bitis_saat: string;
  musait: boolean;
  not_bilgi: string | null;
}

export interface AiOzet {
  id: number;
  yogun_saat_araligi: string;
  en_yogun_uzman: string | null;
  gelen_cagri_sayisi: string | null;
  ort_cagri_sure: string | null;
  kaydedilen_randevu: string | null;
  en_randevulu_hizmet: string | null;
  ai_onerileri: string | null;
  olusturulma_tarihi: string;
  en_form_konusu: string | null;
  form_sayisi: string | null;
}

export type IzinTuru = 'yillik_izin' | 'hastalik' | 'diger';

export interface DoktorCalismaProgrami {
  id: string;
  doktor_id: string;
  gun: number; // 0=Pazartesi, 1=Salı, ..., 6=Pazar
  baslangic_saat: string;
  bitis_saat: string;
  aktif: boolean;
  olusturulma_tarihi: string;
}

export interface DoktorIzin {
  id: string;
  doktor_id: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  izin_turu: IzinTuru;
  not_bilgi: string | null;
  olusturulma_tarihi: string;
}
