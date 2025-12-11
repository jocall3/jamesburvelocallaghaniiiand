import { LoanOptimizer } from '../../main/LoanOptimizer';
import { 
    BalanceTransferEligibilityDetails, 
    PaymentPlans,
    BtDisbursementOptions 
} from '../../types/openapi-generated';

/**
 * Unit tests for LoanOptimizer module.
 * Verifies logic for selecting best balance transfer offers, calculating savings,
 * and validating eligibility constraints based on the Account Balance Transfer API specs.
 */
describe('LoanOptimizer', () => {
    let optimizer: LoanOptimizer;

    // Helper to create mock payment plans
    const createMockPlan = (
        tenor: number, 
        apr: number, 
        feeType: 'PERCENTAGE' | 'FIXED_AMOUNT', 
        feeValue: number
    ): PaymentPlans => ({
        tenor,
        effectiveInterestRate: apr,
        annualPercentageRate: apr,
        oneTimeProcessingFeeIndicator: feeType,
        oneTimeProcessingFeePercentage: feeType === 'PERCENTAGE' ? feeValue : 0,
        oneTimeProcessingFeeAmount: feeType === 'FIXED_AMOUNT' ? feeValue : 0
    });

    // Helper to create mock eligibility details
    const createMockEligibility = (
        maxAmount: number, 
        minAmount: number, 
        plans: PaymentPlans[]
    ): BalanceTransferEligibilityDetails => ({
        accountId: 'enc_account_id_12345',
        displayAccountNumber: 'XXXXXXXX1234',
        btSupportedAccountGroup: 'CREDITCARD',
        maximumEligibleLoanAmount: maxAmount,
        minimumEligibleLoanAmount: minAmount,
        btDisbursementOptions: [{ btDisbursementOption: 'LOAN_PAYMENT' }],
        paymentPlans: plans
    });

    beforeEach(() => {
        optimizer = new LoanOptimizer();
    });

    describe('findBestBalanceTransferOffer', () => {
        it('should return null when the requested amount is greater than maximum eligible amount', () => {
            const requestedAmount = 25000;
            const currentApr = 20.0;
            const mockDetails = createMockEligibility(20000, 1000, [
                createMockPlan(12, 5.0, 'PERCENTAGE', 3.0)
            ]);

            const result = optimizer.findBestBalanceTransferOffer(requestedAmount, currentApr, [mockDetails]);

            expect(result).toBeNull();
        });

        it('should return null when the requested amount is less than minimum eligible amount', () => {
            const requestedAmount = 500;
            const currentApr = 20.0;
            const mockDetails = createMockEligibility(20000, 1000, [
                createMockPlan(12, 5.0, 'PERCENTAGE', 3.0)
            ]);

            const result = optimizer.findBestBalanceTransferOffer(requestedAmount, currentApr, [mockDetails]);

            expect(result).toBeNull();
        });

        it('should return null when no payment plans are provided', () => {
            const mockDetails = createMockEligibility(20000, 1000, []);
            const result = optimizer.findBestBalanceTransferOffer(5000, 20.0, [mockDetails]);
            expect(result).toBeNull();
        });

        it('should select the plan that offers maximum savings', () => {
            const requestedAmount = 10000;
            const currentApr = 24.0; // High interest debt

            // Plan A: 12% APR, 12 months, 0 fee (Moderate interest)
            const planA = createMockPlan(12, 12.0, 'PERCENTAGE', 0);
            
            // Plan B: 0% APR, 12 months, 3% fee ($300 upfront)
            // Savings Analysis:
            // Current (24%): ~ $2,400 annual interest (simplified)
            // Plan A (12%): ~ $1,200 annual interest -> Savings ~ $1,200
            // Plan B (0% + 3% fee): $300 total cost -> Savings ~ $2,100
            const planB = createMockPlan(12, 0.0, 'PERCENTAGE', 3.0);

            // Plan C: 18% APR, 12 months, 0 fee (Low savings)
            const planC = createMockPlan(12, 18.0, 'PERCENTAGE', 0);

            const mockDetails = createMockEligibility(20000, 1000, [planA, planB, planC]);

            const result = optimizer.findBestBalanceTransferOffer(requestedAmount, currentApr, [mockDetails]);

            expect(result).not.toBeNull();
            expect(result?.selectedPlan).toEqual(planB);
            expect(result?.savingsAmount).toBeGreaterThan(1500); // Expect significant savings
        });

        it('should compare offers across multiple eligibility sources (multiple accounts)', () => {
            const requestedAmount = 5000;
            const currentApr = 20.0;

            // Account 1 has a mediocre offer
            const details1 = createMockEligibility(10000, 500, [
                createMockPlan(12, 10.0, 'PERCENTAGE', 4.0)
            ]);

            // Account 2 has a great offer
            const details2 = createMockEligibility(10000, 500, [
                createMockPlan(12, 5.0, 'FIXED_AMOUNT', 50.0)
            ]);

            const result = optimizer.findBestBalanceTransferOffer(requestedAmount, currentApr, [details1, details2]);

            expect(result?.selectedPlan.annualPercentageRate).toBe(5.0);
            expect(result?.sourceAccountId).toBe(details2.accountId);
        });
    });

    describe('calculateProjectedSavings', () => {
        it('should correctly calculate savings with Percentage based fees', () => {
            // Debt: $10,000, Current APR: 20%, Term: 12mo
            // Estimated Current Interest Cost: $2,000 (Simplified Simple Interest for Test)
            
            // Offer: 10% APR, 3% Fee ($300)
            // Estimated New Cost: Interest ($1,000) + Fee ($300) = $1,300
            
            // Expected Savings: $700
            const plan = createMockPlan(12, 10.0, 'PERCENTAGE', 3.0);
            
            const savings = optimizer.calculateProjectedSavings(10000, 20.0, plan);
            
            // Allowing slight variance depending on if exact amortization or simple interest is used
            expect(savings).toBeCloseTo(700, -2); 
        });

        it('should correctly calculate savings with Fixed Amount fees', () => {
            // Debt: $5,000, Current APR: 20%, Term: 12mo
            // Estimated Current Interest Cost: $1,000
            
            // Offer: 5% APR, $50 Fee
            // Estimated New Cost: Interest ($250) + Fee ($50) = $300
            
            // Expected Savings: $700
            const plan = createMockPlan(12, 5.0, 'FIXED_AMOUNT', 50.0);
            
            const savings = optimizer.calculateProjectedSavings(5000, 20.0, plan);
            
            expect(savings).toBeCloseTo(700, -2);
        });

        it('should return negative savings if the offer is more expensive than current debt', () => {
            const debt = 10000;
            const currentApr = 5.0; // Very low rate currently
            
            // Offer: 20% APR (High rate)
            const badPlan = createMockPlan(12, 20.0, 'PERCENTAGE', 0);
            
            const savings = optimizer.calculateProjectedSavings(debt, currentApr, badPlan);
            
            expect(savings).toBeLessThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle floating point precision in amounts', () => {
            const requestedAmount = 1000.55;
            const currentApr = 15.5;
            const details = createMockEligibility(2000.00, 100.00, [
                createMockPlan(6, 5.5, 'PERCENTAGE', 1.5)
            ]);

            const result = optimizer.findBestBalanceTransferOffer(requestedAmount, currentApr, [details]);
            expect(result).not.toBeNull();
            expect(result?.savingsAmount).not.toBeNaN();
        });

        it('should ignore plans with undefined or missing critical fields', () => {
            const invalidPlan = {} as PaymentPlans; // Missing APR, Tenor, etc.
            const validPlan = createMockPlan(12, 10.0, 'PERCENTAGE', 0);
            
            const details = createMockEligibility(10000, 100, [invalidPlan, validPlan]);
            
            const result = optimizer.findBestBalanceTransferOffer(1000, 20.0, [details]);
            
            // Should select valid plan and not crash
            expect(result?.selectedPlan).toEqual(validPlan);
        });
    });
});