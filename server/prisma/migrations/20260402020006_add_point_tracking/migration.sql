-- CreateTable
CREATE TABLE "Point" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "pointNumber" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    "winner" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "shotType" TEXT,
    "direction" TEXT,
    "serveType" TEXT,
    "serveIn" BOOLEAN,
    "rallyCount" INTEGER,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Point_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "scope" TEXT NOT NULL,
    "setNumber" INTEGER,
    "gameNumber" INTEGER,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchComment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
