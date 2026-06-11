// prisma/seed.db -> lib/seed-db-data.ts (base64 gömme) yeniden üretici.
// Kullanım: önce `npx prisma db seed` ile dev.db'yi tazele, sonra:
//   cp prisma/dev.db prisma/seed.db && node scripts/gen-seed-db.js
const fs = require("fs");
const path = require("path");

const seedPath = path.join(__dirname, "..", "prisma", "seed.db");
const outPath = path.join(__dirname, "..", "lib", "seed-db-data.ts");

const b64 = fs.readFileSync(seedPath).toString("base64");
const out =
  "// OTOMATİK ÜRETİLDİ — prisma/seed.db dosyasının base64 gömülü hali.\n" +
  "// Sunucusuz (Vercel) ortamda harici DB olmadan demoyu çalıştırmak için kullanılır.\n" +
  "// Güncellemek için: node scripts/gen-seed-db.js\n" +
  `export const SEED_DB_BASE64 = ${JSON.stringify(b64)};\n`;
fs.writeFileSync(outPath, out);
console.log("lib/seed-db-data.ts güncellendi. base64 uzunluk:", b64.length);
