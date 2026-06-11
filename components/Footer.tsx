import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-gray-500 space-y-2">
        <p>
          Bu sayfadaki bağlantılardan yapılan alışverişlerden komisyon
          kazanabiliriz.
        </p>
        <p>
          Bu öneriler tıbbi tavsiye değildir. Cilt/sağlık sorunlarınız için
          uzmana danışın.
        </p>
        <p className="pt-2">
          <Link href="/kvkk" className="underline hover:text-gray-700">
            KVKK Aydınlatma Metni
          </Link>
          <span className="mx-2">·</span>
          <span>© {new Date().getFullYear()} Herbokolog</span>
        </p>
      </div>
    </footer>
  );
}
