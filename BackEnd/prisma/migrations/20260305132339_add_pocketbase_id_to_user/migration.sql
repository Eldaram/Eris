/*
  Warnings:

  - A unique constraint covering the columns `[pocketbase_id]` on the table `Postgres_Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Postgres_Users" ADD COLUMN     "pocketbase_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Postgres_Users_pocketbase_id_key" ON "Postgres_Users"("pocketbase_id");
