// Deterministik skorlama fonksiyonları (saf, test edilebilir).
// AI burada DEVREDE DEĞİL — sadece matematik.

import { getMinReviews, SPONSOR_MIN_RATING } from "../config";

/**
 * Bayes ortalaması (gerçekçi/güvenilir puan):
 *   (C * m + R * v) / (m + v)
 *   R: ürün puanı, v: yorum sayısı, C: kategori ortalama puanı, m: minimum yorum eşiği.
 * Az yorumlu ürünler kategori ortalamasına çekilir (cezalanır).
 */
export function bayesScore(
  R: number,
  v: number,
  C: number,
  m: number,
): number {
  if (m + v <= 0) return C;
  return (C * m + R * v) / (m + v);
}

/**
 * İçerik uygunluk skoru ∈ [0,1].
 * Ürünün etken maddeleri ile AI'ın önerdiği etken maddelerin,
 * IngredientMap üzerindeki matchScore ağırlıklarıyla normalize kesişimi.
 *
 * ingredientWeights: bu kategori+alt ihtiyaç için ingredient -> matchScore haritası.
 * Önerilen maddelerin toplam ağırlığı paydadır; ürünün sahip olduğu maddelerin
 * ağırlık toplamı paydır. Hiç önerilen madde yoksa 0 döner.
 */
export function contentMatchScore(
  productIngredients: string[],
  recommendedIngredients: string[],
  ingredientWeights: Map<string, number>,
): number {
  if (recommendedIngredients.length === 0) return 0;

  const productSet = new Set(productIngredients.map(normalize));

  let denom = 0;
  let numer = 0;
  for (const ing of recommendedIngredients) {
    const key = normalize(ing);
    // Haritada yoksa varsayılan orta ağırlık (0.5) — AI önerdi ama bilimsel
    // eşleşme tablosunda satır yok.
    const weight = ingredientWeights.get(key) ?? 0.5;
    denom += weight;
    if (productSet.has(key)) {
      numer += weight;
    }
  }

  if (denom <= 0) return 0;
  return numer / denom;
}

/** Ürün, kullanıcının kaçınması gereken maddeleri içeriyorsa elenir. */
export function isExcludedByAvoid(
  productIngredients: string[],
  productAvoidFor: string[],
  userAvoid: string[],
  userSubNeeds: string[],
): boolean {
  const avoidSet = new Set(userAvoid.map(normalize));
  const subNeedSet = new Set(userSubNeeds.map(normalize));

  // 1) Ürünün etken maddesi, kullanıcının kaçınması gerekenlerle çakışıyorsa ele.
  for (const ing of productIngredients) {
    if (avoidSet.has(normalize(ing))) return true;
  }
  // 2) Ürünün avoidFor listesi kullanıcının alt ihtiyaçlarıyla çakışıyorsa ele.
  for (const a of productAvoidFor) {
    if (subNeedSet.has(normalize(a))) return true;
  }
  return false;
}

/** Final skor = Bayes puanı × içerik uygunluk skoru. */
export function finalScore(bayes: number, content: number): number {
  return bayes * content;
}

/**
 * Sponsorlu ürün kalite filtresi.
 * Geçemezse sponsorlu gösterilmez, organik akışa düşülür.
 */
export function passesQualityFilter(opts: {
  inStock: boolean;
  rating: number;
  contentScore: number;
  excluded: boolean;
}): boolean {
  if (!opts.inStock) return false;
  if (opts.excluded) return false;
  if (opts.contentScore <= 0) return false;
  if (opts.rating < SPONSOR_MIN_RATING) return false;
  return true;
}

export function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// Skorlanmış ürün için yardımcı tip.
export interface ScoredProduct<T> {
  product: T;
  bayes: number;
  content: number;
  final: number;
  priceTier: string;
}

/**
 * Fiyat kademesi (ucuz/orta/pahali) başına en iyi skorlu ürünü seçer,
 * ardından min..max aralığına tamamlar. Bir kademede ürün yoksa diğer
 * kademelerin kalan en iyileriyle doldurulur (yedek mantığı).
 */
export function pickByTier<T>(
  scored: ScoredProduct<T>[],
  tierOrder: string[],
  min: number,
  max: number,
): ScoredProduct<T>[] {
  const sorted = [...scored].sort((a, b) => b.final - a.final);
  const chosen: ScoredProduct<T>[] = [];
  const usedTiers = new Set<string>();

  // 1. tur: her kademeden en iyi 1 ürün.
  for (const tier of tierOrder) {
    const best = sorted.find((s) => s.priceTier === tier && !chosen.includes(s));
    if (best) {
      chosen.push(best);
      usedTiers.add(tier);
    }
    if (chosen.length >= max) break;
  }

  // 2. tur: min'e ulaşmadıysak ya da yer varsa kalan en iyilerle tamamla.
  if (chosen.length < max) {
    for (const s of sorted) {
      if (chosen.length >= max) break;
      if (!chosen.includes(s)) chosen.push(s);
    }
  }

  // Final skora göre tekrar sırala ve döndür.
  return chosen.sort((a, b) => b.final - a.final).slice(0, Math.max(min, Math.min(max, chosen.length)));
}

export { getMinReviews };
