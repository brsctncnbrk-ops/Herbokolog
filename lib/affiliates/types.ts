// Affiliate sağlayıcı arayüzü. Mock'lar bunu uygular; gerçek API'ye geçişte
// aynı arayüz korunur, yalnızca implementasyon değişir.

export interface AffiliateProductUpdate {
  price?: number;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  sellerPrice?: number;
}

export interface AffiliateAdapter {
  readonly name: string;
  /**
   * Ürün adı/markasına göre güncel fiyat/puan/yorum/stok döndürür.
   * Mock implementasyon mevcut değerlere küçük varyasyon uygular.
   */
  fetchUpdate(input: {
    name: string;
    brand: string;
    currentPrice: number;
    currentRating: number;
    currentReviewCount: number;
  }): Promise<AffiliateProductUpdate>;
}

// Yeni ürün keşfi için aday ürün şekli.
export interface DiscoveredProduct {
  name: string;
  brand: string;
  category: string;
  subNeeds: string[];
  activeIngredients: string[];
  avoidFor: string[];
  priceTier: "ucuz" | "orta" | "pahali";
  price: number;
}
