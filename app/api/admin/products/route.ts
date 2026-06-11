import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-guard";
import { CATEGORIES } from "@/lib/config";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.enum(CATEGORIES),
  subNeeds: z.array(z.string()).default([]),
  activeIngredients: z.array(z.string()).default([]),
  avoidFor: z.array(z.string()).default([]),
  priceTier: z.enum(["ucuz", "orta", "pahali"]),
  price: z.number().positive(),
  rating: z.number().min(0).max(5).default(4.0),
  reviewCount: z.number().int().min(0).default(0),
  inStock: z.boolean().default(true),
});

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  let data;
  try {
    data = createSchema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : "Geçersiz veri.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      brand: data.brand,
      category: data.category,
      subNeeds: JSON.stringify(data.subNeeds),
      activeIngredients: JSON.stringify(data.activeIngredients),
      avoidFor: JSON.stringify(data.avoidFor),
      priceTier: data.priceTier,
      price: data.price,
      rating: data.rating,
      reviewCount: data.reviewCount,
      inStock: data.inStock,
      sellerLinks: JSON.stringify([
        { seller: "trendyol", url: "#", price: data.price },
      ]),
    },
  });
  return NextResponse.json({ product });
}
