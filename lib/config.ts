// Merkezi yapılandırma: kategoriler, Bayes eşikleri, kalite filtresi, etiketler.

export const CATEGORIES = [
  "cilt_bakimi",
  "sac_bakimi",
  "agiz_bakimi",
  "vucut_bakimi",
  "gunes_koruma",
  "tiras_epilasyon",
  "deodorant_parfum",
  "el_ayak_tirnak",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  cilt_bakimi: "Cilt Bakımı",
  sac_bakimi: "Saç Bakımı",
  agiz_bakimi: "Ağız Bakımı",
  vucut_bakimi: "Vücut Bakımı",
  gunes_koruma: "Güneş Koruma",
  tiras_epilasyon: "Tıraş / Epilasyon",
  deodorant_parfum: "Deodorant / Parfüm",
  el_ayak_tirnak: "El-Ayak-Tırnak Bakımı",
};

export type PriceTier = "ucuz" | "orta" | "pahali";

export const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  ucuz: "Ekonomik",
  orta: "Dengeli",
  pahali: "Premium",
};

export const PRICE_TIER_ORDER: PriceTier[] = ["ucuz", "orta", "pahali"];

// Bayes minimum yorum eşiği (m): kategori bazlı.
// Yüksek hacimli kategorilerde (cilt) yeni/az yorumlu ürünler daha güçlü cezalanır.
const DEFAULT_MIN_REVIEWS = 150;

export const BAYES_MIN_REVIEWS: Partial<Record<Category, number>> = {
  cilt_bakimi: 500,
  sac_bakimi: 300,
  agiz_bakimi: 300,
  vucut_bakimi: 250,
  gunes_koruma: 200,
  tiras_epilasyon: 150,
  deodorant_parfum: 200,
  el_ayak_tirnak: 150,
};

export function getMinReviews(category: string): number {
  return BAYES_MIN_REVIEWS[category as Category] ?? DEFAULT_MIN_REVIEWS;
}

// Sponsorlu ürünün kalite filtresinden geçmesi için minimum rating.
export const SPONSOR_MIN_RATING = 3.8;

// Bir kategori için ortalama puan (C) bulunamazsa kullanılacak makul varsayılan.
export const FALLBACK_CATEGORY_AVG_RATING = 4.0;

// Kullanıcıya döndürülecek öneri sayısı aralığı.
export const MIN_RECOMMENDATIONS = 2;
export const MAX_RECOMMENDATIONS = 3;

// Basit in-memory rate limit: IP başına dakikada istek.
export const RATE_LIMIT_PER_MINUTE = 10;

// Claude API çağrı timeout (ms).
export const CLAUDE_TIMEOUT_MS = 15_000;

// Modeller: kullanıcı analizi ucuz/hızlı, ürün keşfi daha yetenekli.
export const MODEL_ANALYZE = "claude-haiku-4-5";
export const MODEL_DISCOVER = "claude-opus-4-8";
