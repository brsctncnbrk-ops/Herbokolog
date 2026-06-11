// SQLite'ta JSON dizileri String olarak saklanır; güvenli parse/serialize.

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function parseSellerLinks(
  raw: string | null | undefined,
): { seller: string; url: string; price: number }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.seller === "string")
      .map((s) => ({
        seller: String(s.seller),
        url: String(s.url ?? "#"),
        price: Number(s.price ?? 0),
      }));
  } catch {
    return [];
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value);
}
