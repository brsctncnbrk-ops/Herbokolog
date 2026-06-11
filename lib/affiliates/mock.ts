import type { AffiliateAdapter, AffiliateProductUpdate } from "./types";

// Ortak mock üretici: mevcut değerlere küçük, deterministik-rastgele varyasyon.
function makeMockAdapter(name: string, opts: { stockOutChance: number }): AffiliateAdapter {
  return {
    name,
    async fetchUpdate(input): Promise<AffiliateProductUpdate> {
      const priceJitter = 1 + (Math.random() * 0.1 - 0.05); // ±%5
      const ratingDelta = Math.random() * 0.2 - 0.1; // ±0.1
      const reviewGrowth = Math.floor(Math.random() * 50); // 0-49 yeni yorum
      const inStock = Math.random() > opts.stockOutChance;

      const price = Math.max(1, Math.round(input.currentPrice * priceJitter));
      const rating = Math.min(5, Math.max(0, +(input.currentRating + ratingDelta).toFixed(2)));

      return {
        price,
        rating,
        reviewCount: input.currentReviewCount + reviewGrowth,
        inStock,
        sellerPrice: price,
      };
    },
  };
}

export const trendyolAdapter = makeMockAdapter("trendyol", { stockOutChance: 0.03 });
export const hepsiburadaAdapter = makeMockAdapter("hepsiburada", { stockOutChance: 0.03 });
export const amazonAdapter = makeMockAdapter("amazon", { stockOutChance: 0.05 });

export const ALL_ADAPTERS = [trendyolAdapter, hepsiburadaAdapter, amazonAdapter];
