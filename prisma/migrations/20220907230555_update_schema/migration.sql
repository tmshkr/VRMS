/*
  Warnings:

  - You are about to drop the column `google_meet_link` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `TeamMember` table. All the data in the column will be lost.
  - Made the column `gh_username` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `type` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INDETERMINATE');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INDETERMINATE');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('ASYNC', 'SYNCHRONOUS');

-- AlterEnum
ALTER TYPE "ProjectRole" ADD VALUE 'GUEST';

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "gh_username" SET NOT NULL;

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "google_meet_link",
ADD COLUMN     "join_url" TEXT,
ADD COLUMN     "type" "MeetingType" NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "is_active",
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "is_active",
ADD COLUMN     "position" TEXT,
ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE';
