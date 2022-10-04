-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('ADMIN', 'FACILITATOR');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INDETERMINATE');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INDETERMINATE');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "AppRoleOnUser" (
    "user_id" BIGINT NOT NULL,
    "role" "AppRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppRoleOnUser_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "completed_onboarding" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "real_name" TEXT NOT NULL,
    "profile_image" TEXT NOT NULL,
    "slack_id" TEXT NOT NULL,
    "slack_team_id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" BIGSERIAL NOT NULL,
    "created_by_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "user_id" BIGINT NOT NULL,
    "project_id" BIGINT NOT NULL,
    "added_by_id" BIGINT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "position" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "gcal_event_id" TEXT NOT NULL,
    "rrule" TEXT,
    "project_id" BIGINT NOT NULL,
    "created_by_id" BIGINT NOT NULL,
    "slack_channel_id" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingException" (
    "meeting_id" BIGINT NOT NULL,
    "instance" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "gcal_event_id" TEXT NOT NULL,
    "description" TEXT,
    "title" TEXT,
    "status" "MeetingStatus" NOT NULL,

    CONSTRAINT "MeetingException_pkey" PRIMARY KEY ("meeting_id","instance")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "meeting_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "meeting_time" TIMESTAMP(3) NOT NULL,
    "added_by_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("meeting_id","user_id","meeting_time")
);

-- CreateTable
CREATE TABLE "MeetingCheckin" (
    "meeting_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "meeting_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingCheckin_pkey" PRIMARY KEY ("meeting_id","user_id","meeting_time")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_slack_id_key" ON "User"("slack_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_slack_id_slack_team_id_idx" ON "User"("slack_id", "slack_team_id");

-- CreateIndex
CREATE INDEX "User_slack_id_idx" ON "User"("slack_id");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_slack_id_slack_team_id_key" ON "User"("slack_id", "slack_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "TeamMember_user_id_idx" ON "TeamMember"("user_id");

-- CreateIndex
CREATE INDEX "TeamMember_project_id_idx" ON "TeamMember"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_gcal_event_id_key" ON "Meeting"("gcal_event_id");

-- CreateIndex
CREATE INDEX "Meeting_gcal_event_id_idx" ON "Meeting"("gcal_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingException_gcal_event_id_key" ON "MeetingException"("gcal_event_id");

-- CreateIndex
CREATE INDEX "MeetingException_meeting_id_idx" ON "MeetingException"("meeting_id");

-- CreateIndex
CREATE INDEX "MeetingException_instance_idx" ON "MeetingException"("instance");

-- CreateIndex
CREATE INDEX "MeetingException_gcal_event_id_idx" ON "MeetingException"("gcal_event_id");

-- CreateIndex
CREATE INDEX "MeetingParticipant_user_id_idx" ON "MeetingParticipant"("user_id");

-- CreateIndex
CREATE INDEX "MeetingParticipant_meeting_id_idx" ON "MeetingParticipant"("meeting_id");

-- CreateIndex
CREATE INDEX "MeetingCheckin_meeting_id_idx" ON "MeetingCheckin"("meeting_id");

-- CreateIndex
CREATE INDEX "MeetingCheckin_user_id_idx" ON "MeetingCheckin"("user_id");

-- AddForeignKey
ALTER TABLE "AppRoleOnUser" ADD CONSTRAINT "AppRoleOnUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingException" ADD CONSTRAINT "MeetingException_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingCheckin" ADD CONSTRAINT "MeetingCheckin_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingCheckin" ADD CONSTRAINT "MeetingCheckin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
