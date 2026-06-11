import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { CATEGORIES, CLAUDE_TIMEOUT_MS, MODEL_DISCOVER, type Category } from "../config";
import type { DiscoveredProduct } from "../affiliates/types";

const discoveredSchema = z.object({
  urunler: z
    .array(
      z.object({
        name: z.string(),
        brand: z.string(),
        subNeeds: z.array(z.string()).default([]),
        activeIngredients: z.array(z.string()).default([]),
        avoidFor: z.array(z.string()).default([]),
        priceTier: z.enum(["ucuz", "orta", "pahali"]),
        price: z.number(),
      }),
    )
    .default([]),
});

function stripFence(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  const f = s.indexOf("{");
  const l = s.lastIndexOf("}");
  if (f !== -1 && l !== -1) s = s.slice(f, l + 1);
  return s.trim();
}

// Mock keşif: API anahtarı yoksa deterministik aday üretir.
function mockDiscover(category: Category): DiscoveredProduct[] {
  const tiers: DiscoveredProduct["priceTier"][] = ["ucuz", "orta", "pahali"];
  return tiers.map((tier, i) => ({
    name: `Yeni ${category} Ürünü ${Date.now() % 1000}-${i}`,
    brand: "KeşifLab",
    category,
    subNeeds: ["genel"],
    activeIngredients: ["niasinamid"],
    avoidFor: [],
    priceTier: tier,
    price: 50 + i * 60,
  }));
}

/**
 * Bir kategori için yeni ürün adayları üretir.
 * API anahtarı yoksa mock döner.
 */
export async function discoverForCategory(category: Category): Promise<DiscoveredProduct[]> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return mockDiscover(category);
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: CLAUDE_TIMEOUT_MS,
  });

  const system = `Sen bir kişisel bakım ürün kataloğu üreticisisin. Verilen kategori için 3 KURGUSAL ama inandırıcı ürün üret. Gerçek marka/ürün ismi KULLANMA. Yalnızca geçerli JSON döndür.

Kategori enum: ${CATEGORIES.join(", ")}

Çıktı formatı:
{"urunler":[{"name":"...","brand":"...","subNeeds":["..."],"activeIngredients":["..."],"avoidFor":[],"priceTier":"ucuz|orta|pahali","price":120}]}`;

  const res = await client.messages.create({
    model: MODEL_DISCOVER,
    max_tokens: 1500,
    system,
    messages: [
      {
        role: "user",
        content: `Kategori: ${category}. 3 kurgusal ürün üret (ucuz, orta, pahali birer tane). Yalnızca JSON.`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return [];

  const parsed = discoveredSchema.parse(JSON.parse(stripFence(block.text)));
  return parsed.urunler.map((u) => ({ ...u, category }));
}
