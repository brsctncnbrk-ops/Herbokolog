"use client";

import { useState } from "react";
import { ResultCard } from "./ResultCard";
import type { AnalyzeResponse, RecommendResponse } from "@/lib/types";

const EXAMPLES = [
  "Yüzüm yağlı ve sivilceye yatkın",
  "Saçım kepekli ve çabuk yağlanıyor",
  "Diş etlerim hassas",
  "Cildim çok kuru ve tahriş oluyor",
  "Yazın güneşten korunmak istiyorum",
  "Ayak tabanım çok nasırlı",
];

type Status = "idle" | "loading" | "done" | "error";

export function SearchExperience() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [guvenNotu, setGuvenNotu] = useState<string>("");
  const [result, setResult] = useState<RecommendResponse | null>(null);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 2) return;

    setStatus("loading");
    setErrorMsg(null);
    setInfoMsg(null);
    setResult(null);
    setGuvenNotu("");

    try {
      // 1) Analiz.
      const aRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const aData = (await aRes.json()) as AnalyzeResponse & { error?: string };

      if (!aRes.ok) {
        setErrorMsg(aData.error ?? "Bir sorun oluştu.");
        setStatus("error");
        return;
      }

      if (aData.outOfScope || aData.medical || !aData.analysis) {
        setInfoMsg(aData.message);
        setStatus("done");
        return;
      }

      // 2) Öneri.
      const rRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aData.analysis),
      });
      const rData = (await rRes.json()) as RecommendResponse & { error?: string };

      if (!rRes.ok) {
        setErrorMsg(rData.error ?? "Öneri alınamadı.");
        setStatus("error");
        return;
      }

      setResult(rData);
      setGuvenNotu(rData.guvenNotu);
      setInfoMsg(rData.message);
      setStatus("done");
    } catch {
      setErrorMsg("Bağlantı sorunu. Lütfen tekrar deneyin.");
      setStatus("error");
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Cildini, saçını ya da bakım ihtiyacını anlat..."
          className="w-full resize-none rounded-2xl border border-gray-300 bg-white p-4 text-base shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:border-brand-500 hover:text-brand-700"
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={status === "loading" || text.trim().length < 2}
          className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Analiz ediliyor..." : "Öneri Al"}
        </button>
      </form>

      {/* Yükleniyor animasyonu */}
      {status === "loading" && (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-gray-100"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      )}

      {/* Hata */}
      {status === "error" && errorMsg && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Bilgi mesajı (kapsam dışı / tıbbi / yakın eşleşme) */}
      {status === "done" && infoMsg && (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {infoMsg}
        </div>
      )}

      {/* guven_notu kutusu */}
      {status === "done" && guvenNotu && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ℹ️ {guvenNotu}
        </div>
      )}

      {/* Sonuç kartları */}
      {status === "done" && result && result.cards.length > 0 && (
        <div className="mt-6 space-y-3">
          {result.hasSponsored && (
            <p className="text-xs text-gray-400">Sponsorlu öneri</p>
          )}
          {result.cards.map((card) => (
            <ResultCard key={card.id} card={card} />
          ))}
          <p className="pt-2 text-center text-xs text-gray-400">
            Bu öneriler tıbbi tavsiye değildir. Cilt/sağlık sorunlarınız için
            uzmana danışın.
          </p>
        </div>
      )}
    </div>
  );
}
