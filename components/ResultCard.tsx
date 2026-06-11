import type { RecommendationCard } from "@/lib/types";

function IngredientLabel(raw: string): string {
  // snake_case -> Okunur etiket: "salisilik_asit" -> "Salisilik Asit"
  return raw
    .split("_")
    .map((w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1))
    .join(" ");
}

export function ResultCard({ card }: { card: RecommendationCard }) {
  return (
    <div className="relative animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {card.isSponsored && (
        <span className="absolute right-3 top-3 rounded-md bg-ad-bg px-2 py-1 text-xs font-bold text-ad-text shadow">
          {card.adLabel ?? "Reklam"}
        </span>
      )}

      <div className="flex gap-4">
        {/* Görsel placeholder */}
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-gray-100 text-2xl">
          🧴
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {card.priceTierLabel}
            </span>
            {card.approximateMatch && (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Yakın eşleşme
              </span>
            )}
          </div>

          <h3 className="mt-1 truncate text-base font-semibold text-gray-900">
            {card.name}
          </h3>
          <p className="text-sm text-gray-500">{card.brand}</p>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-amber-500">★ {card.rating.toFixed(1)}</span>
            <span className="text-gray-400">
              ({card.reviewCount.toLocaleString("tr")} yorum)
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {card.price.toLocaleString("tr", { maximumFractionDigits: 0 })} ₺
          </div>
        </div>
      </div>

      {card.matchedIngredients.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {card.matchedIngredients.map((ing) => (
            <span
              key={ing}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
            >
              ✓ {IngredientLabel(ing)}
            </span>
          ))}
        </div>
      )}

      {card.sellerLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {card.sellerLinks.map((s) => (
            <a
              key={s.seller}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex-1 rounded-lg border border-brand-500 px-3 py-2 text-center text-sm font-medium text-brand-700 transition hover:bg-brand-50"
            >
              {capitalize(s.seller)} ·{" "}
              {s.price.toLocaleString("tr", { maximumFractionDigits: 0 })} ₺
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase("tr") + s.slice(1);
}
