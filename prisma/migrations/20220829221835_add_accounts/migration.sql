/*
  Warnings:

  - The primary key for the `AppRoleOnUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `AppRoleOnUser` table. All the data in the column will be lost.
  - You are about to drop the column `slack_id` on the `AppRoleOnUser` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `Meeting` table. All the data in the column will be lost.
  - The primary key for the `MeetingParticipant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `MeetingParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `slack_id` on the `MeetingParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `Project` table. All the data in the column will be lost.
  - The primary key for the `TeamMember` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `slack_id` on the `TeamMember` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `gh_account_id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slack_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `AppRoleOnUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_id` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `added_by_id` to the `MeetingParticipant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `MeetingParticipant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_id` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `added_by_id` to the `TeamMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `TeamMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profile_image` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AppRoleOnUser" DROP CONSTRAINT "AppRoleOnUser_slack_id_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_created_by_fkey";

-- DropForeignKey
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT "MeetingParticipant_slack_id_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_created_by_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_slack_id_fkey";

-- DropIndex
DROP INDEX "AppRoleOnUser_slack_id_role_key";

-- DropIndex
DROP INDEX "MeetingParticipant_meeting_id_slack_id_key";

-- DropIndex
DROP INDEX "TeamMember_slack_id_project_id_key";

-- DropIndex
DROP INDEX "User_gh_account_id_idx";

-- DropIndex
DROP INDEX "User_gh_account_id_key";

-- AlterTable
ALTER TABLE "AppRoleOnUser" DROP CONSTRAINT "AppRoleOnUser_pkey",
DROP COLUMN "id",
DROP COLUMN "slack_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "AppRoleOnUser_pkey" PRIMARY KEY ("user_id", "role");

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "created_by",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT "MeetingParticipant_pkey",
DROP COLUMN "id",
DROP COLUMN "slack_id",
ADD COLUMN     "added_by_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("meeting_id", "user_id");

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "created_by",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_pkey",
DROP COLUMN "id",
DROP COLUMN "slack_id",
ADD COLUMN     "added_by_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("user_id", "project_id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "gh_account_id",
ADD COLUMN     "completed_onboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "profile_image" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Account" (
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gh_username" TEXT,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "two_factor_authentication" BOOLEAN NOT NULL,
    "vrms_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","provider_account_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_vrms_user_id_key" ON "Account"("provider", "vrms_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_slack_id_key" ON "User"("slack_id");

-- CreateIndex
CREATE INDEX "User_slack_id_idx" ON "User"("slack_id");

-- AddForeignKey
ALTER TABLE "AppRoleOnUser" ADD CONSTRAINT "AppRoleOnUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_vrms_user_id_fkey" FOREIGN KEY ("vrms_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
