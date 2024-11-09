-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "qcmId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer1" TEXT NOT NULL,
    "answer2" TEXT NOT NULL,
    "answer3" TEXT NOT NULL,
    "answer4" TEXT NOT NULL,
    "correct1" BOOLEAN NOT NULL,
    "correct2" BOOLEAN NOT NULL,
    "correct3" BOOLEAN NOT NULL,
    "correct4" BOOLEAN NOT NULL,
    CONSTRAINT "Question_qcmId_fkey" FOREIGN KEY ("qcmId") REFERENCES "QCM" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QCM" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currentQuestion" INTEGER NOT NULL DEFAULT 0
);
