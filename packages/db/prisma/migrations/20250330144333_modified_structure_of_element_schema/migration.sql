/*
  Warnings:

  - You are about to drop the column `userId` on the `Element` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `Element` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Element" DROP CONSTRAINT "Element_userId_fkey";

-- AlterTable
ALTER TABLE "Element" DROP COLUMN "userId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
