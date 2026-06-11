// Öneri motoru (Katman 3) — tamamen deterministik backend mantığı.

import { prisma } from "../prisma";
import { parseJsonArray, parseSellerLinks } from "../json";
import {
  FALLBACK_CATEGORY_AVG_RATING,
  MAX_RECOMMENDATIONS,
  MIN_RECOMMENDATIONS,
  PRICE_TIER_LABELS,
  PRICE_TIER_ORDER,
  getMinReviews,
  type PriceTier,
} from "../config";
import {
  bayesScore,
  contentMatchScore,
  finalScore,
  isExcludedByAvoid,
  passesQualityFilter,
  pickByTier,
  type ScoredProduct,
} from "./scoring";
import type { Analysis, RecommendResponse, RecommendationCard } from "../types";

type ProductRow = Awaited<ReturnType<typeof prisma.product.findMany>>[number];

function toCard(
  p: ProductRow,
  matched: string[],
  isSponsored: boolean,
  opts?: { adLabel?: string; approximateMatch?: boolean },
): RecommendationCard {
  const tier = p.priceTier as PriceTier;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    priceTier: p.priceTier,
    priceTierLabel: PRICE_TIER_LABELS[tier] ?? p.priceTier,
    price: p.price,
    rating: p.rating,
    reviewCount: p.reviewCount,
    matchedIngredients: matched,
    sellerLinks: parseSellerLinks(p.sellerLinks),
    imageUrl: p.imageUrl,
    isSponsored,
    adLabel: opts?.adLabel,
    approximateMatch: opts?.approximateMatch,
  };
}

/** Kategori ortalama puanını (C) sorgu anında hesaplar. */
async function categoryAverageRating(category: string): Promise<number> {
  const agg = await prisma.product.aggregate({
    where: { category, inStock: true },
    _avg: { rating: true },
  });
  return agg._avg.rating ?? FALLBACK_CATEGORY_AVG_RATING;
}

/** category+subNeed -> ingredient -> matchScore haritası. */
async function buildIngredientWeights(
  category: string,
  subNeeds: string[],
): Promise<Map<string, number>> {
  const rows = await prisma.ingredientMap.findMany({
    where: {
      category,
      ...(subNeeds.length > 0 ? { subNeed: { in: subNeeds } } : {}),
    },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.ingredient.trim().toLowerCase();
    // Aynı madde birden fazla alt ihtiyaçta geçerse en yüksek ağırlığı tut.
    map.set(key, Math.max(map.get(key) ?? 0, r.matchScore));
  }
  return map;
}

function matchedIngredients(
  productIngredients: string[],
  recommended: string[],
): string[] {
  const recSet = new Set(recommended.map((s) => s.trim().toLowerCase()));
  return productIngredients.filter((i) => recSet.has(i.trim().toLowerCase()));
}

/**
 * Aktif sponsorluk: startDate <= now <= endDate VE kategori eşleşir VE
 * (subNeed null ise tüm kategori, değilse alt ihtiyaç kesişir).
 */
async function findActiveSponsoredProduct(
  analysis: Analysis,
  now: Date,
): Promise<ProductRow | null> {
  const sponsorships = await prisma.sponsorship.findMany({
    where: {
      category: analysis.kategori,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: "desc" },
  });

  for (const s of sponsorships) {
    if (s.subNeed && !analysis.alt_ihtiyaclar.includes(s.subNeed)) continue;
    const product = await prisma.product.findUnique({ where: { id: s.productId } });
    if (product) return product;
  }
  return null;
}

export async function recommend(analysis: Analysis): Promise<RecommendResponse> {
  const now = new Date();
  const category = analysis.kategori;
  const subNeeds = analysis.alt_ihtiyaclar;

  const weights = await buildIngredientWeights(category, subNeeds);
  const C = await categoryAverageRating(category);
  const m = getMinReviews(category);

  // 1) Aktif sponsorluk kontrolü + kalite filtresi.
  const sponsored = await findActiveSponsoredProduct(analysis, now);
  if (sponsored) {
    const ings = parseJsonArray(sponsored.activeIngredients);
    const avoidFor = parseJsonArray(sponsored.avoidFor);
    const content = contentMatchScore(ings, analysis.onerilen_etken_maddeler, weights);
    const excluded = isExcludedByAvoid(
      ings,
      avoidFor,
      analysis.kacinilmasi_gerekenler,
      subNeeds,
    );
    if (
      passesQualityFilter({
        inStock: sponsored.inStock,
        rating: sponsored.rating,
        contentScore: content,
        excluded,
      })
    ) {
      // Aktif sponsorluğun adLabel'ını al.
      const sp = await prisma.sponsorship.findFirst({
        where: {
          productId: sponsored.id,
          category,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });
      return {
        cards: [
          toCard(sponsored, matchedIngredients(ings, analysis.onerilen_etken_maddeler), true, {
            adLabel: sp?.adLabel ?? "Reklam",
          }),
        ],
        guvenNotu: analysis.guven_notu,
        hasSponsored: true,
        message: null,
      };
    }
    // Filtreyi geçemedi -> organik akışa düş.
  }

  // 2) Organik: kategori + alt ihtiyaç eşleşen, stokta olan ürünler.
  const candidates = await prisma.product.findMany({
    where: { category, inStock: true },
  });

  const scored: ScoredProduct<ProductRow>[] = [];
  let anyContentMatch = false;

  for (const p of candidates) {
    const ings = parseJsonArray(p.activeIngredients);
    const pSubNeeds = parseJsonArray(p.subNeeds);
    const avoidFor = parseJsonArray(p.avoidFor);

    // avoidFor / kaçınma çakışması -> ele.
    if (isExcludedByAvoid(ings, avoidFor, analysis.kacinilmasi_gerekenler, subNeeds)) {
      continue;
    }

    // Alt ihtiyaç hiç kesişmiyorsa düşük öncelik (yine de aday kalsın, fallback için).
    const content = contentMatchScore(ings, analysis.onerilen_etken_maddeler, weights);
    if (content > 0) anyContentMatch = true;

    const bayes = bayesScore(p.rating, p.reviewCount, C, m);
    scored.push({
      product: p,
      bayes,
      content,
      final: finalScore(bayes, content),
      priceTier: p.priceTier,
    });
  }

  // 3) İçerik eşleşmesi olan ürünler.
  let pool = scored;
  let approximate = false;
  if (anyContentMatch) {
    pool = scored.filter((s) => s.content > 0);
  } else {
    // Fallback: hiç etken madde eşleşmesi yok -> alt ihtiyaç/kategori bazlı
    // en yüksek Bayes'li ürünleri "yakın eşleşme" olarak göster.
    approximate = true;
    pool = scored
      .map((s) => ({ ...s, final: s.bayes })) // içerik 0 olduğundan Bayes'e göre sırala
      .filter((s) => {
        const pSubNeeds = parseJsonArray(s.product.subNeeds).map((x) =>
          x.toLowerCase(),
        );
        return (
          subNeeds.length === 0 ||
          subNeeds.some((sn) => pSubNeeds.includes(sn.toLowerCase()))
        );
      });
    // Alt ihtiyaç da kesişmiyorsa kategorinin en iyileri.
    if (pool.length === 0) {
      pool = scored.map((s) => ({ ...s, final: s.bayes }));
    }
  }

  const picked = pickByTier(pool, PRICE_TIER_ORDER, MIN_RECOMMENDATIONS, MAX_RECOMMENDATIONS);

  const cards = picked.map((s) =>
    toCard(
      s.product,
      matchedIngredients(
        parseJsonArray(s.product.activeIngredients),
        analysis.onerilen_etken_maddeler,
      ),
      false,
      { approximateMatch: approximate },
    ),
  );

  let message: string | null = null;
  if (cards.length === 0) {
    message =
      "Bu ihtiyaca uygun, stokta ürün bulunamadı. Lütfen ihtiyacını biraz daha farklı ifade etmeyi dene.";
  } else if (approximate) {
    message =
      "Tam etken madde eşleşmesi bulunamadı; bu kategoride en yüksek puanlı yakın ürünleri listeledik.";
  }

  return {
    cards,
    guvenNotu: analysis.guven_notu,
    hasSponsored: false,
    message,
  };
}
