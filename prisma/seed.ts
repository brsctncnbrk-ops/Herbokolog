import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  const r = await seedDatabase(prisma);
  console.log(`  ${r.products} ürün eklendi.`);
  console.log(`  ${r.ingredientMaps} IngredientMap satırı eklendi.`);
  console.log(`  ${r.sponsorships} sponsorluk eklendi (1 aktif, 1 süresi geçmiş).`);
  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
