# TimelyFlow Dashboard — Geliştirme Promptu

## Proje Özeti

TimelyFlow, bir kliniğin AI destekli operasyon yönetim sistemidir. Sistem; randevu yönetimi, AI arama motoru (gelen çağrılar, form takibi, liste aramaları), doktor ve takvim yönetimi, ve AI analitik özetlerini kapsıyor.

Bu promptta senden eksiksiz, production-ready bir **Next.js 15 App Router dashboard** uygulaması inşa etmeni istiyorum. Tüm teknik kurallar `rules.md` dosyasında belirtilmiştir — o dosyayı önce oku, sonra kodlamaya başla.

---

## Genel Gereksinimler

- Dil: **TypeScript**, tüm UI metinleri **Türkçe**
- Tema: **Açık tema (light)** — koyu tema yok
- Tasarım: **Minimalist, modern, özgün** — generic/template görünüm yok
- Navigasyon: **Sol sidebar (sabit)**
- İki farklı kullanıcı tipi: **Admin** ve **Doktor** (ayrı sayfalar, ayrı içerik)

---

## Tasarım Yönergesi

**Aesthetic:** Refined minimalism — tıp/sağlık sektörüne uygun ama soğuk ve kurumsal hissetmemeli. Güven, netlik ve verimlilik hissettirmeli.

**Tipografi:**
- Display/başlık: [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display) — rakamlar ve büyük metrikler için
- Body/UI: [Geist](https://vercel.com/font) — (Next.js built-in, `next/font/local`) veya [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- Monospace: [Geist Mono](https://vercel.com/font) — çağrı süreleri, maliyetler, ID'ler için

**Renk Paleti:**
```
--color-bg:        #FAFAF8      /* warm white */
--color-surface:   #FFFFFF
--color-border:    #E8E6E1
--color-text:      #1A1A18
--color-muted:     #6B6860
--color-accent:    #1D4ED8      /* mavi — CTA, aktif link */
--color-success:   #16A34A
--color-warning:   #CA8A04
--color-danger:    #DC2626
--color-ai:        #7C3AED      /* mor — sadece AI içerik için */
```

**Komponent Stili:**
- Sidebar: `#FFFFFF` arka plan, `1px solid #E8E6E1` sağ border, 64px genişlik (collapsed) / 240px (expanded) — ama bu projede sabit 240px
- Stat kartları: beyaz surface, çok hafif shadow (`0 1px 3px rgba(0,0,0,0.06)`), 12px border-radius
- Tablolar: header'da `#F5F4F0` arka plan, satırlar hover'da `#FAFAF8`
- Badge/durum etiketleri: pill şeklinde, `font-size: 0.7rem`, `font-weight: 600`
- Butonlar: primary = accent mavi, secondary = border+muted, ghost = sadece text

---

## Sayfa Detayları

### 1. `/login` — Giriş Sayfası

- Supabase `signInWithPassword` ile email/password girişi
- Giriş sonrası `user_roles` tablosundan role oku
- `admin` → `/dashboard/admin` redirect
- `doktor` → `/dashboard/doktor` redirect
- Hata mesajlarını Türkçe göster
- Tasarım: sayfanın ortasında kompakt form kartı, solda veya üstte marka adı "TimelyFlow" ve kısa bir tagline

---

### 2. Dashboard Layout (`/dashboard/layout.tsx`)

**Sidebar içeriği — Admin:**
```
[TimelyFlow logo / marka adı]

- Ana Sayfa         /dashboard/admin
- Randevular        /dashboard/admin/randevular
- Doktorlar         /dashboard/admin/doktorlar
- Aramalar          /dashboard/admin/aramalar
- Formlar & Listeler /dashboard/admin/formlar

[alt kısım]
- Kullanıcı adı + Çıkış butonu
```

**Sidebar içeriği — Doktor:**
```
[TimelyFlow logo / marka adı]

- Ana Sayfa         /dashboard/doktor
- Randevularım      /dashboard/doktor/randevular
- Takvimim          /dashboard/doktor/takvim

[alt kısım]
- Ad Soyad + Çıkış butonu
```

Layout, server component olacak — mevcut kullanıcı session'ını ve role'ünü kontrol edecek.

---

### 3. `/dashboard/admin` — Admin Ana Sayfa

**Üst Metrik Kartları (4 adet, yatay sıra):**
1. Toplam Randevu (bugün)
2. Bekleyen Randevular
3. Toplam Arama (bu hafta)
4. Aktif Doktor Sayısı

**Orta Bölüm — 2 kolon:**

Sol (%60):
- **Son Randevular** tablosu — son 10 randevu: hasta adı, doktor, hizmet, tarih, durum badge'i

Sağ (%40):
- **AI Özeti** kartı (`ai_ozet` tablosundan en son kayıt)
  - `yogun_saat_araligi`, `gelen_cagri_sayisi`, `ort_cagri_sure`, `kaydedilen_randevu`
  - `ai_onerileri` — italik, mor renk (`--color-ai`), ayrı bir blokta
- Altında **Form İstatistikleri**: toplam form, arama tetiklenmiş form sayısı

**Alt Bölüm:**
- **Doktor Listesi** — kart görünümünde, uzmanlik, aktif/pasif durumu

---

### 4. `/dashboard/admin/randevular` — Randevu Yönetimi

- Tüm randevuları listele (join: randevu_kisi, doktor, hizmetler)
- Filtreleme: durum (dropdown), randevu_tipi (Online/Klinik), doktor adı (search)
- Sütunlar: Hasta Adı, Telefon, Doktor, Hizmet, Tarih, Tip, Durum, SMS durumu
- Durumlar için renk kodlu badge'ler:
  - `beklemede` → sarı
  - `onaylandi` → yeşil
  - `tamamlandi` → mavi
  - `reddedildi` / `iptal` / `gelmedi` → kırmızı
  - `gecmis` → gri
- Satıra tıklandığında detay panel açılsın (drawer/modal olmadan, aynı sayfada sağ panel — CSS ile)

---

### 5. `/dashboard/admin/doktorlar` — Doktor Yönetimi

- Doktor kartları grid görünümü (3 kolon)
- Her kart: ad soyad, unvan, uzmanlık, klinik lokasyon, aktif/pasif badge
- "Aktif / Pasif" toggle — Supabase'de `aktif` alanını günceller (server action)
- Üstte "Doktor Ekle" butonu → inline form (modal yerine sayfada expand)
- Form alanları: ad, soyad, unvan, telefon, email, uzmanlik_id (select), klinik_lokasyon

---

### 6. `/dashboard/admin/aramalar` — Arama Kayıtları

- `arama_kayit` tablosunu listele
- Sütunlar: Tip (gelen/form/liste badge), Numara, Tarih, Süre (mm:ss formatında), Maliyet (₺), Özet (truncated)
- Sıralama: en yeni önce
- Filtre: arama tipi
- Satır genişletme ile `transkript` ve tam `ozet` görünümü
- Özet istatistikler: toplam arama süresi (toplam saniye → saat:dakika), toplam maliyet

---

### 7. `/dashboard/admin/formlar` — Form & Liste Yönetimi

**İki sekme:**

**Sekme 1 — Formlar:**
- `form` tablosunu listele
- Sütunlar: İsim Soyisim, E-posta, Telefon, Mesaj (truncated), Arama Tetiklendi (✓/✗), Tarih

**Sekme 2 — Listeler:**
- `liste` tablosunu kartlarda göster
- Her kart: liste ismi, toplam kişi, tamamlanan, ilerleme bar'ı (tamamlanan/toplam_kisi)
- `aranma_durumu` badge: "Aktif" (yeşil) / "Pasif" (gri)
- Karta tıklayınca genişlet → `liste_kisi` alt tablosunu göster: isim, telefon, `arama_durumu` badge

---

### 8. `/dashboard/doktor` — Doktor Ana Sayfa

- Giriş yapan doktorun kendi verilerini göster
- Doktorun `auth.user.id`'sini `user_roles` ile eşleştir → doktor tablosundan profil bilgisi al

**Üst Metrik Kartları (3 adet):**
1. Bugünkü randevu sayısı
2. Bu haftaki randevu sayısı
3. Bekleyen randevu sayısı

**Orta Bölüm:**
- Bugünkü randevular listesi — saat sıralı, hasta adı, hizmet, tip, durum
- Boşsa "Bugün randevunuz yok" empty state

**Alt Bölüm:**
- Yaklaşan randevular (bugün hariç, gelecek 7 gün)

---

### 9. `/dashboard/doktor/randevular` — Doktorun Randevuları

- Sadece kendi (`doktor_id`) randevularını göster
- Admin randevu sayfasıyla benzer tablo yapısı
- Filtreleme: durum, tarih aralığı
- Her satırda "Onayla" / "Reddet" butonu (`beklemede` durumundakiler için) — server action

---

### 10. `/dashboard/doktor/takvim` — Doktor Takvimi

- `doktor_takvim` tablosundan kendi takvimini çek
- Aylık/haftalık görünüm (CSS Grid tabanlı, kütüphane olmadan)
- Her slot: `baslangic_saat` - `bitis_saat`, `musait` (yeşil) / dolu (kırmızı)
- Üstte "Müsaitlik Ekle" → inline form: tarih (date input), başlangıç saat, bitiş saat, not

---

## Genel Kod Kuralları (rules.md'den özet)

1. Tüm veri fetch işlemleri **Server Component** içinde — client tarafında Supabase sorgusu yok (sadece mutation/action'lar için client)
2. Server Actions (`"use server"`) form submit ve durum güncelleme için kullan
3. Loading state'leri: `<Suspense>` wrapper + skeleton bileşeni
4. Hata state'leri: inline error mesajı, toast yok
5. `any` tip kullanma — `lib/types.ts` içinden import et
6. Gereksiz `"use client"` direktifi koyma

---

## Teslim Edilecekler

Aşağıdaki dosyaların tamamını yaz:

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                         ← / → /login redirect
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     ← role redirect
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── randevular/page.tsx
│   │   │   ├── doktorlar/page.tsx
│   │   │   ├── aramalar/page.tsx
│   │   │   └── formlar/page.tsx
│   │   └── doktor/
│   │       ├── page.tsx
│   │       ├── randevular/page.tsx
│   │       └── takvim/page.tsx
├── components/
│   ├── sidebar.tsx
│   ├── stat-card.tsx
│   ├── badge.tsx
│   ├── skeleton.tsx
│   └── data-table.tsx
├── lib/
│   ├── types.ts
│   ├── utils.ts                         ← formatDate, formatDuration, formatCurrency
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── middleware.ts
```

Ayrıca:
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `postcss.config.mjs`
- `.env.local.example`

---

## Başlamadan Önce

1. `rules.md` dosyasını oku ve kuralları içselleştir
2. `lib/types.ts` dosyasını ilk yaz
3. Supabase client'larını kur
4. Middleware'i yaz
5. Global CSS ve design token'ları tanımla
6. Component'leri yaz (sidebar, stat-card, badge, skeleton, data-table)
7. Sayfaları sırayla yaz: login → dashboard layout → admin pages → doktor pages
