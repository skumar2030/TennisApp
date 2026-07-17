-- CreateTable
CREATE TABLE "UserProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "auth0Id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "city" TEXT,
    "state" TEXT,
    "utrSingles" TEXT,
    "utrDoubles" TEXT,
    "ustaRating" TEXT,
    "dominantHand" TEXT,
    "playStyle" TEXT,
    "yearsPlaying" INTEGER,
    "coachName" TEXT,
    "highSchool" TEXT,
    "graduationYear" INTEGER,
    "gpa" TEXT,
    "satScore" INTEGER,
    "actScore" INTEGER,
    "intendedMajor" TEXT,
    "recruitingStatus" TEXT,
    "targetDivision" TEXT,
    "highlightVideoUrl" TEXT,
    "profilePhotoUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'player',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_auth0Id_key" ON "UserProfile"("auth0Id");
