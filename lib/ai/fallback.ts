// Deterministik anahtar-kelime tabanlı yedek analizci.
// ANTHROPIC_API_KEY yokken veya AI çağrısı başarısız olduğunda devreye girer.
// Böylece demo, API anahtarı olmadan da çalışır.

import type { Analysis } from "../types";
import type { Category } from "../config";

interface Rule {
  category: Category;
  // metinde bu kelimelerden biri geçerse eşleşir
  triggers: string[];
  subNeeds: string[];
  ingredients: string[];
  avoid?: string[];
  guven?: string;
}

// Tıbbi sinyal kelimeleri -> ürün önerme, doktora yönlendir.
const MEDICAL_TRIGGERS = [
  "egzama",
  "sedef",
  "açık yara",
  "acik yara",
  "enfeksiyon",
  "iltihap",
  "mantar enfeksiyon",
  "yara kanıyor",
  "kanayan",
  "ciddi alerji",
  "şişme",
  "siğil",
];

// Kişisel bakım dışı sinyaller.
const OUT_OF_SCOPE_TRIGGERS = [
  "araba",
  "lastik",
  "telefon",
  "bilgisayar",
  "yemek tarifi",
  "borsa",
  "hava durumu",
  "futbol",
];

const RULES: Rule[] = [
  {
    category: "sac_bakimi",
    triggers: ["kepek", "saç", "sac", "yağlanıyor", "yaglaniyor", "dökül", "dokul", "kıvırcık"],
    subNeeds: ["kepek", "yagli_sac"],
    ingredients: ["cinko_pirition", "salisilik_asit", "ketokonazol"],
    avoid: ["agir_yaglar"],
    guven: "Kepek kalıcıysa bir dermatoloğa danışmanız uygun olabilir.",
  },
  {
    category: "cilt_bakimi",
    triggers: ["sivilce", "akne", "yağlı cilt", "yagli cilt", "gözenek", "gozenek", "siyah nokta", "leke", "kırışık", "kirisik", "yaşlanma"],
    subNeeds: ["akne", "yagli_cilt"],
    ingredients: ["salisilik_asit", "niasinamid", "retinol"],
    avoid: ["komedojenik_yaglar"],
    guven: "Şikâyetler sürerse bir cilt uzmanına danışmanız uygun olabilir.",
  },
  {
    category: "cilt_bakimi",
    triggers: ["kuru cilt", "kuruluk", "nemlendir", "tahriş", "tahris", "hassas cilt"],
    subNeeds: ["kuru_cilt", "hassasiyet"],
    ingredients: ["hyaluronik_asit", "seramid", "gliserin"],
    guven: "Cildiniz aşırı hassassa bir uzmana danışabilirsiniz.",
  },
  {
    category: "agiz_bakimi",
    triggers: ["diş", "dis", "diş eti", "dis eti", "çürük", "curuk", "ağız kokusu", "agiz kokusu", "hassas diş"],
    subNeeds: ["curuk_korumasi", "dis_eti_hassasiyeti"],
    ingredients: ["florur", "potasyum_nitrat"],
    guven: "Diş eti kanaması sürerse bir diş hekimine başvurmanız uygun olabilir.",
  },
  {
    category: "gunes_koruma",
    triggers: ["güneş", "gunes", "spf", "uv", "güneş kremi", "yanık"],
    subNeeds: ["uv_korumasi"],
    ingredients: ["cinko_oksit", "titanyum_dioksit"],
    guven: "Uzun süre güneşte kalacaksanız korumayı düzenli yenileyin.",
  },
  {
    category: "deodorant_parfum",
    triggers: ["ter", "koku", "deodorant", "terleme", "parfüm", "parfum"],
    subNeeds: ["asiri_terleme", "koku_kontrolu"],
    ingredients: ["aluminyum_klorohidrat"],
    guven: "Aşırı terleme sürerse bir uzmana danışabilirsiniz.",
  },
  {
    category: "tiras_epilasyon",
    triggers: ["tıraş", "tiras", "epilasyon", "ağda", "agda", "batık", "batik", "kıl dönmesi"],
    subNeeds: ["tiras_tahrisi"],
    ingredients: ["aloe_vera", "salisilik_asit"],
    guven: "Tahriş sürerse tıraş rutininizi gözden geçirin.",
  },
  {
    category: "vucut_bakimi",
    triggers: ["vücut", "vucut", "el kremi", "çatlak", "catlak", "selülit", "vücut losyonu"],
    subNeeds: ["kuru_cilt"],
    ingredients: ["seramid", "shea_yagi", "gliserin"],
    guven: "Cilt çatlakları kalıcıysa bir uzmana danışabilirsiniz.",
  },
  {
    category: "el_ayak_tirnak",
    triggers: ["tırnak", "tirnak", "topuk", "nasır", "nasir", "el çatlağı", "ayak kuruluğu"],
    subNeeds: ["tirnak_guclendirme", "kuru_cilt"],
    ingredients: ["biotin", "uree"],
    guven: "Tırnak renk değişimi sürerse bir uzmana danışabilirsiniz.",
  },
];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

export function fallbackAnalyze(text: string): Analysis {
  const t = text.toLocaleLowerCase("tr");

  if (includesAny(t, MEDICAL_TRIGGERS)) {
    return {
      kategori: "cilt_bakimi",
      alt_ihtiyaclar: [],
      onerilen_etken_maddeler: [],
      kacinilmasi_gerekenler: [],
      guven_notu: "",
      kategori_disi: false,
      tibbi_uyari: true,
      tibbi_aciklama:
        "Belirttiğiniz durum tıbbi bir değerlendirme gerektirebilir. Lütfen bir hekime başvurun.",
    };
  }

  if (includesAny(t, OUT_OF_SCOPE_TRIGGERS)) {
    return {
      kategori: "cilt_bakimi",
      alt_ihtiyaclar: [],
      onerilen_etken_maddeler: [],
      kacinilmasi_gerekenler: [],
      guven_notu: "",
      kategori_disi: true,
      tibbi_uyari: false,
      tibbi_aciklama: "",
    };
  }

  for (const rule of RULES) {
    if (includesAny(t, rule.triggers)) {
      return {
        kategori: rule.category,
        alt_ihtiyaclar: rule.subNeeds,
        onerilen_etken_maddeler: rule.ingredients,
        kacinilmasi_gerekenler: rule.avoid ?? [],
        guven_notu: rule.guven ?? "",
        kategori_disi: false,
        tibbi_uyari: false,
        tibbi_aciklama: "",
      };
    }
  }

  // Hiçbir kural eşleşmedi: genel cilt bakımı, düşük güven.
  return {
    kategori: "cilt_bakimi",
    alt_ihtiyaclar: [],
    onerilen_etken_maddeler: ["niasinamid", "hyaluronik_asit"],
    kacinilmasi_gerekenler: [],
    guven_notu: "İhtiyacını biraz daha detaylandırırsan daha isabetli öneriler sunabiliriz.",
    kategori_disi: false,
    tibbi_uyari: false,
    tibbi_aciklama: "",
  };
}
