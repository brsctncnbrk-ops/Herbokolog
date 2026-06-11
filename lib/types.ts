import { z } from "zod";
import { CATEGORIES } from "./config";

// AI analiz çıktısı şeması. Öneri/sponsorluk mantığı ASLA burada değil.
export const analysisSchema = z.object({
  kategori: z.enum(CATEGORIES),
  alt_ihtiyaclar: z.array(z.string()).default([]),
  onerilen_etken_maddeler: z.array(z.string()).default([]),
  kacinilmasi_gerekenler: z.array(z.string()).default([]),
  guven_notu: z.string().default(""),
  kategori_disi: z.boolean().default(false),
  // Eklendi: tıbbi durum sinyali (egzama, sedef, açık yara, enfeksiyon şüphesi).
  tibbi_uyari: z.boolean().default(false),
  tibbi_aciklama: z.string().default(""),
});

export type Analysis = z.infer<typeof analysisSchema>;

export interface SellerLink {
  seller: string;
  url: string;
  price: number;
}

// Öneri yanıtındaki tek ürün kartı.
export interface RecommendationCard {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceTier: string;
  priceTierLabel: string;
  price: number;
  rating: number;
  reviewCount: number;
  matchedIngredients: string[];
  sellerLinks: SellerLink[];
  imageUrl: string | null;
  isSponsored: boolean;
  adLabel?: string;
  approximateMatch?: boolean; // tam etken madde eşleşmesi yoksa true
}

// /api/analyze yanıt tipi.
export interface AnalyzeResponse {
  analysis: Analysis | null;
  outOfScope: boolean;
  medical: boolean;
  message: string | null;
  source: "ai" | "fallback";
}

// /api/recommend yanıt tipi.
export interface RecommendResponse {
  cards: RecommendationCard[];
  guvenNotu: string;
  hasSponsored: boolean;
  message: string | null;
}
