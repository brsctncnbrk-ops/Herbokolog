import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { discoverForCategory } from "@/lib/ai/discover";
import { CATEGORIES, type Category } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Haftalık: Claude (opus) ile kategori başına yeni ürün adayları üretir,
// duplicate (name+brand) kontrolü yapar, reviewCount:0 ile ekler.
async function handle(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const existing = await prisma.product.findMany({ select: { name: true, brand: true } });
  const seen = new Set(existing.map((p) => `${p.name.toLowerCase()}|${p.brand.toLowerCase()}`));

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  // URL parametresiyle tek kategori test edilebilir.
  const url = new URL(req.url);
  const only = url.searchParams.get("category") as Category | null;
  const categories: Category[] = only && CATEGORIES.includes(only) ? [only] : [...CATEGORIES];

  for (const category of categories) {
    try {
      const candidates = await discoverForCategory(category);
      for (const c of candidates) {
        const key = `${c.name.toLowerCase()}|${c.brand.toLowerCase()}`;
        if (seen.has(key)) {
          skipped += 1;
          continue;
        }
        seen.add(key);
        await prisma.product.create({
          data: {
            name: c.name,
            brand: c.brand,
            category: c.category,
            subNeeds: JSON.stringify(c.subNeeds),
            activeIngredients: JSON.stringify(c.activeIngredients),
            avoidFor: JSON.stringify(c.avoidFor),
            priceTier: c.priceTier,
            price: c.price,
            rating: 4.0,
            reviewCount: 0, // Bayes sayesinde doğal olarak düşük sıralanır
            inStock: true,
            sellerLinks: JSON.stringify([
              { seller: "trendyol", url: "#", price: c.price },
            ]),
          },
        });
        added += 1;
      }
    } catch (err) {
      errors.push(`${category}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    job: "discover-products",
    added,
    skipped,
    errors,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
