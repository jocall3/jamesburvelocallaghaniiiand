---
-- CreateTable: Bond
CREATE TABLE "Bond" (
    "id" SERIAL NOT NULL,
    "isin" TEXT NOT NULL,
    "cusip" TEXT,
    "issuerName" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "nominalValue" DECIMAL(65,30),
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT, -- e.g., Zero-coupon, Coupon bond
    "classification" TEXT, -- e.g., Senior Unsecured, Registered, CMB
    "countryOfRisk" TEXT,
    "placementAmount" DECIMAL(65,30),
    "outstandingAmount" DECIMAL(65,30),
    "sector" TEXT,

    CONSTRAINT "Bond_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for Bond
CREATE UNIQUE INDEX "Bond_isin_key" ON "Bond"("isin");

-- CreateTable: BondRating
CREATE TABLE "BondRating" (
    "id" SERIAL NOT NULL,
    "bondId" INTEGER NOT NULL,
    "agency" TEXT NOT NULL,
    "rating" TEXT,
    "scale" TEXT,
    "date" TIMESTAMP(3),

    CONSTRAINT "BondRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CashFlow
CREATE TABLE "CashFlow" (
    "id" SERIAL NOT NULL,
    "bondId" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL, -- e.g., COUPON, REDEMPTION
    "amount" DECIMAL(65,30) NOT NULL,
    "couponRate" DECIMAL(65,30),

    CONSTRAINT "CashFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Auction
CREATE TABLE "Auction" (
    "id" SERIAL NOT NULL,
    "bondId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dealType" TEXT, -- e.g., PLACEMENT, BUY-BACK
    "status" TEXT,
    "offerAmount" DECIMAL(65,30),
    "bidsAmount" DECIMAL(65,30),
    "settlementDate" TIMESTAMP(3),
    "duration" TEXT,
    "cutOffPriceYield" TEXT, -- Stored as text since it includes % and yield info
    "weightedAveragePriceYield" TEXT,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FinancialIdentifier
CREATE TABLE "FinancialIdentifier" (
    "id" SERIAL NOT NULL,
    "bondId" INTEGER NOT NULL,
    "type" TEXT NOT NULL, -- e.g., CFI, FIGI, Ticker
    "value" TEXT NOT NULL,

    CONSTRAINT "FinancialIdentifier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey constraints
ALTER TABLE "BondRating" ADD CONSTRAINT "BondRating_bondId_fkey" FOREIGN KEY ("bondId") REFERENCES "Bond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_bondId_fkey" FOREIGN KEY ("bondId") REFERENCES "Bond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Auction" ADD CONSTRAINT "Auction_bondId_fkey" FOREIGN KEY ("bondId") REFERENCES "Bond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialIdentifier" ADD CONSTRAINT "FinancialIdentifier_bondId_fkey" FOREIGN KEY ("bondId") REFERENCES "Bond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Optional: Add indexes for foreign keys
CREATE INDEX "BondRating_bondId_idx" ON "BondRating"("bondId");
CREATE INDEX "CashFlow_bondId_idx" ON "CashFlow"("bondId");
CREATE INDEX "Auction_bondId_idx" ON "Auction"("bondId");
CREATE INDEX "FinancialIdentifier_bondId_idx" ON "FinancialIdentifier"("bondId");
CREATE INDEX "FinancialIdentifier_type_value_idx" ON "FinancialIdentifier"("type", "value");
CREATE INDEX "Bond_issuerName_idx" ON "Bond"("issuerName");
CREATE INDEX "Bond_maturityDate_idx" ON "Bond"("maturityDate");
CREATE INDEX "Bond_countryOfRisk_idx" ON "Bond"("countryOfRisk");
CREATE INDEX "Bond_status_idx" ON "Bond"("status");
CREATE INDEX "CashFlow_paymentDate_idx" ON "CashFlow"("paymentDate");
CREATE INDEX "Auction_date_idx" ON "Auction"("date");