import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Günlük: süresi biten sponsorlukları raporlar (silme gerekmez — sorgu anında
// tarih kontrolü zaten var; bu job yalnızca log/bildirim için).
async function handle(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.sponsorship.findMany({
    where: { endDate: { lt: now } },
  });
  const active = await prisma.sponsorship.findMany({
    where: { startDate: { lte: now }, endDate: { gte: now } },
  });

  // Üretimde burada e-posta/Slack bildirimi tetiklenebilir.
  console.log(
    `[sponsor-check] expired=${expired.length} active=${active.length} at ${now.toISOString()}`,
  );

  return NextResponse.json({
    ok: true,
    job: "sponsor-check",
    expired: expired.map((s) => ({ id: s.id, productId: s.productId, endDate: s.endDate })),
    activeCount: active.length,
    timestamp: now.toISOString(),
  });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
