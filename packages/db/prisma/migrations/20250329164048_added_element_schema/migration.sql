-- CreateTable
CREATE TABLE "Element" (
    "id" SERIAL NOT NULL,
    "tool" TEXT NOT NULL,
    "x1" INTEGER NOT NULL,
    "y1" INTEGER NOT NULL,
    "x2" INTEGER NOT NULL,
    "y2" INTEGER NOT NULL,
    "roughElements" TEXT,
    "points" INTEGER[],
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL,

    CONSTRAINT "Element_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
