-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_versions" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "contentHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_tags" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "module_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_references" (
    "id" TEXT NOT NULL,
    "sourceModuleId" TEXT NOT NULL,
    "referencedModuleId" TEXT NOT NULL,

    CONSTRAINT "module_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "course_memberships_userId_courseId_key" ON "course_memberships"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "module_versions_moduleId_versionNumber_key" ON "module_versions"("moduleId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "module_tags_moduleId_tag_key" ON "module_tags"("moduleId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "module_references_sourceModuleId_referencedModuleId_key" ON "module_references"("sourceModuleId", "referencedModuleId");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_memberships" ADD CONSTRAINT "course_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_memberships" ADD CONSTRAINT "course_memberships_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_versions" ADD CONSTRAINT "module_versions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_tags" ADD CONSTRAINT "module_tags_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_references" ADD CONSTRAINT "module_references_sourceModuleId_fkey" FOREIGN KEY ("sourceModuleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_references" ADD CONSTRAINT "module_references_referencedModuleId_fkey" FOREIGN KEY ("referencedModuleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
