# TimelyFlow — Proje Kuralları (Rules)

## Teknoloji Stack

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Framework | Next.js (App Router) | ^15.3 (latest stable) |
| UI | React | ^19.1 |
| Veritabanı Client | @supabase/supabase-js | ^2.49 |
| Auth + SSR Cookies | @supabase/ssr | ^0.6 |
| Stil | Tailwind CSS | ^4.x |
| Dil | TypeScript | ^5.8 |

### Yasak Teknolojiler
- `shadcn/ui`, `radix-ui`, `headlessui` veya herhangi bir component kütüphanesi kullanma
- `redux`, `zustand`, `jotai` gibi harici state yönetim kütüphaneleri kullanma
- `axios` kullanma — sadece `fetch` veya Supabase client kullan
- `react-query` / `swr` kullanma — Next.js server components ve `use()` yeterli
- `prisma` veya başka ORM kullanma — doğrudan Supabase client kullan
- `react-hook-form` kullanma — native form actions kullan
- `framer-motion` veya ağır animasyon kütüphaneleri kullanma — sadece CSS transitions/animations

---

## Mimari Kurallar

### App Router Yapısı
```
src/
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx          ← sidebar + auth guard buraya
│   │   ├── page.tsx            ← role'e göre redirect
│   │   ├── admin/
│   │   │   ├── page.tsx        ← admin ana dashboard
│   │   │   ├── randevular/
│   │   │   │   └── page.tsx
│   │   │   ├── doktorlar/
│   │   │   │   └── page.tsx
│   │   │   ├── aramalar/
│   │   │   │   └── page.tsx
│   │   │   └── formlar/
│   │   │       └── page.tsx
│   │   └── doktor/
│   │       ├── page.tsx        ← doktor ana dashboard
│   │       ├── randevular/
│   │       │   └── page.tsx
│   │       └── takvim/
│   │           └── page.tsx
├── components/
│   ├── sidebar.tsx
│   ├── stat-card.tsx
│   └── ...
└── lib/
    ├── supabase/
    │   ├── client.ts           ← createBrowserClient
    │   └── server.ts           ← createServerClient
    └── types.ts
```

### Server vs Client Components
- Veri fetch işlemlerini **Server Component** içinde yap (`async` component)
- Sadece interaktivite gerektiren parçaları (`"use client"`) ile işaretle
- Supabase `server.ts` client'ı sadece server component / server action içinde kullan
- Supabase `client.ts` client'ı sadece `"use client"` componentlerde kullan

### Auth & Middleware
- `middleware.ts` (root seviyede) ile `/dashboard/*` rotaları koru
- Giriş yapmamış kullanıcı → `/login` redirect
- `user_roles` tablosundan role oku:
  - `admin` → `/dashboard/admin`
  - `doktor` → `/dashboard/doktor`
- Yanlış role ile rota erişimi → kendi dashboard'una redirect

---

## Supabase Bağlantı Bilgileri

```
NEXT_PUBLIC_SUPABASE_URL=https://zmyctowthdzavyplldrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<kullanıcıdan alınacak>
```

Auth: Supabase Email/Password (mevcut `doktor_giris` tablosu referans amaçlıdır; gerçek auth Supabase Auth üzerinden çalışır)

---

## Veritabanı Şeması (public)

### `uzmanliklar`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | bigint | PK, identity |
| ad | text | unique |
| aciklama | text | nullable |

### `doktor`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| ad | text | |
| soyad | text | |
| unvan | text | nullable |
| telefon | text | nullable |
| email | text | nullable, unique |
| aktif | boolean | default true |
| olusturulma_tarihi | timestamptz | default now() |
| klinik_lokasyon | text | nullable |
| uzmanlik_id | bigint | FK → uzmanliklar.id |

### `hizmetler`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| hizmet_adi | text | |
| fiyat | numeric | nullable |
| sure_dakika | integer | nullable |
| aciklama | text | nullable |
| aktif | boolean | default true |
| uzmanlik_id | bigint | FK → uzmanliklar.id |

### `randevu_kisi`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| isim | text | |
| soyisim | text | |
| telefon | text | |

### `randevu`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| randevu_kisi_id | uuid | FK → randevu_kisi |
| doktor_id | uuid | FK → doktor |
| hizmet_id | uuid | FK → hizmetler |
| randevu_tipi | text | 'Online' \| 'Klinik' |
| online_link | text | nullable |
| randevu_notu | text | nullable |
| durum | text | 'beklemede'\|'onaylandi'\|'reddedildi'\|'tamamlandi'\|'iptal'\|'gelmedi'\|'gecmis' |
| olusturulma_tarihi | timestamptz | |
| red_nedeni | text | nullable |
| guncellenme_tarihi | timestamptz | |
| randevu_tarihi | text | |
| sms | text | default 'Gönderilmedi' |
| callid | text | nullable |

### `arama_kayit`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| arama_tipi | text | 'gelen' \| 'form' \| 'liste' |
| numara | text | nullable |
| cagri_tarihi | text | nullable |
| cagri_suresi | integer | saniye cinsinden, nullable |
| ozet | text | nullable |
| kayit_url | text | nullable |
| transkript | text | nullable |
| randevu_id | uuid | FK → randevu |
| form_id | uuid | FK → form |
| liste_kisi_id | uuid | FK → liste_kisi |
| kayit_tarihi | timestamptz | |
| maliyet | real | nullable |

### `form`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| isim | text | nullable |
| soyisim | text | nullable |
| eposta | text | nullable |
| telefon | text | nullable |
| mesaj | text | nullable |
| arama_tetiklendi | boolean | default false |
| olusturulma_tarihi | timestamptz | |

### `liste`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| liste_ismi | text | |
| aranma_durumu | boolean | default false |
| toplam_kisi | integer | default 0 |
| tamamlanan | integer | default 0 |
| olusturulma_tarihi | timestamptz | |
| asistan_mesaji | text | |

### `liste_kisi`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| liste_id | uuid | FK → liste |
| isim | text | nullable |
| soyisim | text | nullable |
| telefon | text | nullable |
| arama_durumu | text | 'bekliyor'\|'aramada'\|'basarili'\|'mesgul' |
| kayit | text | nullable |

### `doktor_takvim`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| doktor_id | uuid | FK → doktor |
| tarih | text | |
| baslangic_saat | time | |
| bitis_saat | time | |
| musait | boolean | default true |
| not_bilgi | text | nullable |

### `ai_ozet`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | bigint | PK |
| yogun_saat_araligi | text | |
| en_yogun_uzman | text | nullable |
| gelen_cagri_sayisi | text | nullable |
| ort_cagri_sure | text | nullable |
| kaydedilen_randevu | text | nullable |
| en_randevulu_hizmet | text | nullable |
| ai_onerileri | text | nullable |
| olusturulma_tarihi | timestamptz | |
| en_form_konusu | text | nullable |
| form_sayisi | text | nullable |

### `user_roles`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| role | app_role | 'admin' \| 'doktor' |

---

## Kod Kalitesi Kuralları

- Her component tek bir sorumluluğa sahip olmalı (SRP)
- `any` tip kullanma — her zaman `lib/types.ts` içinden tipleri import et
- Supabase sorgu hatalarını her zaman handle et (`error` kontrolü yap)
- Loading state'leri her zaman göster (Suspense veya skeleton)
- `console.log` bırakma — sadece `console.error` production'da kabul edilir
- Tüm metinler Türkçe olacak (UI labels, error mesajları vs.)
- Environment variable'lar her zaman `.env.local`'dan okunacak, koda hard-code edilmeyecek
