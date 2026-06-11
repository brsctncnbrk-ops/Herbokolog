-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subNeeds" TEXT NOT NULL,
    "activeIngredients" TEXT NOT NULL,
    "avoidFor" TEXT NOT NULL,
    "priceTier" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "sellerLinks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subNeed" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "adLabel" TEXT NOT NULL DEFAULT 'Reklam',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientMap" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subNeed" TEXT NOT NULL,
    "ingredient" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "IngredientMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Sponsorship_category_idx" ON "Sponsorship"("category");

-- CreateIndex
CREATE INDEX "IngredientMap_category_subNeed_idx" ON "IngredientMap"("category", "subNeed");
