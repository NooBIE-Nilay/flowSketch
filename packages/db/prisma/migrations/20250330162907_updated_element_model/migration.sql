/*
  Warnings:

  - You are about to drop the column `userId` on the `Element` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Element" DROP CONSTRAINT "Element_userId_fkey";

-- AlterTable
ALTER TABLE "Element" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
