import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Data extracted from the prompt
const BOND_DETAILS = {
    // Identifier details
    name: "Domestic bonds: USA, CMB 21dec2021 4m",
    isin: "US912796P781",
    ticker: "B 0 12/21/21",

    // Classification
    status: "Matured",
    typeClassification: "Zero-coupon bonds, Senior Unsecured",
    countryOfRisk: "USA",
    
    // Financial details
    issueAmountUsd: 68759029200, // 68,759,029,200 USD (Using standard JS number, assuming BigInt support in schema if necessary)
    nominalUsd: 100.00,
    
    // Dates and conventions
    maturityDate: new Date('2021-12-21T00:00:00.000Z'),
    businessDayConvention: 'Following Business Day',
    
    // Placement details
    placementMethod: 'Open subscription',
    placementType: 'Public',
};

const ISSUER_DETAILS = {
    name: 'USA',
    sector: 'Sovereign',
    profile: 'The United States of America is a country in North America. It consists of 50 states and a federal district. The biggest sector of the US economy is the retail industry. The U.S bond market is ...',
};

async function seedBonds() {
    console.log('Starting bond seeding...');

    // 1. Seed Issuer (USA)
    const usaIssuer = await prisma.issuer.upsert({
        where: { name: ISSUER_DETAILS.name },
        update: {},
        create: ISSUER_DETAILS,
    });

    console.log(`Ensured Issuer: ${usaIssuer.name} (ID: ${usaIssuer.id})`);

    // 2. Seed the specific matured bond
    try {
        const bond = await prisma.bond.upsert({
            where: { isin: BOND_DETAILS.isin },
            update: {
                status: BOND_DETAILS.status,
                issueAmountUsd: BOND_DETAILS.issueAmountUsd,
            },
            create: {
                isin: BOND_DETAILS.isin,
                name: BOND_DETAILS.name,
                status: BOND_DETAILS.status,
                issueAmountUsd: BOND_DETAILS.issueAmountUsd,
                nominalUsd: BOND_DETAILS.nominalUsd,
                maturityDate: BOND_DETAILS.maturityDate,
                typeClassification: BOND_DETAILS.typeClassification,
                countryOfRisk: BOND_DETAILS.countryOfRisk,
                ticker: BOND_DETAILS.ticker,
                
                businessDayConvention: BOND_DETAILS.businessDayConvention,
                placementMethod: BOND_DETAILS.placementMethod,
                placementType: BOND_DETAILS.placementType,
                
                // Link to Issuer
                issuerId: usaIssuer.id,
            }
        });

        console.log(`Seeded Bond: ${bond.name} (ISIN: ${bond.isin})`);

    } catch (error) {
        console.error("Error seeding bond:", error);
    }
    
    console.log('Bond seeding complete.');
}

// Execution block
seedBonds()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });