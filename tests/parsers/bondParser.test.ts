```typescript
import { parseBond } from '../../src/parsers/bondParser';
import { Bond } from '../../src/models/Bond';

describe('bondParser', () => {
  it('should parse the bond details correctly', () => {
    const rawText = `
        Domestic bonds: USA, CMB 21dec2021 4m
        US912796P781

        Zero-coupon bonds, Senior Unsecured

        JCRA *** -
        Scope *** -
        ISSUER ISSUE

        STATUS
        Matured

        AMOUNT
        68,759,029,200 USD

        PLACEMENT
        ***

        REDEMPTION (PUT/CALL OPTION)
        *** (-)

        ACI on
        No data

        COUNTRY OF RISK
        USA

        CURRENT COUPON
        -

        PRICE
        -

        YIELD / DURATION
        -

        Calculator

        Bond is not traded; the issue is redeemed
        Trading chart
        FedInvest 1/2

        Latest data on 17/12/2021
        All trading parameters are available in table mode

        in absolute values

        18/09/2021 18/12/2021

        1M 3M 1Y 3Y

        P Y Map

        from to

        Archive

        Stock exchange and OTC quotes

        Issuer USA
        Full borrower / issuer name USA
        Sector Sovereign
        Profile
        The United States of America is a country in North America. It consists of 50 states and a federal district. The biggest sector of the US economy is the retail industry. The U.S bond market is ...
        Show more

        Volume
        Placement amount 68,759,029,200 USD
        Outstanding amount 68,759,029,200 USD
        Nominal
        Nominal 100 USD
        Outstanding face value *** USD
        Integral multiple *** USD
        Issue information

        Reference rate ***
        Coupon Rate ***
        Cash flow parameters

        Day count fraction ***
        Business Day Convention Following Business Day
        Interest Accrual Date ***
        Payment currency ***
        Maturity date ***

        Placement method Open subscription
        Placement type Public
        Placement *** - ***
        Initial issue amount *** USD
        Initial issue price (yield) (***%)
        Bids *** USD
        Geographic breakdown ***
        Placement
        Export to Excel
        Cash flow
        No END OF COUPON PERIOD COUPON, % COUPON PAYMENT AMOUNT, USD REDEMPTION, USD ACTUAL PAYMENT
        1 *** *** *** *** *** ***
        No END OF COUPON PERIOD
        1 ***

        ***
        Early redemption terms

        Auctions and additional placements
        No DATE DEAL TYPE STATUS OFFER, M BIDS, M PLACEMENT / BUY-BACK, M SETTLEMENT DURATION CUT-OFF PRICE (YIELD), % WEIGHTED AVERAGE PRICE (YIELD), %
        1 2023 *** *** *** *** *** *** ***
        2 2023 *** *** *** *** *** *** ***
        3 2023 *** *** *** *** *** *** ***
        No DATE
        1 2023
        2 2023
        3 2023

        Investor breakdown ***

        Conversion terms ***
        Conversion and exchange

        ***
        Additional information

        Latest issues
        ISSUE
        USA, Bonds 3.875%
        15may2043, USD
        USA, Bills 0% 19sep2023, USD
        (119D)
        USA, Bills 0% 16may2024,
        USD (364D)
        USA, Bills 0% 16nov2023, USD
        (182D)
        USA, Bonds 3.625%
        15may2053, USD
        USA, Bills 0% 12sep2023, USD
        (119D)
        USA, Notes 3.375%
        15may2033, USD (C-2033)
        USA, Notes 3.625%
        15may2026, USD (AN-2026)
        USA, Bills 0% 9nov2023, USD
        (182D)
        USA, Bills 0% 5sep2023, USD
        (119D)

        VOLUME, MLN
        ***
        ***
        ***
        ***
        ***
        ***
        ***
        ***
        ***
        ***

        18/05/2023 US Treasury Securities
        17/05/2023 US Treasury Securities
        16/05/2023 US Treasury Securities
        15/05/2023 US Treasury Securities
        11/05/2023 US Treasury Securities

        News

        All organization news
        Related entities
        In which the company has interests
        RELATED EMITENT
        ***
        SHARE OF COMMON SHARESHARE IN THE AUTHORIZED CAPITAL
        ***

        1 2 3 ... 233 »
        Show all

        ISIN ***
        CUSIP ***
        CUSIP 144A ***
        CFI DBZTFR
        FIGI BBG0125BL947
        Ticker B 0 12/21/21
        Type of security by CBR ***
        Identifiers

        Current History

        Issuer ratings

        Show more
        AGENCY RATING / FORECAST SCALE DATE
        DBRS Limited *** Long-Term Foreign Currency -
        Issuer Rating

        ***
        DBRS Limited *** Long-Term Local Currency -
        Issuer Rating

        ***
        Japan Credit Rating Agency *** Foreign Currency Long-term
        Issuer Rating

        ***
        Japan Credit Rating Agency *** Local Currency Long-term
        Issuer Rating

        ***
        RAEX-Europe *** Rating scale of the country
        credit environment (CCE)
        rating - Foreign currency
        ***

        AGENCY
        DBRS Limited
        DBRS Limited
        Japan Credit Rating Agency
        Japan Credit Rating Agency
        RAEX-Europe
        Ratings

        Show withdrawn ratings

        Zero-coupon bonds
        Senior Unsecured
        Registered
        CMB

        Show more
        Bond classification

        ***`;

    const expectedBond: Partial<Bond> = {
      name: 'USA, CMB 21dec2021 4m',
      isin: '***',
      cusip: '***',
      issuer: 'USA',
      amount: '68,759,029,200 USD',
      maturityDate: '21dec2021',
      type: 'Zero-coupon bonds',
      status: 'Matured'
    };


    const bond = parseBond(rawText);
    expect(bond).toBeDefined();
    expect(bond?.name).toEqual(expectedBond.name);
    expect(bond?.isin).toEqual(expectedBond.isin);
    expect(bond?.cusip).toEqual(expectedBond.cusip);
    expect(bond?.issuer).toEqual(expectedBond.issuer);
    expect(bond?.amount).toEqual(expectedBond.amount);
    expect(bond?.maturityDate).toEqual(expectedBond.maturityDate);
    expect(bond?.type).toEqual(expectedBond.type);
    expect(bond?.status).toEqual(expectedBond.status);
  });
});
```