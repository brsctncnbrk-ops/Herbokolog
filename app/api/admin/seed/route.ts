import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-guard";
import { seedDatabase } from "@/lib/seed-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin: veritabanını örnek demo verisiyle doldurur (mevcut veriyi siler).
export async function POST() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  try {
    const result = await seedDatabase(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[/api/admin/seed] hata:", (err as Error).message);
    return NextResponse.json(
      { error: "Seed sırasında hata: " + (err as Error).message },
      { status: 500 },
    );
  }
}
