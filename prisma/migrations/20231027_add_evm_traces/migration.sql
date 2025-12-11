-- CreateTable
CREATE TABLE "EvmTrace" (
    "id" SERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "traceIndex" INTEGER NOT NULL,
    "pc" INTEGER NOT NULL,
    "op" TEXT NOT NULL,
    "gas" INTEGER NOT NULL,
    "gasCost" INTEGER NOT NULL,
    "depth" INTEGER NOT NULL,
    "stack" TEXT[], -- Storing stack as array of hex strings
    "memory" TEXT[], -- Storing memory as array of hex strings
    "storage" JSONB, -- Storing storage updates if any
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvmTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvmTrace_transactionHash_traceIndex_key" ON "EvmTrace"("transactionHash", "traceIndex");

-- CreateTable
CREATE TABLE "NarrativeHistory" (
    "id" SERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "summary" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NarrativeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NarrativeHistory_transactionHash_key" ON "NarrativeHistory"("transactionHash");

-- CreateTable
CREATE TABLE "GoogleSearchFact" (
    "id" SERIAL NOT NULL,
    "narrativeHistoryId" INTEGER NOT NULL,
    "query" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleSearchFact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GoogleSearchFact" ADD CONSTRAINT "GoogleSearchFact_narrativeHistoryId_fkey" FOREIGN KEY ("narrativeHistoryId") REFERENCES "NarrativeHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;