-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VIEWER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateTable
CREATE TABLE "admin_sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "admin_sessions_expire_idx" ON "admin_sessions"("expire");

-- CreateIndex
CREATE INDEX "items_status_createdAt_idx" ON "items"("status", "createdAt");

-- CreateIndex
CREATE INDEX "items_ownerId_idx" ON "items"("ownerId");
