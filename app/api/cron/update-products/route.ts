import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { trendyolAdapter } from "@/lib/affiliates/trendyol";
import { parseSellerLinks } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Haftalık: affiliate API'lerinden fiyat/puan/yorum/stok günceller.
async function handle(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const products = await prisma.product.findMany();
  let updated = 0;
  let wentOutOfStock = 0;

  for (const p of products) {
    const upd = await trendyolAdapter.fetchUpdate({
      name: p.name,
      brand: p.brand,
      currentPrice: p.price,
      currentRating: p.rating,
      currentReviewCount: p.reviewCount,
    });

    // Satıcı linklerindeki fiyatı da güncelle.
    const sellers = parseSellerLinks(p.sellerLinks).map((s) =>
      s.seller === trendyolAdapter.name && upd.sellerPrice
        ? { ...s, price: upd.sellerPrice }
        : s,
    );

    if (upd.inStock === false && p.inStock) wentOutOfStock += 1;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        price: upd.price ?? p.price,
        rating: upd.rating ?? p.rating,
        reviewCount: upd.reviewCount ?? p.reviewCount,
        inStock: upd.inStock ?? p.inStock,
        sellerLinks: JSON.stringify(sellers),
      },
    });
    updated += 1;
  }

  return NextResponse.json({
    ok: true,
    job: "update-products",
    updated,
    wentOutOfStock,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
