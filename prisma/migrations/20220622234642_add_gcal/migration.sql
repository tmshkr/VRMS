/*
  Warnings:

  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `real_name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "gcal_event_id" TEXT,
ADD COLUMN     "gcal_event_link" TEXT,
ADD COLUMN     "google_meet_link" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "real_name" SET NOT NULL;
