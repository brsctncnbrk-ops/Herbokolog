import Link from "next/link";

export const metadata = {
  title: "KVKK Aydınlatma Metni — Herbokolog",
};

export default function KvkkPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        KVKK Aydınlatma Metni
      </h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600">
        <p>
          <strong>Placeholder.</strong> Bu sayfa, 6698 sayılı Kişisel Verilerin
          Korunması Kanunu kapsamında hazırlanacak aydınlatma metni için yer
          tutucudur.
        </p>
        <p>
          Herbokolog, kullanıcıların girdiği serbest metin sorgularını kalıcı
          olarak <strong>saklamaz</strong> ve veritabanına kaydetmez. Sorgular
          yalnızca ilgili oturum içinde, öneri üretmek amacıyla işlenir.
        </p>
        <p>
          Gerçek dağıtımdan önce bu metnin bir hukuk danışmanı tarafından
          tamamlanması gerekir.
        </p>
      </div>
    </main>
  );
}
