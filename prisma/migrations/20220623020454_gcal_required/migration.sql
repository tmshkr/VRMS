/*
  Warnings:

  - Made the column `gcal_event_id` on table `Meeting` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gcal_event_link` on table `Meeting` required. This step will fail if there are existing NULL values in that column.
  - Made the column `google_meet_link` on table `Meeting` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "gcal_event_id" SET NOT NULL,
ALTER COLUMN "gcal_event_link" SET NOT NULL,
ALTER COLUMN "google_meet_link" SET NOT NULL;
