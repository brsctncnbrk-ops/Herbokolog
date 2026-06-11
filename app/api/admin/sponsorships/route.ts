import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-guard";
import { CATEGORIES } from "@/lib/config";

export const runtime = "nodejs";

const createSchema = z.object({
  productId: z.string().min(1),
  category: z.enum(CATEGORIES),
  subNeed: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  adLabel: z.string().default("Reklam"),
});

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const sponsorships = await prisma.sponsorship.findMany({
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ sponsorships });
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

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json(
      { error: "Bitiş tarihi başlangıçtan sonra olmalı." },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) {
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 400 });
  }

  const sponsorship = await prisma.sponsorship.create({
    data: {
      productId: data.productId,
      category: data.category,
      subNeed: data.subNeed || null,
      startDate: start,
      endDate: end,
      adLabel: data.adLabel || "Reklam",
    },
  });
  return NextResponse.json({ sponsorship });
}
