import { NextResponse } from "next/server";
import { analysisSchema } from "@/lib/types";
import { recommend } from "@/lib/recommend/engine";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { RecommendResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  req: Request,
): Promise<NextResponse<RecommendResponse | { error: string }>> {
  const ip = getClientIp(req);
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let analysis;
  try {
    const json = await req.json();
    analysis = analysisSchema.parse(json);
  } catch {
    return NextResponse.json(
      { error: "Geçersiz analiz verisi." },
      { status: 400 },
    );
  }

  try {
    const result = await recommend(analysis);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/recommend] unexpected error:", (err as Error).message);
    return NextResponse.json(
      { error: "Öneri oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
