```typescript
import { BigNumber } from 'ethers';

interface NFTAsset {
  contractAddress: string;
  tokenId: BigNumber;
  estimatedValue: BigNumber; // USD value based on floor price or traits
  rarityScore?: number; // Optional rarity score, higher is rarer
}

interface LoanParameters {
  loanToValue: number; // Percentage of NFT value offered as loan
  interestRate: number; // Annual interest rate
  loanDuration: number; // Loan duration in days
}

interface LiquidityAssessment {
  liquidationPotential: BigNumber; // Amount recoverable through liquidation
  timeToLiquidation: number; // Estimated time in days to liquidate NFT
}

class NFTLoanAssessor {

  constructor() {
    // Can potentially load external data sources or models here
  }

  /**
   * Assesses the borrowing power of an NFT asset.
   * @param nftAsset The NFT asset to assess.
   * @param loanParams Desired loan parameters.
   * @returns The maximum loan amount based on the NFT asset's value and the loan-to-value ratio, or null if the asset cannot be used as collateral.
   */
  assessBorrowingPower(nftAsset: NFTAsset, loanParams: LoanParameters): BigNumber | null {
    if (!this.isEligibleForLoan(nftAsset)) {
      return null;
    }

    const loanAmount = nftAsset.estimatedValue.mul(loanParams.loanToValue).div(100); // Assuming loanToValue is a percentage

    // Ensure loanAmount is within reasonable bounds (e.g., not exceeding max supply or liquidity)
    return loanAmount;
  }

  /**
   * Basic eligibility check for an NFT asset.  Can be expanded.
   * @param nftAsset The NFT asset to check.
   * @returns True if the asset is eligible, false otherwise.
   */
  isEligibleForLoan(nftAsset: NFTAsset): boolean {
    // Add any necessary checks here
    // Example: Check if the NFT is on a supported collection
    const supportedCollections = ['0xContractAddress1', '0xContractAddress2'];
    if (!supportedCollections.includes(nftAsset.contractAddress)) {
      return false;
    }

    // Example: Check for specific traits or rarity scores
    if (nftAsset.rarityScore && nftAsset.rarityScore < 50) {
      return false;
    }

    return true;
  }


  /**
   * Assesses the liquidity potential of an NFT asset.
   * @param nftAsset The NFT asset to assess.
   * @returns Liquidation potential and estimated time to liquidate.
   */
  assessLiquidityPotential(nftAsset: NFTAsset): LiquidityAssessment {
    // Implement logic to estimate the liquidation potential
    // Factors to consider:
    // - Trading volume of the collection
    // - Rarity of the NFT
    // - Market conditions
    // - Order book depth

    const liquidationPotential = nftAsset.estimatedValue.mul(80).div(100); // Assume 80% can be recovered
    const timeToLiquidation = 7; // Assume 7 days to liquidate

    return {
      liquidationPotential,
      timeToLiquidation,
    };
  }

  /**
   *  Calculates total borrowing power from a portfolio of NFT assets.
   * @param nftAssets Array of NFT assets.
   * @param loanParams Desired loan parameters.
   * @returns Total borrowing power
   */
  calculatePortfolioBorrowingPower(nftAssets: NFTAsset[], loanParams: LoanParameters): BigNumber {
    let totalBorrowingPower = BigNumber.from(0);

    for (const nftAsset of nftAssets) {
      const borrowingPower = this.assessBorrowingPower(nftAsset, loanParams);
      if (borrowingPower) {
        totalBorrowingPower = totalBorrowingPower.add(borrowingPower);
      }
    }

    return totalBorrowingPower;
  }
}

export { NFTLoanAssessor, NFTAsset, LoanParameters, LiquidityAssessment };
```