import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeText } from "@/lib/ai/analyze";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  text: z.string().min(2, "Lütfen ihtiyacını biraz daha açıkla.").max(2000),
});

const OUT_OF_SCOPE_MESSAGE =
  "Bu sistem yalnızca kişisel bakım (cilt, saç, ağız, vücut, güneş, tıraş, deodorant, el-ayak-tırnak) konularında yardımcı olabilir.";

export async function POST(req: Request): Promise<NextResponse<AnalyzeResponse | { error: string }>> {
  // Rate limit.
  const ip = getClientIp(req);
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  // Gövde doğrulama.
  let parsed: { text: string };
  try {
    const json = await req.json();
    parsed = bodySchema.parse(json);
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.errors[0]?.message ?? "Geçersiz istek."
        : "Geçersiz istek gövdesi.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const { analysis, source } = await analyzeText(parsed.text);

    // Kişisel bakım dışı.
    if (analysis.kategori_disi) {
      return NextResponse.json({
        analysis: null,
        outOfScope: true,
        medical: false,
        message: OUT_OF_SCOPE_MESSAGE,
        source,
      });
    }

    // Tıbbi sinyal: ürün önerme, doktora yönlendir.
    if (analysis.tibbi_uyari) {
      return NextResponse.json({
        analysis: null,
        outOfScope: false,
        medical: true,
        message:
          analysis.tibbi_aciklama ||
          "Belirttiğiniz durum tıbbi bir değerlendirme gerektirebilir. Lütfen bir uzmana/hekime başvurun.",
        source,
      });
    }

    return NextResponse.json({
      analysis,
      outOfScope: false,
      medical: false,
      message: null,
      source,
    });
  } catch (err) {
    console.error("[/api/analyze] unexpected error:", (err as Error).message);
    return NextResponse.json(
      { error: "Analiz sırasında bir sorun oluştu. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
}
