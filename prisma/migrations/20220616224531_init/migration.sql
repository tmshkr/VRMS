-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('ADMIN', 'FACILITATOR');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateTable
CREATE TABLE "AppRoleOnUser" (
    "id" SERIAL NOT NULL,
    "role" "AppRole" NOT NULL,
    "slack_id" TEXT NOT NULL,

    CONSTRAINT "AppRoleOnUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "slack_id" TEXT NOT NULL,
    "email" TEXT,
    "real_name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("slack_id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" SERIAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "project_id" INTEGER NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT E'MEMBER',
    "slack_id" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" SERIAL NOT NULL,
    "created_by" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "project_id" INTEGER NOT NULL,
    "rrule" TEXT,
    "slack_channel_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" SERIAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "meeting_id" INTEGER NOT NULL,
    "slack_id" TEXT NOT NULL,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppRoleOnUser_slack_id_role_key" ON "AppRoleOnUser"("slack_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_slack_id_project_id_key" ON "TeamMember"("slack_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meeting_id_slack_id_key" ON "MeetingParticipant"("meeting_id", "slack_id");

-- AddForeignKey
ALTER TABLE "AppRoleOnUser" ADD CONSTRAINT "AppRoleOnUser_slack_id_fkey" FOREIGN KEY ("slack_id") REFERENCES "User"("slack_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("slack_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_slack_id_fkey" FOREIGN KEY ("slack_id") REFERENCES "User"("slack_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("slack_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_slack_id_fkey" FOREIGN KEY ("slack_id") REFERENCES "User"("slack_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
