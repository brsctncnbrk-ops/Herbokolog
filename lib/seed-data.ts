import type { PrismaClient } from "@prisma/client";

type Tier = "ucuz" | "orta" | "pahali";

interface SeedProduct {
  name: string;
  brand: string;
  category: string;
  subNeeds: string[];
  activeIngredients: string[];
  avoidFor?: string[];
  priceTier: Tier;
  price: number;
  rating: number;
  reviewCount: number;
  inStock?: boolean;
}

function sellerLinks(price: number) {
  return JSON.stringify([
    { seller: "trendyol", url: "https://example.com/trendyol", price },
    { seller: "hepsiburada", url: "https://example.com/hepsiburada", price: Math.round(price * 1.03) },
  ]);
}

// Kurgusal ama inandırıcı isimler. Çeşitlilik: fiyat kademesi + yorum sayısı.
export const PRODUCTS: SeedProduct[] = [
  // ---------------- CİLT BAKIMI ----------------
  { name: "DermaPure Salisilik Asit Tonik", brand: "DermaPure", category: "cilt_bakimi", subNeeds: ["akne", "yagli_cilt"], activeIngredients: ["salisilik_asit", "niasinamid"], avoidFor: ["kuru_cilt"], priceTier: "ucuz", price: 119, rating: 4.3, reviewCount: 2400 },
  { name: "ClaraSkin Niasinamid %10 Serum", brand: "ClaraSkin", category: "cilt_bakimi", subNeeds: ["yagli_cilt", "gozenek"], activeIngredients: ["niasinamid", "cinko"], priceTier: "orta", price: 219, rating: 4.5, reviewCount: 3100 },
  { name: "PureGlow Retinol Gece Serumu", brand: "PureGlow", category: "cilt_bakimi", subNeeds: ["yaslanma_karsiti", "leke"], activeIngredients: ["retinol"], avoidFor: ["hassasiyet"], priceTier: "pahali", price: 540, rating: 4.7, reviewCount: 880 },
  { name: "HydraVeil Hyaluronik Nemlendirici", brand: "HydraVeil", category: "cilt_bakimi", subNeeds: ["kuru_cilt", "hassasiyet"], activeIngredients: ["hyaluronik_asit", "seramid"], priceTier: "orta", price: 199, rating: 4.6, reviewCount: 1750 },
  { name: "SkinHero Mucize Akne Jeli", brand: "SkinHero", category: "cilt_bakimi", subNeeds: ["akne"], activeIngredients: ["salisilik_asit", "cay_agaci_yagi"], priceTier: "ucuz", price: 89, rating: 5.0, reviewCount: 22 },
  { name: "LumiCare C Vitamini Serumu", brand: "LumiCare", category: "cilt_bakimi", subNeeds: ["leke", "matlik"], activeIngredients: ["c_vitamini", "niasinamid"], priceTier: "pahali", price: 460, rating: 4.4, reviewCount: 1320 },
  { name: "SoftDerm Seramid Bariyer Kremi", brand: "SoftDerm", category: "cilt_bakimi", subNeeds: ["kuru_cilt", "hassasiyet"], activeIngredients: ["seramid", "gliserin"], priceTier: "orta", price: 175, rating: 4.2, reviewCount: 640, inStock: false },

  // ---------------- SAÇ BAKIMI ----------------
  { name: "ScalpFresh Çinko Piriton Şampuanı", brand: "ScalpFresh", category: "sac_bakimi", subNeeds: ["kepek", "yagli_sac"], activeIngredients: ["cinko_pirition"], avoidFor: ["kuru_sac"], priceTier: "ucuz", price: 99, rating: 4.4, reviewCount: 2900 },
  { name: "ClearRoot Ketokonazol Şampuanı", brand: "ClearRoot", category: "sac_bakimi", subNeeds: ["kepek", "kasinti"], activeIngredients: ["ketokonazol", "cinko_pirition"], priceTier: "orta", price: 189, rating: 4.6, reviewCount: 1400 },
  { name: "PureScalp Salisilik Arındırıcı", brand: "PureScalp", category: "sac_bakimi", subNeeds: ["yagli_sac", "kepek"], activeIngredients: ["salisilik_asit"], priceTier: "orta", price: 159, rating: 4.5, reviewCount: 980 },
  { name: "VolumeLux Biotin Saç Serumu", brand: "VolumeLux", category: "sac_bakimi", subNeeds: ["dokulme", "incelme"], activeIngredients: ["biotin", "kafein"], priceTier: "pahali", price: 420, rating: 4.7, reviewCount: 760 },
  { name: "NatureLock Argan Onarıcı Maske", brand: "NatureLock", category: "sac_bakimi", subNeeds: ["kuru_sac", "yipranma"], activeIngredients: ["argan_yagi", "keratin"], avoidFor: ["yagli_sac"], priceTier: "ucuz", price: 79, rating: 4.1, reviewCount: 3300 },
  { name: "GlossPro Keratin Bakım Kremi", brand: "GlossPro", category: "sac_bakimi", subNeeds: ["yipranma"], activeIngredients: ["keratin", "argan_yagi"], priceTier: "pahali", price: 380, rating: 4.9, reviewCount: 30 },
  { name: "CalmScalp Kafeinli Dökülme Serumu", brand: "CalmScalp", category: "sac_bakimi", subNeeds: ["dokulme", "incelme"], activeIngredients: ["kafein", "biotin"], priceTier: "orta", price: 199, rating: 4.4, reviewCount: 1150 },

  // ---------------- AĞIZ BAKIMI ----------------
  { name: "DentaShield Florür Diş Macunu", brand: "DentaShield", category: "agiz_bakimi", subNeeds: ["curuk_korumasi"], activeIngredients: ["florur"], priceTier: "ucuz", price: 49, rating: 4.5, reviewCount: 4200 },
  { name: "GumCare Hassasiyet Karşıtı Macun", brand: "GumCare", category: "agiz_bakimi", subNeeds: ["dis_eti_hassasiyeti", "hassas_dis"], activeIngredients: ["potasyum_nitrat", "florur"], priceTier: "orta", price: 99, rating: 4.6, reviewCount: 1600 },
  { name: "FreshMint Çinko Ağız Gargarası", brand: "FreshMint", category: "agiz_bakimi", subNeeds: ["agiz_kokusu"], activeIngredients: ["cinko", "mentol"], priceTier: "ucuz", price: 65, rating: 4.2, reviewCount: 2100 },
  { name: "WhitePearl Beyazlatıcı Macun", brand: "WhitePearl", category: "agiz_bakimi", subNeeds: ["leke", "beyazlatma"], activeIngredients: ["hidrojen_peroksit", "florur"], avoidFor: ["dis_eti_hassasiyeti"], priceTier: "pahali", price: 240, rating: 4.3, reviewCount: 540 },
  { name: "BioGum Diş Eti Bakım Jeli", brand: "BioGum", category: "agiz_bakimi", subNeeds: ["dis_eti_hassasiyeti"], activeIngredients: ["klorheksidin"], priceTier: "orta", price: 130, rating: 4.7, reviewCount: 410 },
  { name: "KidsSmile Çocuk Florür Macunu", brand: "KidsSmile", category: "agiz_bakimi", subNeeds: ["curuk_korumasi"], activeIngredients: ["florur"], priceTier: "ucuz", price: 55, rating: 4.8, reviewCount: 25 },
  { name: "PureBreath Probiyotik Gargara", brand: "PureBreath", category: "agiz_bakimi", subNeeds: ["agiz_kokusu"], activeIngredients: ["cinko", "probiyotik"], priceTier: "pahali", price: 195, rating: 4.6, reviewCount: 380 },

  // ---------------- VÜCUT BAKIMI ----------------
  { name: "BodySilk Seramid Vücut Losyonu", brand: "BodySilk", category: "vucut_bakimi", subNeeds: ["kuru_cilt"], activeIngredients: ["seramid", "gliserin"], priceTier: "orta", price: 145, rating: 4.5, reviewCount: 1900 },
  { name: "SheaGlow Yoğun Nemlendirici Krem", brand: "SheaGlow", category: "vucut_bakimi", subNeeds: ["kuru_cilt", "catlak"], activeIngredients: ["shea_yagi", "gliserin"], priceTier: "ucuz", price: 89, rating: 4.3, reviewCount: 2600 },
  { name: "FirmContour Selülit Karşıtı Jel", brand: "FirmContour", category: "vucut_bakimi", subNeeds: ["selulit"], activeIngredients: ["kafein", "karnitin"], priceTier: "pahali", price: 320, rating: 4.1, reviewCount: 470 },
  { name: "PureBody Üre %10 Vücut Kremi", brand: "PureBody", category: "vucut_bakimi", subNeeds: ["asiri_kuruluk"], activeIngredients: ["uree", "laktik_asit"], priceTier: "orta", price: 165, rating: 4.6, reviewCount: 820 },
  { name: "SoftTouch Hindistan Cevizi Yağı", brand: "SoftTouch", category: "vucut_bakimi", subNeeds: ["kuru_cilt"], activeIngredients: ["hindistan_cevizi_yagi"], priceTier: "ucuz", price: 69, rating: 4.0, reviewCount: 3500 },
  { name: "LuxeBalm Onarıcı Vücut Balmı", brand: "LuxeBalm", category: "vucut_bakimi", subNeeds: ["catlak", "asiri_kuruluk"], activeIngredients: ["shea_yagi", "seramid", "pantenol"], priceTier: "pahali", price: 290, rating: 4.9, reviewCount: 18, inStock: false },

  // ---------------- GÜNEŞ KORUMA ----------------
  { name: "SunGuard SPF50 Mineral Krem", brand: "SunGuard", category: "gunes_koruma", subNeeds: ["uv_korumasi", "hassasiyet"], activeIngredients: ["cinko_oksit", "titanyum_dioksit"], priceTier: "orta", price: 210, rating: 4.6, reviewCount: 2200 },
  { name: "SolarLite SPF30 Günlük Fluid", brand: "SolarLite", category: "gunes_koruma", subNeeds: ["uv_korumasi", "yagli_cilt"], activeIngredients: ["avobenzon", "niasinamid"], priceTier: "ucuz", price: 119, rating: 4.4, reviewCount: 1800 },
  { name: "BeachPro SPF50+ Sprey", brand: "BeachPro", category: "gunes_koruma", subNeeds: ["uv_korumasi", "su_direnci"], activeIngredients: ["oktokrilen", "avobenzon"], priceTier: "orta", price: 175, rating: 4.2, reviewCount: 950 },
  { name: "DermaSun Çocuk SPF50 Mineral", brand: "DermaSun", category: "gunes_koruma", subNeeds: ["uv_korumasi", "hassasiyet"], activeIngredients: ["cinko_oksit"], priceTier: "pahali", price: 280, rating: 4.8, reviewCount: 640 },
  { name: "GlowShield Renkli SPF40 Krem", brand: "GlowShield", category: "gunes_koruma", subNeeds: ["uv_korumasi", "leke"], activeIngredients: ["titanyum_dioksit", "c_vitamini"], priceTier: "pahali", price: 340, rating: 4.5, reviewCount: 28 },
  { name: "AquaSun SPF30 Jel Krem", brand: "AquaSun", category: "gunes_koruma", subNeeds: ["uv_korumasi", "yagli_cilt"], activeIngredients: ["avobenzon"], priceTier: "ucuz", price: 99, rating: 4.0, reviewCount: 2750 },

  // ---------------- TIRAŞ / EPİLASYON ----------------
  { name: "SmoothShave Aloe Tıraş Jeli", brand: "SmoothShave", category: "tiras_epilasyon", subNeeds: ["tiras_tahrisi"], activeIngredients: ["aloe_vera", "gliserin"], priceTier: "ucuz", price: 75, rating: 4.3, reviewCount: 1500 },
  { name: "IngrowFix Batık Önleyici Tonik", brand: "IngrowFix", category: "tiras_epilasyon", subNeeds: ["batik", "kil_donmesi"], activeIngredients: ["salisilik_asit", "glikolik_asit"], priceTier: "orta", price: 149, rating: 4.6, reviewCount: 720 },
  { name: "SilkEpil Sonrası Yatıştırıcı Jel", brand: "SilkEpil", category: "tiras_epilasyon", subNeeds: ["tiras_tahrisi", "kizariklik"], activeIngredients: ["pantenol", "aloe_vera"], priceTier: "orta", price: 130, rating: 4.5, reviewCount: 540 },
  { name: "CleanShave Köpük Tıraş Kremi", brand: "CleanShave", category: "tiras_epilasyon", subNeeds: ["tiras_tahrisi"], activeIngredients: ["gliserin", "shea_yagi"], priceTier: "ucuz", price: 59, rating: 4.1, reviewCount: 2300 },
  { name: "DermaWax Hassas Ağda Şeridi", brand: "DermaWax", category: "tiras_epilasyon", subNeeds: ["hassasiyet"], activeIngredients: ["azulen", "aloe_vera"], priceTier: "orta", price: 110, rating: 4.2, reviewCount: 410 },
  { name: "BarberLux Tıraş Sonrası Balm", brand: "BarberLux", category: "tiras_epilasyon", subNeeds: ["tiras_tahrisi", "kuru_cilt"], activeIngredients: ["pantenol", "seramid"], priceTier: "pahali", price: 230, rating: 4.9, reviewCount: 26 },

  // ---------------- DEODORANT / PARFÜM ----------------
  { name: "FreshDay Antiperspirant Roll-on", brand: "FreshDay", category: "deodorant_parfum", subNeeds: ["asiri_terleme", "koku_kontrolu"], activeIngredients: ["aluminyum_klorohidrat"], priceTier: "ucuz", price: 69, rating: 4.4, reviewCount: 3100 },
  { name: "PureCalm Alüminyumsuz Deodorant", brand: "PureCalm", category: "deodorant_parfum", subNeeds: ["koku_kontrolu", "hassasiyet"], activeIngredients: ["sodyum_bikarbonat", "cinko_ricinoleat"], priceTier: "orta", price: 129, rating: 4.5, reviewCount: 980 },
  { name: "DriShield Güçlü Antiperspirant", brand: "DriShield", category: "deodorant_parfum", subNeeds: ["asiri_terleme"], activeIngredients: ["aluminyum_klorit"], priceTier: "orta", price: 159, rating: 4.6, reviewCount: 610 },
  { name: "AromaLux Uzun Etkili Parfüm", brand: "AromaLux", category: "deodorant_parfum", subNeeds: ["koku_kontrolu"], activeIngredients: ["parfum_kompozisyonu"], priceTier: "pahali", price: 450, rating: 4.7, reviewCount: 340 },
  { name: "CottonFresh Stick Deodorant", brand: "CottonFresh", category: "deodorant_parfum", subNeeds: ["koku_kontrolu"], activeIngredients: ["aluminyum_klorohidrat"], priceTier: "ucuz", price: 55, rating: 4.0, reviewCount: 2500 },
  { name: "BotanicMist Doğal Deodorant Sprey", brand: "BotanicMist", category: "deodorant_parfum", subNeeds: ["hassasiyet", "koku_kontrolu"], activeIngredients: ["adaçayı_özü", "cinko_ricinoleat"], priceTier: "pahali", price: 210, rating: 4.8, reviewCount: 20 },

  // ---------------- EL-AYAK-TIRNAK ----------------
  { name: "NailStrong Biotin Tırnak Serumu", brand: "NailStrong", category: "el_ayak_tirnak", subNeeds: ["tirnak_guclendirme"], activeIngredients: ["biotin", "keratin"], priceTier: "orta", price: 140, rating: 4.5, reviewCount: 870 },
  { name: "HeelCare Üre %25 Topuk Kremi", brand: "HeelCare", category: "el_ayak_tirnak", subNeeds: ["nasir", "asiri_kuruluk"], activeIngredients: ["uree", "laktik_asit"], priceTier: "ucuz", price: 79, rating: 4.6, reviewCount: 2400 },
  { name: "HandSilk Onarıcı El Kremi", brand: "HandSilk", category: "el_ayak_tirnak", subNeeds: ["kuru_cilt", "catlak"], activeIngredients: ["seramid", "gliserin", "pantenol"], priceTier: "ucuz", price: 65, rating: 4.4, reviewCount: 3000 },
  { name: "FungiGuard Tırnak Bakım Solüsyonu", brand: "FungiGuard", category: "el_ayak_tirnak", subNeeds: ["tirnak_saglik"], activeIngredients: ["cay_agaci_yagi", "uree"], priceTier: "orta", price: 175, rating: 4.2, reviewCount: 460 },
  { name: "LuxeHand Şi Yağlı Lüks El Kremi", brand: "LuxeHand", category: "el_ayak_tirnak", subNeeds: ["kuru_cilt"], activeIngredients: ["shea_yagi", "argan_yagi"], priceTier: "pahali", price: 220, rating: 4.9, reviewCount: 24 },
  { name: "SoftFeet Yatıştırıcı Ayak Balmı", brand: "SoftFeet", category: "el_ayak_tirnak", subNeeds: ["nasir", "kuru_cilt"], activeIngredients: ["uree", "shea_yagi"], priceTier: "orta", price: 120, rating: 4.3, reviewCount: 690 },
];

interface MapRow {
  category: string;
  subNeed: string;
  ingredient: string;
  matchScore: number;
}

// IngredientMap: kategori başına >=5 satır.
export const INGREDIENT_MAP: MapRow[] = [
  // cilt_bakimi
  { category: "cilt_bakimi", subNeed: "akne", ingredient: "salisilik_asit", matchScore: 0.9 },
  { category: "cilt_bakimi", subNeed: "akne", ingredient: "cay_agaci_yagi", matchScore: 0.7 },
  { category: "cilt_bakimi", subNeed: "yagli_cilt", ingredient: "niasinamid", matchScore: 0.85 },
  { category: "cilt_bakimi", subNeed: "yagli_cilt", ingredient: "cinko", matchScore: 0.7 },
  { category: "cilt_bakimi", subNeed: "kuru_cilt", ingredient: "hyaluronik_asit", matchScore: 0.9 },
  { category: "cilt_bakimi", subNeed: "kuru_cilt", ingredient: "seramid", matchScore: 0.88 },
  { category: "cilt_bakimi", subNeed: "hassasiyet", ingredient: "seramid", matchScore: 0.8 },
  { category: "cilt_bakimi", subNeed: "leke", ingredient: "c_vitamini", matchScore: 0.85 },
  { category: "cilt_bakimi", subNeed: "leke", ingredient: "niasinamid", matchScore: 0.75 },
  { category: "cilt_bakimi", subNeed: "yaslanma_karsiti", ingredient: "retinol", matchScore: 0.9 },
  { category: "cilt_bakimi", subNeed: "gozenek", ingredient: "niasinamid", matchScore: 0.8 },

  // sac_bakimi
  { category: "sac_bakimi", subNeed: "kepek", ingredient: "cinko_pirition", matchScore: 0.9 },
  { category: "sac_bakimi", subNeed: "kepek", ingredient: "ketokonazol", matchScore: 0.88 },
  { category: "sac_bakimi", subNeed: "kepek", ingredient: "salisilik_asit", matchScore: 0.75 },
  { category: "sac_bakimi", subNeed: "yagli_sac", ingredient: "salisilik_asit", matchScore: 0.8 },
  { category: "sac_bakimi", subNeed: "yagli_sac", ingredient: "cinko_pirition", matchScore: 0.7 },
  { category: "sac_bakimi", subNeed: "dokulme", ingredient: "biotin", matchScore: 0.8 },
  { category: "sac_bakimi", subNeed: "dokulme", ingredient: "kafein", matchScore: 0.75 },
  { category: "sac_bakimi", subNeed: "kuru_sac", ingredient: "argan_yagi", matchScore: 0.85 },
  { category: "sac_bakimi", subNeed: "yipranma", ingredient: "keratin", matchScore: 0.85 },

  // agiz_bakimi
  { category: "agiz_bakimi", subNeed: "curuk_korumasi", ingredient: "florur", matchScore: 0.95 },
  { category: "agiz_bakimi", subNeed: "dis_eti_hassasiyeti", ingredient: "potasyum_nitrat", matchScore: 0.9 },
  { category: "agiz_bakimi", subNeed: "hassas_dis", ingredient: "potasyum_nitrat", matchScore: 0.9 },
  { category: "agiz_bakimi", subNeed: "agiz_kokusu", ingredient: "cinko", matchScore: 0.8 },
  { category: "agiz_bakimi", subNeed: "beyazlatma", ingredient: "hidrojen_peroksit", matchScore: 0.85 },
  { category: "agiz_bakimi", subNeed: "dis_eti_hassasiyeti", ingredient: "klorheksidin", matchScore: 0.8 },

  // vucut_bakimi
  { category: "vucut_bakimi", subNeed: "kuru_cilt", ingredient: "seramid", matchScore: 0.88 },
  { category: "vucut_bakimi", subNeed: "kuru_cilt", ingredient: "shea_yagi", matchScore: 0.82 },
  { category: "vucut_bakimi", subNeed: "asiri_kuruluk", ingredient: "uree", matchScore: 0.9 },
  { category: "vucut_bakimi", subNeed: "catlak", ingredient: "shea_yagi", matchScore: 0.8 },
  { category: "vucut_bakimi", subNeed: "selulit", ingredient: "kafein", matchScore: 0.75 },

  // gunes_koruma
  { category: "gunes_koruma", subNeed: "uv_korumasi", ingredient: "cinko_oksit", matchScore: 0.92 },
  { category: "gunes_koruma", subNeed: "uv_korumasi", ingredient: "titanyum_dioksit", matchScore: 0.9 },
  { category: "gunes_koruma", subNeed: "uv_korumasi", ingredient: "avobenzon", matchScore: 0.85 },
  { category: "gunes_koruma", subNeed: "hassasiyet", ingredient: "cinko_oksit", matchScore: 0.88 },
  { category: "gunes_koruma", subNeed: "su_direnci", ingredient: "oktokrilen", matchScore: 0.8 },

  // tiras_epilasyon
  { category: "tiras_epilasyon", subNeed: "tiras_tahrisi", ingredient: "aloe_vera", matchScore: 0.85 },
  { category: "tiras_epilasyon", subNeed: "tiras_tahrisi", ingredient: "pantenol", matchScore: 0.82 },
  { category: "tiras_epilasyon", subNeed: "batik", ingredient: "salisilik_asit", matchScore: 0.88 },
  { category: "tiras_epilasyon", subNeed: "kil_donmesi", ingredient: "glikolik_asit", matchScore: 0.85 },
  { category: "tiras_epilasyon", subNeed: "kizariklik", ingredient: "pantenol", matchScore: 0.8 },

  // deodorant_parfum
  { category: "deodorant_parfum", subNeed: "asiri_terleme", ingredient: "aluminyum_klorohidrat", matchScore: 0.9 },
  { category: "deodorant_parfum", subNeed: "asiri_terleme", ingredient: "aluminyum_klorit", matchScore: 0.92 },
  { category: "deodorant_parfum", subNeed: "koku_kontrolu", ingredient: "cinko_ricinoleat", matchScore: 0.82 },
  { category: "deodorant_parfum", subNeed: "hassasiyet", ingredient: "cinko_ricinoleat", matchScore: 0.8 },
  { category: "deodorant_parfum", subNeed: "koku_kontrolu", ingredient: "sodyum_bikarbonat", matchScore: 0.75 },

  // el_ayak_tirnak
  { category: "el_ayak_tirnak", subNeed: "tirnak_guclendirme", ingredient: "biotin", matchScore: 0.88 },
  { category: "el_ayak_tirnak", subNeed: "tirnak_guclendirme", ingredient: "keratin", matchScore: 0.8 },
  { category: "el_ayak_tirnak", subNeed: "nasir", ingredient: "uree", matchScore: 0.9 },
  { category: "el_ayak_tirnak", subNeed: "kuru_cilt", ingredient: "seramid", matchScore: 0.85 },
  { category: "el_ayak_tirnak", subNeed: "catlak", ingredient: "shea_yagi", matchScore: 0.8 },
];

export interface SeedResult {
  products: number;
  ingredientMaps: number;
  sponsorships: number;
}

// Veritabanını sıfırlayıp örnek demo verisiyle doldurur (idempotent).
export async function seedDatabase(prisma: PrismaClient): Promise<SeedResult> {
  await prisma.sponsorship.deleteMany();
  await prisma.ingredientMap.deleteMany();
  await prisma.product.deleteMany();

  const created: { id: string; name: string }[] = [];
  for (const p of PRODUCTS) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        brand: p.brand,
        category: p.category,
        subNeeds: JSON.stringify(p.subNeeds),
        activeIngredients: JSON.stringify(p.activeIngredients),
        avoidFor: JSON.stringify(p.avoidFor ?? []),
        priceTier: p.priceTier,
        price: p.price,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.inStock ?? true,
        imageUrl: null,
        sellerLinks: sellerLinks(p.price),
      },
    });
    created.push({ id: prod.id, name: prod.name });
  }

  await prisma.ingredientMap.createMany({ data: INGREDIENT_MAP });

  const sacProduct = created.find((c) => c.name === "ClearRoot Ketokonazol Şampuanı");
  const ciltProduct = created.find((c) => c.name === "ClaraSkin Niasinamid %10 Serum");
  const now = new Date();
  let sponsorships = 0;
  if (sacProduct) {
    await prisma.sponsorship.create({
      data: {
        productId: sacProduct.id,
        category: "sac_bakimi",
        subNeed: "kepek",
        startDate: new Date(now.getTime() - 7 * 86400000),
        endDate: new Date(now.getTime() + 30 * 86400000), // AKTİF
        adLabel: "Reklam",
      },
    });
    sponsorships++;
  }
  if (ciltProduct) {
    await prisma.sponsorship.create({
      data: {
        productId: ciltProduct.id,
        category: "cilt_bakimi",
        subNeed: null,
        startDate: new Date(now.getTime() - 60 * 86400000),
        endDate: new Date(now.getTime() - 30 * 86400000), // SÜRESİ GEÇMİŞ
        adLabel: "Reklam",
      },
    });
    sponsorships++;
  }

  return {
    products: created.length,
    ingredientMaps: INGREDIENT_MAP.length,
    sponsorships,
  };
}
