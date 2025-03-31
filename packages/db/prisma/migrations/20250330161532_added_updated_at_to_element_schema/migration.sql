-- DropForeignKey
ALTER TABLE "Element" DROP CONSTRAINT "Element_creatorId_fkey";

-- AlterTable
ALTER TABLE "Element" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
