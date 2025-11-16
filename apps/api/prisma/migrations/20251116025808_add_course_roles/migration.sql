-- CreateEnum
CREATE TYPE "CourseRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "course_memberships" ADD COLUMN     "role" "CourseRole" NOT NULL DEFAULT 'MEMBER';
