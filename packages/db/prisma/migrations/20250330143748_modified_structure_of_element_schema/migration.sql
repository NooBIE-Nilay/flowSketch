/*
  Warnings:

  - You are about to drop the column `color` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `roughElements` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `tool` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `x1` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `x2` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `y1` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `y2` on the `Element` table. All the data in the column will be lost.
  - Added the required column `element_data` to the `Element` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Element" DROP COLUMN "color",
DROP COLUMN "points",
DROP COLUMN "roughElements",
DROP COLUMN "tool",
DROP COLUMN "x1",
DROP COLUMN "x2",
DROP COLUMN "y1",
DROP COLUMN "y2",
ADD COLUMN     "element_data" TEXT NOT NULL;
