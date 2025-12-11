```typescript
interface BondDetails {
  isin?: string;
  cusip?: string;
  maturityDate?: string;
  couponRate?: string;
  issuer?: string;
  amount?: string;
  countryOfRisk?: string;
}

export const parseBondText = (text: string): BondDetails => {
  const bondDetails: BondDetails = {};

  // ISIN
  const isinMatch = text.match(/ISIN\s(\S+)/);
  if (isinMatch && isinMatch[1] !== '***') {
    bondDetails.isin = isinMatch[1];
  }

  // CUSIP
  const cusipMatch = text.match(/CUSIP\s(\S+)/);
  if (cusipMatch && cusipMatch[1] !== '***') {
    bondDetails.cusip = cusipMatch[1];
  }

  // Maturity Date
  const maturityDateMatch = text.match(/Maturity date\s(.+)/);
  if (maturityDateMatch && maturityDateMatch[1] !== '***') {
    bondDetails.maturityDate = maturityDateMatch[1].trim();
  }

    // Coupon Rate
    const couponRateMatch = text.match(/Coupon Rate\s(.+)/);
    if (couponRateMatch && couponRateMatch[1] !== '***') {
        bondDetails.couponRate = couponRateMatch[1].trim();
    } else {
        const currentCouponMatch = text.match(/CURRENT COUPON\s(.+)/);
        if(currentCouponMatch && currentCouponMatch[1] !== '-') {
          bondDetails.couponRate = currentCouponMatch[1].trim();
        }
    }

    // Issuer
    const issuerMatch = text.match(/Issuer\s(.+)/);
    if (issuerMatch) {
        bondDetails.issuer = issuerMatch[1].trim();
    } else {
      const fullIssuerMatch = text.match(/Full borrower \/ issuer name\s(.+)/);
      if(fullIssuerMatch){
          bondDetails.issuer = fullIssuerMatch[1].trim();
      }
    }

    // Amount
    const amountMatch = text.match(/AMOUNT\s(.+)\sUSD/);
    if (amountMatch) {
        bondDetails.amount = amountMatch[1].trim() + ' USD';
    } else {
      const placementAmountMatch = text.match(/Placement amount\s(.+)\sUSD/);
      if(placementAmountMatch)
      {
        bondDetails.amount = placementAmountMatch[1].trim() + ' USD';
      }
    }

    // Country of Risk
    const countryMatch = text.match(/COUNTRY OF RISK\s(.+)/);
    if (countryMatch) {
        bondDetails.countryOfRisk = countryMatch[1].trim();
    }

  return bondDetails;
};
```