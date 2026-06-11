# Herbokolog 🌿

Yapay zeka destekli kişisel bakım ürünü öneri platformu. Kullanıcı ihtiyacını
Türkçe serbest metinle anlatır; sistem yapay zeka ile ihtiyacı çıkarır ve
**deterministik backend kurallarıyla** ürün önerir. Sponsorlu ürün varsa
**sadece onu** "Reklam" etiketiyle, yoksa fiyat kademesine göre 2-3 organik
öneriyi affiliate linkleriyle gösterir.

**Kapsam:** cilt, saç, ağız, vücut bakımı, güneş koruma, tıraş/epilasyon,
deodorant/parfüm, el-ayak-tırnak. **Hedef pazar:** Türkiye (arayüz Türkçe).

---

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env        # değerleri doldurun (boş ANTHROPIC_API_KEY de çalışır)
npx prisma db push          # SQLite şemasını oluştur
npx prisma db seed          # 51 örnek ürün + etken madde haritası + sponsorluklar
npm run dev                 # http://localhost:3000
```

> **API anahtarı olmadan da çalışır.** `ANTHROPIC_API_KEY` boşsa sistem,
> deterministik **anahtar-kelime tabanlı yedek analiz katmanına** düşer. Böylece
> demo, anahtar olmadan da uçtan uca çalışır. Anahtar verilirse gerçek Claude
> çağrısı kullanılır; JSON hatasında 1 kez retry, yine başarısızsa yedek devreye girer.

### Testler

```bash
npm test         # skorlama motoru unit testleri (Vitest) — 20 test
```

---

## Ortam Değişkenleri (`.env`)

| Değişken | Açıklama |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API anahtarı. **Boş bırakılırsa** yedek analiz devreye girer. |
| `DATABASE_URL` | SQLite: `file:./dev.db` |
| `CRON_SECRET` | Cron route'ları için `Authorization: Bearer <CRON_SECRET>` |
| `ADMIN_PASSWORD` | `/admin` paneli giriş şifresi |
| `ADMIN_SESSION_SECRET` | Admin oturum çerezini imzalamak için gizli anahtar |

---

## Mimari — 4 Katman

```
                ┌──────────────────────────────────────────────────┐
   Kullanıcı    │  ÖN YÜZ (Next.js App Router, Tailwind)           │
   metni  ───►  │  textarea + örnek çipler  →  sonuç kartları       │
                └───────────────┬──────────────────────────────────┘
                                │ POST /api/analyze
                ┌───────────────▼──────────────────────────────────┐
   KATMAN 1     │  AI ANALİZ  (lib/ai/analyze.ts)                   │
                │  Claude (haiku) → YALNIZCA JSON                   │
                │  • anahtar yoksa → keyword fallback              │
                │  • kategori_disi / tibbi_uyari erken dönüş        │
                │  ÇIKTI: {kategori, alt_ihtiyaclar, etken_maddeler,│
                │          kacinilmasi, guven_notu, tibbi_uyari...} │
                └───────────────┬──────────────────────────────────┘
                                │ POST /api/recommend  (analiz çıktısı)
                ┌───────────────▼──────────────────────────────────┐
   KATMAN 3     │  ÖNERİ MOTORU (deterministik — lib/recommend/)   │
                │  1) Aktif sponsorluk? → kalite filtresi → tek    │
                │     "Reklam" kartı (geçemezse organiğe düşer)    │
                │  2) Organik: Bayes × içerik uygunluğu skorla     │
                │     • Bayes: (C·m + R·v)/(m+v)                    │
                │     • içerik: IngredientMap ağırlıklı kesişim     │
                │     • avoidFor çakışan ürün elenir               │
                │  3) fiyat kademesi başına en iyi → 2-3 kart       │
                └───────────────┬──────────────────────────────────┘
                                │ Prisma
                ┌───────────────▼──────────────────────────────────┐
   KATMAN 2     │  VERİTABANI (SQLite + Prisma)                     │
                │  Product · Sponsorship · IngredientMap            │
                └──────────────────────────────────────────────────┘

   KATMAN 4 (Yasal): "Reklam" rozeti (gizlenemez), affiliate açıklaması,
   tıbbi uyarı, /kvkk placeholder, kullanıcı sorguları KAYDEDİLMEZ (KVKK).
```

### Önemli ilke
Öneri/sponsorluk mantığı **asla** AI promptunda değildir. AI yalnızca ihtiyaç
çıkarımı yapar; ürün seçimi tamamen backend'de deterministik kurallarladır.

---

## Skorlama (Katman 3 detayı)

- **Bayes puanı:** `(C·m + R·v) / (m + v)` — `R`: ürün puanı, `v`: yorum sayısı,
  `C`: kategori ortalama puanı (sorgu anında DB'den), `m`: minimum yorum eşiği
  (kategori bazlı; `lib/config.ts`). Az yorumlu yüksek puanlar doğal olarak cezalanır.
- **İçerik uygunluk skoru** ∈ [0,1]: ürünün etken maddeleri ile AI'ın önerdiği
  maddelerin `IngredientMap` ağırlıklı kesişimi.
- **Final skor = Bayes × içerik.** `avoidFor` çakışan ürün elenir.
- **Sponsorlu kalite filtresi:** stokta + avoidFor çakışması yok + içerik skoru>0
  + rating ≥ eşik. Geçemezse sponsorlu gösterilmez, organik akışa düşülür.
- **Yedek:** hiç etken madde eşleşmesi yoksa, alt ihtiyaç/kategori bazlı en yüksek
  Bayes'li ürünler "yakın eşleşme" notuyla gösterilir.

---

## Admin Paneli — `/admin`

Şifre korumalı (env `ADMIN_PASSWORD`). İmzalı httpOnly çerez tabanlı oturum.

- Ürün listesi (ekle / stok aç-kapat / sil)
- **Sponsorluk ekleme** (tek manuel iş): ürün + kategori/alt ihtiyaç + tarih
- Cron job'larını manuel tetikleme butonları

---

## Cron Job'lar (Otonomluk)

Hepsi `Authorization: Bearer ${CRON_SECRET}` ile korunur. Vercel Cron için
zamanlamalar `vercel.json` içindedir. Lokalde manuel tetikleme:

```bash
curl -X GET http://localhost:3000/api/cron/update-products  -H "Authorization: Bearer $CRON_SECRET"
curl -X GET http://localhost:3000/api/cron/discover-products -H "Authorization: Bearer $CRON_SECRET"
curl -X GET http://localhost:3000/api/cron/sponsor-check      -H "Authorization: Bearer $CRON_SECRET"
```

| Job | Sıklık | İş |
|---|---|---|
| `update-products` | haftalık | Affiliate'lerden fiyat/puan/yorum/stok günceller. Stoksuz → `inStock:false`. |
| `discover-products` | haftalık | Claude (opus) ile yeni ürün adayları üretir, duplicate (name+brand) kontrolü, `reviewCount:0` ekler. |
| `sponsor-check` | günlük | Süresi biten sponsorlukları raporlar (silme yok — tarih kontrolü sorgu anında). |

**Affiliate adapter'lar** (`lib/affiliates/`): `trendyol.ts`, `hepsiburada.ts`,
`amazon.ts` şimdilik **mock** (küçük rastgele varyasyon). Gerçek API'ye geçişte
`AffiliateAdapter` arayüzü sabit kalır, yalnızca `fetchUpdate` implementasyonu değişir.

---

## Gerçek Affiliate / Üretim Notları

- **Mock → gerçek:** `lib/affiliates/*.ts` içindeki `fetchUpdate`'i ilgili
  affiliate API çağrısıyla değiştirin; arayüz değişmez.
- **Rate limit:** `lib/rate-limit.ts` in-memory'dir; serverless'ta (Vercel) her
  instance ayrı bellek tutar. Üretimde Redis/Upstash gibi paylaşımlı bir store önerilir.
- **Veritabanı:** SQLite demo içindir. PostgreSQL'e geçiş: `schema.prisma`
  provider'ını `postgresql` yapın; JSON dizileri için `String` alanlar `Json`'a
  yükseltilebilir (parse yardımcıları `lib/json.ts`).
- **KVKK:** `/kvkk` placeholder'ı dağıtımdan önce hukuk danışmanıyla tamamlanmalı.

---

## Yapılan Varsayımlar

Spec'te belirsiz/eksik kalan ve bu uygulamada netleştirilen noktalar:

1. AI JSON şemasına **`tibbi_uyari` + `tibbi_aciklama`** alanları eklendi (tıbbi
   durumda öneri durdurulup doktora yönlendirme için yapısal sinyal).
2. `.env`'e **`ADMIN_PASSWORD`** ve **`ADMIN_SESSION_SECRET`** eklendi.
3. **Sponsorlu kalite filtresi** tanımlandı: stokta + avoidFor uyumlu + içerik>0
   + rating ≥ eşik.
4. **Fiyat kademesi yedeği:** bir kademede ürün yoksa en iyi skorlularla 2-3'e tamamlanır.
5. **Etken madde eşleşmesi hiç yoksa** "yakın eşleşme" fallback'i.
6. **Bayes `C`** sorgu anında DB ortalamasından hesaplanır.
7. `discover-products` **duplicate** kriteri: `name`+`brand` (normalize).
8. Admin auth: imzalı httpOnly çerez (harici bağımlılık yok).
9. Anahtar yokken **keyword fallback** analiz (demo anahtarsız çalışsın diye).
10. Test çatısı **Vitest**; analiz modeli `claude-haiku-4-5`, keşif `claude-opus-4-8`.

---

## Teknoloji Yığını

Next.js 14 (App Router, TypeScript strict) · Tailwind CSS · Prisma + SQLite ·
Anthropic Claude API · Vitest · zod
