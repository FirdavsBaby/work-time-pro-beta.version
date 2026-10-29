-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_time_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "taskTitle" TEXT NOT NULL,
    "description" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "pausedAt" DATETIME,
    "pausedSeconds" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "time_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_time_entries" ("createdAt", "description", "durationSeconds", "employeeId", "endedAt", "id", "startedAt", "taskTitle", "updatedAt") SELECT "createdAt", "description", "durationSeconds", "employeeId", "endedAt", "id", "startedAt", "taskTitle", "updatedAt" FROM "time_entries";
DROP TABLE "time_entries";
ALTER TABLE "new_time_entries" RENAME TO "time_entries";
CREATE INDEX "time_entries_employeeId_idx" ON "time_entries"("employeeId");
CREATE INDEX "time_entries_startedAt_idx" ON "time_entries"("startedAt");
CREATE INDEX "time_entries_endedAt_idx" ON "time_entries"("endedAt");
CREATE INDEX "time_entries_employeeId_endedAt_idx" ON "time_entries"("employeeId", "endedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
