import { SearchExperience } from "@/components/SearchExperience";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-8 text-center">
        <div className="mb-3 text-4xl">🌿</div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Herbokolog
        </h1>
        <p className="mt-2 text-base text-gray-500">
          İhtiyacını anlat, sana bilimsel içerik uyumuna göre kişisel bakım
          ürünleri önerelim.
        </p>
      </header>

      <SearchExperience />
    </main>
  );
}
