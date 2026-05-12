-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('MOVIDA', 'LOCALIZA', 'UNIDAS', 'FOCO', 'OTHER');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ECONOMICO', 'INTERMEDIARIO', 'SUV', 'LUXO', 'VAN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchCache" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "results" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "targetPrice" DECIMAL(65,30) NOT NULL,
    "carCategory" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "carOfferId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarOffer" (
    "id" TEXT NOT NULL,
    "provider" "Provider" NOT NULL DEFAULT 'OTHER',
    "model" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'ECONOMICO',
    "price" DECIMAL(65,30) NOT NULL,
    "transmission" TEXT,
    "hasAC" BOOLEAN,
    "seats" INTEGER,
    "deepLink" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SearchCache_location_startDate_endDate_idx" ON "SearchCache"("location", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_carOfferId_key" ON "Bookmark"("userId", "carOfferId");

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_carOfferId_fkey" FOREIGN KEY ("carOfferId") REFERENCES "CarOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
