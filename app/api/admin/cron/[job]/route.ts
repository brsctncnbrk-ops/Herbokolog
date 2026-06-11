import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-guard";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "update-products",
  "discover-products",
  "sponsor-check",
]);

// Admin panelinden cron job'larını manuel tetikler.
// Admin oturumu doğrulanır, ardından CRON_SECRET ile gerçek cron route'u çağrılır.
export async function POST(
  req: Request,
  { params }: { params: { job: string } },
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  if (!ALLOWED.has(params.job)) {
    return NextResponse.json({ error: "Bilinmeyen job." }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const secret = process.env.CRON_SECRET ?? "";

  try {
    const res = await fetch(`${origin}/api/cron/${params.job}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json({ triggered: params.job, result: data }, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: `Tetikleme başarısız: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
