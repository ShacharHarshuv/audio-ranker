-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingVote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "winnerAudioFileId" TEXT NOT NULL,
    "loserAudioFileId" TEXT NOT NULL,
    "voterSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AudioFile_projectId_idx" ON "AudioFile"("projectId");

-- CreateIndex
CREATE INDEX "RankingVote_projectId_createdAt_idx" ON "RankingVote"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "AudioFile" ADD CONSTRAINT "AudioFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingVote" ADD CONSTRAINT "RankingVote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingVote" ADD CONSTRAINT "RankingVote_winnerAudioFileId_fkey" FOREIGN KEY ("winnerAudioFileId") REFERENCES "AudioFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingVote" ADD CONSTRAINT "RankingVote_loserAudioFileId_fkey" FOREIGN KEY ("loserAudioFileId") REFERENCES "AudioFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
