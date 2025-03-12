-- CreateTable
CREATE TABLE "RobloxUserBan" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "reason" TEXT NOT NULL,
    "bannedUntil" TEXT NOT NULL,
    "privateReason" TEXT,
    "moderatorId" TEXT NOT NULL,
    "moderatorName" TEXT NOT NULL,
    "bannedFrom" TEXT NOT NULL DEFAULT 'All',
    "hackBan" BOOLEAN NOT NULL DEFAULT false,
    "noFederate" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "RobloxUserBan_AIReasoning" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "reason" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "justified" BOOLEAN NOT NULL,
    "originalReason" TEXT NOT NULL,
    "banProviderData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RobloxUserBan_ThirdPartyFed" (
    "userId" TEXT NOT NULL,
    "banHandlerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "moderatorId" TEXT,

    PRIMARY KEY ("userId", "banHandlerId")
);

-- CreateTable
CREATE TABLE "RobloxUserAppeal" (
    "robloxUserId" TEXT NOT NULL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "appealMessage" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GuildSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT
);

-- CreateTable
CREATE TABLE "Whitelist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hidden" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Whitelist_RobloxUser" (
    "robloxId" TEXT NOT NULL PRIMARY KEY,
    "discordId" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Whitelist_OCbwoy3ChanAI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hidden" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "OCbwoy3ChanAI_ChannelSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forcedPrompt" TEXT
);

-- CreateTable
CREATE TABLE "OCbwoy3ChanAI_GuildSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forcedPrompt" TEXT
);

-- CreateTable
CREATE TABLE "OCbwoy3ChanAI_UserMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user" TEXT NOT NULL,
    "memory" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questions" TEXT NOT NULL,
    "authorId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "answers" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "VDWorld" (
    "name" TEXT NOT NULL,
    "worldGeneratorType" TEXT NOT NULL DEFAULT 'FLAT',
    "worldGeneratorSeed" BIGINT NOT NULL DEFAULT 0,
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobidLock" TEXT
);

-- CreateTable
CREATE TABLE "VDWorldChunk" (
    "worldId" TEXT NOT NULL,
    "chunkX" INTEGER NOT NULL,
    "chunkY" INTEGER NOT NULL,
    "chunkZ" INTEGER NOT NULL,
    "data" TEXT NOT NULL,

    PRIMARY KEY ("worldId", "chunkX", "chunkY", "chunkZ")
);

-- CreateIndex
CREATE UNIQUE INDEX "RobloxUserBan_userId_key" ON "RobloxUserBan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RobloxUserBan_AIReasoning_userId_key" ON "RobloxUserBan_AIReasoning"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RobloxUserAppeal_robloxUserId_key" ON "RobloxUserAppeal"("robloxUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RobloxUserAppeal_ipAddress_key" ON "RobloxUserAppeal"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "RobloxUserAppeal_email_key" ON "RobloxUserAppeal"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GuildSetting_id_key" ON "GuildSetting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Whitelist_id_key" ON "Whitelist"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Whitelist_RobloxUser_robloxId_key" ON "Whitelist_RobloxUser"("robloxId");

-- CreateIndex
CREATE UNIQUE INDEX "Whitelist_OCbwoy3ChanAI_id_key" ON "Whitelist_OCbwoy3ChanAI"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OCbwoy3ChanAI_ChannelSettings_id_key" ON "OCbwoy3ChanAI_ChannelSettings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OCbwoy3ChanAI_GuildSettings_id_key" ON "OCbwoy3ChanAI_GuildSettings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OCbwoy3ChanAI_UserMemory_id_key" ON "OCbwoy3ChanAI_UserMemory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Form_id_key" ON "Form"("id");

-- CreateIndex
CREATE UNIQUE INDEX "FormResponse_id_key" ON "FormResponse"("id");

-- CreateIndex
CREATE UNIQUE INDEX "VDWorld_id_key" ON "VDWorld"("id");
