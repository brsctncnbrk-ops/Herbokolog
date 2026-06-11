import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-guard";

export const runtime = "nodejs";

const patchSchema = z.object({
  price: z.number().positive().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  let data;
  try {
    data = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Geçersiz veri." }, { status: 400 });
  }
  const product = await prisma.product.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ product });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
