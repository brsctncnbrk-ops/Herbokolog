"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/config";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceTier: string;
  price: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

interface Sponsorship {
  id: string;
  productId: string;
  category: string;
  subNeed: string | null;
  startDate: string;
  endDate: string;
  adLabel: string;
}

export function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/sponsorships").then((r) => r.json()),
    ]);
    setProducts(p.products ?? []);
    setSponsorships(s.sponsorships ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // --- Ürün oluşturma formu ---
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "cilt_bakimi",
    subNeeds: "",
    activeIngredients: "",
    avoidFor: "",
    priceTier: "orta",
    price: "",
    rating: "4.2",
    reviewCount: "100",
  });

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      name: form.name,
      brand: form.brand,
      category: form.category,
      subNeeds: splitList(form.subNeeds),
      activeIngredients: splitList(form.activeIngredients),
      avoidFor: splitList(form.avoidFor),
      priceTier: form.priceTier,
      price: Number(form.price),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      inStock: true,
    };
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      flash("Ürün eklendi.");
      setForm({ ...form, name: "", brand: "", price: "" });
      load();
    } else {
      flash((await res.json()).error ?? "Hata.");
    }
  }

  async function toggleStock(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inStock: !p.inStock }),
    });
    load();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Ürün silinsin mi?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  // --- Sponsorluk formu ---
  const [sp, setSp] = useState({
    productId: "",
    category: "cilt_bakimi",
    subNeed: "",
    startDate: today(),
    endDate: nextMonth(),
    adLabel: "Reklam",
  });

  async function createSponsorship(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/sponsorships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...sp,
        subNeed: sp.subNeed || null,
      }),
    });
    if (res.ok) {
      flash("Sponsorluk eklendi.");
      load();
    } else {
      flash((await res.json()).error ?? "Hata.");
    }
  }

  async function deleteSponsorship(id: string) {
    await fetch(`/api/admin/sponsorships/${id}`, { method: "DELETE" });
    load();
  }

  // --- Demo verisi yükle ---
  async function seedDemo() {
    if (!confirm("Veritabanı örnek demo verisiyle DOLDURULACAK (mevcut veriler silinir). Devam?")) return;
    flash("Demo verisi yükleniyor...");
    const res = await fetch("/api/admin/seed", { method: "POST" });
    const data = await res.json();
    flash(res.ok ? `Yüklendi: ${data.products} ürün, ${data.sponsorships} sponsorluk.` : (data.error ?? "Hata"));
    load();
  }

  // --- Cron tetikleme ---
  async function triggerCron(job: string) {
    flash(`${job} tetikleniyor...`);
    const res = await fetch(`/api/admin/cron/${job}`, { method: "POST" });
    const data = await res.json();
    flash(`${job}: ${res.ok ? JSON.stringify(data.result) : data.error}`);
    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Paneli</h1>
        <button onClick={logout} className="text-sm text-gray-500 underline">
          Çıkış
        </button>
      </div>

      {msg && (
        <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700">
          {msg}
        </div>
      )}

      {/* Demo verisi */}
      <section className="mb-8 rounded-xl border border-brand-200 bg-brand-50 p-4">
        <h2 className="mb-1 font-semibold">Demo Verisi</h2>
        <p className="mb-3 text-sm text-gray-600">
          Veritabanı boşsa, tek tıkla 51 örnek ürün + etken madde haritası +
          sponsorluk yükle. (Mevcut veriyi siler.)
        </p>
        <button
          onClick={seedDemo}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Demo verisini yükle (51 ürün)
        </button>
      </section>

      {/* Cron tetikleme */}
      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Cron İşleri (manuel tetikleme)</h2>
        <div className="flex flex-wrap gap-2">
          {["update-products", "discover-products", "sponsor-check"].map((j) => (
            <button
              key={j}
              onClick={() => triggerCron(j)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              {j}
            </button>
          ))}
        </div>
      </section>

      {/* Sponsorluk ekleme */}
      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Sponsorluk Ekle (tek manuel iş)</h2>
        <form onSubmit={createSponsorship} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <select
            value={sp.productId}
            onChange={(e) => setSp({ ...sp, productId: e.target.value })}
            className="col-span-2 rounded border px-2 py-1.5 text-sm sm:col-span-3"
            required
          >
            <option value="">Ürün seç...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.brand} ({CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS]})
              </option>
            ))}
          </select>
          <select
            value={sp.category}
            onChange={(e) => setSp({ ...sp, category: e.target.value })}
            className="rounded border px-2 py-1.5 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            placeholder="alt ihtiyaç (boş=tüm kategori)"
            value={sp.subNeed}
            onChange={(e) => setSp({ ...sp, subNeed: e.target.value })}
            className="rounded border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Reklam etiketi"
            value={sp.adLabel}
            onChange={(e) => setSp({ ...sp, adLabel: e.target.value })}
            className="rounded border px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={sp.startDate}
            onChange={(e) => setSp({ ...sp, startDate: e.target.value })}
            className="rounded border px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={sp.endDate}
            onChange={(e) => setSp({ ...sp, endDate: e.target.value })}
            className="rounded border px-2 py-1.5 text-sm"
          />
          <button className="rounded bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            Ekle
          </button>
        </form>

        <ul className="mt-3 space-y-1 text-sm">
          {sponsorships.map((s) => {
            const active =
              new Date(s.startDate) <= new Date() && new Date(s.endDate) >= new Date();
            return (
              <li key={s.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5">
                <span>
                  <span className={active ? "text-brand-700" : "text-gray-400"}>
                    {active ? "● aktif" : "○ pasif"}
                  </span>{" "}
                  {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                  {s.subNeed ? ` / ${s.subNeed}` : " (tüm kategori)"} —{" "}
                  {new Date(s.startDate).toLocaleDateString("tr")} →{" "}
                  {new Date(s.endDate).toLocaleDateString("tr")}
                </span>
                <button
                  onClick={() => deleteSponsorship(s.id)}
                  className="text-red-500 hover:underline"
                >
                  sil
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Ürün ekleme */}
      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Ürün Ekle</h2>
        <form onSubmit={createProduct} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input placeholder="İsim" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded border px-2 py-1.5 text-sm" required />
          <input placeholder="Marka" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="rounded border px-2 py-1.5 text-sm" required />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded border px-2 py-1.5 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <select value={form.priceTier} onChange={(e) => setForm({ ...form, priceTier: e.target.value })} className="rounded border px-2 py-1.5 text-sm">
            <option value="ucuz">Ekonomik</option>
            <option value="orta">Dengeli</option>
            <option value="pahali">Premium</option>
          </select>
          <input placeholder="alt ihtiyaçlar (virgül)" value={form.subNeeds} onChange={(e) => setForm({ ...form, subNeeds: e.target.value })} className="rounded border px-2 py-1.5 text-sm" />
          <input placeholder="etken maddeler (virgül)" value={form.activeIngredients} onChange={(e) => setForm({ ...form, activeIngredients: e.target.value })} className="rounded border px-2 py-1.5 text-sm" />
          <input placeholder="avoidFor (virgül)" value={form.avoidFor} onChange={(e) => setForm({ ...form, avoidFor: e.target.value })} className="rounded border px-2 py-1.5 text-sm" />
          <input placeholder="Fiyat (TL)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded border px-2 py-1.5 text-sm" required />
          <input placeholder="Puan" type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="rounded border px-2 py-1.5 text-sm" />
          <input placeholder="Yorum sayısı" type="number" value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: e.target.value })} className="rounded border px-2 py-1.5 text-sm" />
          <button className="col-span-2 rounded bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            Ürün Ekle
          </button>
        </form>
      </section>

      {/* Ürün listesi */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Ürünler ({products.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400">
              <tr>
                <th className="py-1">İsim</th>
                <th>Kategori</th>
                <th>Kademe</th>
                <th>Fiyat</th>
                <th>Puan</th>
                <th>Yorum</th>
                <th>Stok</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="py-1.5">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.brand}</div>
                  </td>
                  <td className="text-gray-500">{CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS]}</td>
                  <td>{p.priceTier}</td>
                  <td>{p.price} ₺</td>
                  <td>{p.rating.toFixed(1)}</td>
                  <td>{p.reviewCount}</td>
                  <td>
                    <button
                      onClick={() => toggleStock(p)}
                      className={p.inStock ? "text-brand-600" : "text-red-500"}
                    >
                      {p.inStock ? "var" : "yok"}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:underline">
                      sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function splitList(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function nextMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
