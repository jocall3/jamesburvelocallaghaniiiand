interface BondIdentifier {
    isin?: string;
    cusip?: string;
    cusip144a?: string;
    cfi?: string;
    figi?: string;
    ticker?: string;
    securityTypeByCbr?: string;
}

interface CashFlowPeriod {
    number: number;
    endDate: string; // ISO Date string
    couponPercent?: number | null;
    couponPaymentAmount?: number | null;
    redemptionAmount?: number | null;
    actualPayment?: string; // Descriptive text or status
}

interface Rating {
    agency: string;
    rating: string;
    forecast?: string;
    scale: string;
    date: string; // ISO Date string
}

interface Issuer {
    name: string;
    sector: string;
    profile: string; // Detailed description
    relatedEntities?: {
        entity: string;
        shareOfCommonShare?: string;
        shareInAuthorizedCapital?: string;
    }[];
}

interface PlacementInfo {
    method?: string;
    type?: string; // Public/Private
    period?: string; // Start date - End date (e.g., "*** - ***")
    initialIssueAmount?: number;
    initialIssuePriceYield?: string; // e.g., "(***%)"
    bids?: number;
    geographicBreakdown?: string;
}

interface BondDetails {
    // Core Identification
    name: string; // e.g., "Domestic bonds: USA, CMB 21dec2021 4m"
    isin: string; // Primary identifier, repeated for convenience
    status: 'Matured' | 'Active' | 'Redeemed' | string;
    securityType: string[]; // e.g., ["Zero-coupon bonds", "Senior Unsecured", "Registered", "CMB"]

    // Financial Overview
    amount: number; // Placement amount
    currency: string; // e.g., USD
    nominal: number;
    outstandingAmount: number;
    countryOfRisk: string;

    // Trading & Market Data (Snapshot)
    currentCoupon?: number | null;
    price?: number | null;
    yieldDuration?: string | null;
    aciOn?: string | null; // Accrued interest details
    latestDataDate?: string; // ISO Date string for the data snapshot

    // Issue Information
    referenceRate?: string;
    couponRate?: string;
    maturityDate?: string; // ISO Date string
    placementInfo: PlacementInfo;

    // Cash Flow Parameters
    dayCountFraction?: string;
    businessDayConvention?: string;
    interestAccrualDate?: string; // ISO Date string
    paymentCurrency?: string;

    // Optional Features/Terms
    redemptionOption?: string; // PUT/CALL option details
    earlyRedemptionTerms?: string;
    conversionTerms?: string;

    // Data Tables
    cashFlows: CashFlowPeriod[];
    auctions?: {
        date: string; // ISO Date string
        dealType: string;
        status: string;
        offerMln: number | null;
        bidsMln: number | null;
        placementBuyBackMln: number | null;
        settlementDuration: string;
        cutOffPriceYield: string;
        weightedAveragePriceYield: string;
    }[];
}

interface Bond {
    identifiers: BondIdentifier;
    details: BondDetails;
    issuer: Issuer;
    ratings: Rating[];
}

export {
    Bond,
    Issuer,
    Rating,
    BondIdentifier,
    BondDetails,
    CashFlowPeriod,
    PlacementInfo,
};