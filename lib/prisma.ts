import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { SEED_DB_BASE64 } from "./seed-db-data";

// --- Veritabanı URL çözümü ---
// Lokal: .env içindeki DATABASE_URL (file:./dev.db) kullanılır.
// Sunucusuz (Vercel) ve DATABASE_URL tanımsızsa: yazılabilir /tmp altına
// gömülü, hazır-seed'li seed.db kopyalanır. Böylece harici DB gerekmeden,
// tek-tıkla deploy çalışır (yazma işlemleri instance ömrü boyunca /tmp'de tutulur).
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return process.env.DATABASE_URL;
  }
  return "file:/tmp/herbokolog.db";
}

function ensureSqliteFile(url: string): void {
  if (!url.startsWith("file:")) return;
  let target = url.slice("file:".length);
  // Göreli yol Prisma'da şema dizinine göre çözülür; mutlak yolu burada
  // yalnızca /tmp (sunucusuz) bootstrap'i için ele alıyoruz.
  if (!path.isAbsolute(target)) return; // lokal göreli yol -> Prisma + mevcut dev.db
  if (fs.existsSync(target)) return;

  try {
    // 1) Mümkünse pakete dahil edilmiş dosyadan kopyala (hızlı).
    const seedFile = path.join(process.cwd(), "prisma", "seed.db");
    if (fs.existsSync(seedFile)) {
      fs.copyFileSync(seedFile, target);
      return;
    }
    // 2) Dosya bulunamazsa (sunucusuz tracing kaçırmış olabilir) base64 gömülü
    //    seed verisinden yaz — bu her zaman pakete dahildir.
    fs.writeFileSync(target, Buffer.from(SEED_DB_BASE64, "base64"));
  } catch (err) {
    console.error("[prisma] seed DB hazırlanamadı:", (err as Error).message);
  }
}

const databaseUrl = resolveDatabaseUrl();
ensureSqliteFile(databaseUrl);
process.env.DATABASE_URL = databaseUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
