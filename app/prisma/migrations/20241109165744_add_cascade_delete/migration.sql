-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
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
    CONSTRAINT "Question_qcmId_fkey" FOREIGN KEY ("qcmId") REFERENCES "QCM" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("answer1", "answer2", "answer3", "answer4", "correct1", "correct2", "correct3", "correct4", "id", "qcmId", "question", "questionNumber") SELECT "answer1", "answer2", "answer3", "answer4", "correct1", "correct2", "correct3", "correct4", "id", "qcmId", "question", "questionNumber" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
