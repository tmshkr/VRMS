/*
  Warnings:

  - A unique constraint covering the columns `[gh_account_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gh_account_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_gh_account_id_key" ON "User"("gh_account_id");

-- CreateIndex
CREATE INDEX "User_gh_account_id_idx" ON "User"("gh_account_id");
