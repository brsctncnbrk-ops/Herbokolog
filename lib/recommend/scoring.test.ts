import { describe, it, expect } from "vitest";
import {
  bayesScore,
  contentMatchScore,
  isExcludedByAvoid,
  finalScore,
  passesQualityFilter,
  pickByTier,
  type ScoredProduct,
} from "./scoring";

describe("bayesScore", () => {
  it("az yorumlu yüksek puanı kategori ortalamasına çeker", () => {
    // Gerçekçi kategori ortalaması (C), yüksek-yorumlu ürünün puanından düşüktür.
    const C = 4.2; // kategori ortalaması (ürünlerin geneli)
    const m = 500; // eşik
    // 20 yorumlu 5.0 puanlı ürün: az veri -> C'ye güçlü çekilir.
    const fewReviews = bayesScore(5.0, 20, C, m); // ~4.23
    // 3000 yorumlu 4.4 puanlı ürün: çok veri -> kendi puanına yakın kalır.
    const manyReviews = bayesScore(4.4, 3000, C, m); // ~4.37
    // Az yorumlu 5.0, çok yorumlu 4.4'ün GERİSİNDE kalmalı (Bayes etkisi).
    expect(fewReviews).toBeLessThan(manyReviews);
  });

  it("çok yorumlu ürün gerçek puanına yaklaşır", () => {
    const score = bayesScore(4.8, 5000, 4.0, 200);
    expect(score).toBeGreaterThan(4.7);
  });

  it("sıfır yorumlu ürün tam kategori ortalamasını alır", () => {
    expect(bayesScore(5.0, 0, 4.0, 200)).toBeCloseTo(4.0, 5);
  });
});

describe("contentMatchScore", () => {
  const weights = new Map([
    ["salisilik_asit", 0.9],
    ["niasinamid", 0.85],
  ]);

  it("tam eşleşme 1.0 döner", () => {
    const s = contentMatchScore(["salisilik_asit"], ["salisilik_asit"], weights);
    expect(s).toBeCloseTo(1.0, 5);
  });

  it("önerilen madde yoksa 0 döner", () => {
    expect(contentMatchScore(["salisilik_asit"], [], weights)).toBe(0);
  });

  it("ağırlıklı kısmi eşleşme", () => {
    // İki madde öneriliyor (0.9 + 0.85), ürün sadece 0.9'u içeriyor.
    const s = contentMatchScore(
      ["salisilik_asit"],
      ["salisilik_asit", "niasinamid"],
      weights,
    );
    expect(s).toBeCloseTo(0.9 / (0.9 + 0.85), 5);
  });

  it("haritada olmayan madde için varsayılan ağırlık kullanır", () => {
    const s = contentMatchScore(["bilinmeyen"], ["bilinmeyen"], weights);
    expect(s).toBeCloseTo(1.0, 5); // 0.5 / 0.5
  });
});

describe("isExcludedByAvoid", () => {
  it("ürün maddesi kullanıcı kaçınma listesinde ise eler", () => {
    expect(
      isExcludedByAvoid(["agir_yaglar"], [], ["agir_yaglar"], ["yagli_sac"]),
    ).toBe(true);
  });

  it("ürün avoidFor'u kullanıcı alt ihtiyacıyla çakışırsa eler", () => {
    expect(
      isExcludedByAvoid(["x"], ["yagli_sac"], [], ["yagli_sac"]),
    ).toBe(true);
  });

  it("çakışma yoksa elemez", () => {
    expect(isExcludedByAvoid(["niasinamid"], [], [], ["yagli_sac"])).toBe(false);
  });
});

describe("finalScore", () => {
  it("bayes ve içerik skorunun çarpımı", () => {
    expect(finalScore(4.0, 0.5)).toBeCloseTo(2.0, 5);
  });
  it("içerik skoru 0 ise final 0", () => {
    expect(finalScore(4.9, 0)).toBe(0);
  });
});

describe("passesQualityFilter", () => {
  it("tüm kriterler iyi ise geçer", () => {
    expect(
      passesQualityFilter({ inStock: true, rating: 4.2, contentScore: 0.6, excluded: false }),
    ).toBe(true);
  });
  it("stokta yoksa geçmez", () => {
    expect(
      passesQualityFilter({ inStock: false, rating: 4.9, contentScore: 0.9, excluded: false }),
    ).toBe(false);
  });
  it("içerik skoru 0 ise geçmez", () => {
    expect(
      passesQualityFilter({ inStock: true, rating: 4.9, contentScore: 0, excluded: false }),
    ).toBe(false);
  });
  it("düşük puanlı geçmez", () => {
    expect(
      passesQualityFilter({ inStock: true, rating: 3.0, contentScore: 0.9, excluded: false }),
    ).toBe(false);
  });
  it("avoidFor ile elenmişse geçmez", () => {
    expect(
      passesQualityFilter({ inStock: true, rating: 4.9, contentScore: 0.9, excluded: true }),
    ).toBe(false);
  });
});

describe("pickByTier", () => {
  const mk = (id: string, tier: string, final: number): ScoredProduct<{ id: string }> => ({
    product: { id },
    bayes: 4,
    content: final / 4,
    final,
    priceTier: tier,
  });

  it("her kademeden en iyiyi seçer", () => {
    const scored = [
      mk("u1", "ucuz", 2.0),
      mk("u2", "ucuz", 1.0),
      mk("o1", "orta", 3.0),
      mk("p1", "pahali", 2.5),
    ];
    const picked = pickByTier(scored, ["ucuz", "orta", "pahali"], 2, 3);
    const ids = picked.map((p) => p.product.id);
    expect(ids).toContain("o1");
    expect(ids).toContain("p1");
    expect(ids).toContain("u1"); // ucuz kademeden en iyi
    expect(ids).not.toContain("u2");
    expect(picked).toHaveLength(3);
  });

  it("tek kademe varsa yedek mantığıyla doldurur", () => {
    const scored = [
      mk("u1", "ucuz", 3.0),
      mk("u2", "ucuz", 2.5),
      mk("u3", "ucuz", 2.0),
    ];
    const picked = pickByTier(scored, ["ucuz", "orta", "pahali"], 2, 3);
    expect(picked.length).toBeGreaterThanOrEqual(2);
    // En yüksek skorlu başta.
    expect(picked[0].product.id).toBe("u1");
  });

  it("final skora göre azalan sırada döner", () => {
    const scored = [
      mk("u1", "ucuz", 1.0),
      mk("o1", "orta", 5.0),
      mk("p1", "pahali", 3.0),
    ];
    const picked = pickByTier(scored, ["ucuz", "orta", "pahali"], 2, 3);
    const finals = picked.map((p) => p.final);
    expect(finals).toEqual([...finals].sort((a, b) => b - a));
  });
});
