-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AppRoleOnUser" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MeetingParticipant" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TeamMember" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updated_at" DROP DEFAULT;
