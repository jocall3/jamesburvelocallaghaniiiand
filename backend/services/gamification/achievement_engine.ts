```typescript
import { User } from "../../models/user";
import { FinancialTransaction } from "../../models/financial_transaction";
import { GovernanceToken } from "../../models/governance_token";
import { Badge } from "../../models/badge";
import { EarnedBadge } from "../../models/earned_badge";
import { EarnedGovernanceToken } from "../../models/earned_governance_token";

// Define the achievement engine class
export class AchievementEngine {

    // Method to process a financial transaction and check for achievements
    public async processTransaction(user: User, transaction: FinancialTransaction): Promise<void> {
        // 1. Check for deposit-related achievements
        await this.checkDepositAchievements(user, transaction);

        // 2. Check for investment-related achievements
        await this.checkInvestmentAchievements(user, transaction);

        // 3. Check for savings-related achievements
        await this.checkSavingsAchievements(user, transaction);
    }

    // Private method to check for deposit-related achievements
    private async checkDepositAchievements(user: User, transaction: FinancialTransaction): Promise<void> {
        if (transaction.type === 'deposit') {
            // Example: First Deposit Badge
            const firstDepositBadge = await Badge.findOne({ where: { name: 'First Deposit' } });
            if (firstDepositBadge && !(await EarnedBadge.findOne({ where: { userId: user.id, badgeId: firstDepositBadge.id } }))) {
                await EarnedBadge.create({ userId: user.id, badgeId: firstDepositBadge.id });
                console.log(`User ${user.username} earned the 'First Deposit' badge!`);
            }

            // Example: Deposit over $100
            if (transaction.amount > 100) {
                const depositOver100Badge = await Badge.findOne({ where: { name: 'Deposit Over $100' } });
                if (depositOver100Badge && !(await EarnedBadge.findOne({ where: { userId: user.id, badgeId: depositOver100Badge.id } }))) {
                    await EarnedBadge.create({ userId: user.id, badgeId: depositOver100Badge.id });
                    console.log(`User ${user.username} earned the 'Deposit Over $100' badge!`);
                }
            }
        }
    }

    // Private method to check for investment-related achievements
    private async checkInvestmentAchievements(user: User, transaction: FinancialTransaction): Promise<void> {
         if (transaction.type === 'investment') {
            // Example: First Investment Governance Token
            const firstInvestmentToken = await GovernanceToken.findOne({ where: { name: 'First Investment Token' } });
            if (firstInvestmentToken && !(await EarnedGovernanceToken.findOne({ where: { userId: user.id, governanceTokenId: firstInvestmentToken.id } }))) {
                await EarnedGovernanceToken.create({ userId: user.id, governanceTokenId: firstInvestmentToken.id });
                console.log(`User ${user.username} earned the 'First Investment Token'!`);
            }

            // Example: Investment over $500
            if (transaction.amount > 500) {
                 const investmentOver500Token = await GovernanceToken.findOne({ where: { name: 'Investment Over $500 Token' } });
                if (investmentOver500Token && !(await EarnedGovernanceToken.findOne({ where: { userId: user.id, governanceTokenId: investmentOver500Token.id } }))) {
                    await EarnedGovernanceToken.create({ userId: user.id, governanceTokenId: investmentOver500Token.id });
                    console.log(`User ${user.username} earned the 'Investment Over $500 Token'!`);
                }
            }
         }
    }

    // Private method to check for savings-related achievements
    private async checkSavingsAchievements(user: User, transaction: FinancialTransaction): Promise<void> {
        if (transaction.type === 'savings') {
            //Example: Reached $1000 Savings Badge
             const savings1000Badge = await Badge.findOne({ where: { name: 'Savings $1000 Badge' } });

             const totalSavings = await FinancialTransaction.sum('amount', {
                where: {
                    userId: user.id,
                    type: 'savings'
                }
            });

             if (savings1000Badge && totalSavings && totalSavings >= 1000 && !(await EarnedBadge.findOne({ where: { userId: user.id, badgeId: savings1000Badge.id } }))) {
                    await EarnedBadge.create({ userId: user.id, badgeId: savings1000Badge.id });
                    console.log(`User ${user.username} earned the 'Savings $1000 Badge'!`);
                }
        }
    }
}
```