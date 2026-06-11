/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gömülü seed.db'yi sunucusuz (Vercel) fonksiyon paketine dahil et,
  // böylece runtime'da /tmp'ye kopyalanabilir.
  experimental: {
    outputFileTracingIncludes: {
      "/api/**": ["./prisma/seed.db"],
      "/admin": ["./prisma/seed.db"],
    },
  },
};

module.exports = nextConfig;
