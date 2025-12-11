```typescript
import { calculateDuration, calculateConvexity } from '../../src/financial/duration';
import { BondParams } from '../../src/financial/bond';

describe('Duration and Convexity Calculations', () => {

  it('should calculate duration correctly for a simple bond', () => {
    const bond: BondParams = {
      faceValue: 1000,
      couponRate: 0.05,
      yield: 0.06,
      maturity: 5,
      frequency: 2,
    };

    const duration = calculateDuration(bond);
    // Expected result based on standard duration formula, approximately
    const expectedDuration = 4.465;
    expect(duration).toBeCloseTo(expectedDuration, 2);
  });

  it('should calculate convexity correctly for a simple bond', () => {
    const bond: BondParams = {
      faceValue: 1000,
      couponRate: 0.05,
      yield: 0.06,
      maturity: 5,
      frequency: 2,
    };

    const convexity = calculateConvexity(bond);
    // Expected result based on standard convexity formula, approximately
    const expectedConvexity = 22.843;
    expect(convexity).toBeCloseTo(expectedConvexity, 2);
  });

  it('should handle zero coupon bonds correctly for duration', () => {
    const bond: BondParams = {
      faceValue: 1000,
      couponRate: 0,
      yield: 0.06,
      maturity: 5,
      frequency: 1,
    };

    const duration = calculateDuration(bond);
    expect(duration).toBeCloseTo(5, 2); // Duration should equal time to maturity
  });


  it('should handle zero coupon bonds correctly for convexity', () => {
    const bond: BondParams = {
      faceValue: 1000,
      couponRate: 0,
      yield: 0.06,
      maturity: 5,
      frequency: 1,
    };

    const convexity = calculateConvexity(bond);
    expect(convexity).toBeCloseTo(25, 2); // Convexity should be close to T^2 + T where T is maturity.
  });

  it('should handle different frequencies correctly for duration', () => {
    const bond: BondParams = {
      faceValue: 1000,
      couponRate: 0.08,
      yield: 0.08,
      maturity: 3,
      frequency: 4,
    };
    const duration = calculateDuration(bond);
    const expectedDuration = 2.802;
    expect(duration).toBeCloseTo(expectedDuration, 2);
  });

  it('should handle different frequencies correctly for convexity', () => {
    const bond: BondParams = {
      faceValue: 1000,
      couponRate: 0.08,
      yield: 0.08,
      maturity: 3,
      frequency: 4,
    };

    const convexity = calculateConvexity(bond);
     const expectedConvexity = 8.877;
    expect(convexity).toBeCloseTo(expectedConvexity, 2);
  });
  it('should handle a bond with a high yield', () => {
        const bond: BondParams = {
            faceValue: 1000,
            couponRate: 0.10,
            yield: 0.15,
            maturity: 10,
            frequency: 2,
        };

        const duration = calculateDuration(bond);
        const expectedDuration = 5.75;
        expect(duration).toBeCloseTo(expectedDuration, 2);

        const convexity = calculateConvexity(bond);
        const expectedConvexity = 45.42;
        expect(convexity).toBeCloseTo(expectedConvexity, 2);
    });
    it('should handle a bond with a low yield', () => {
        const bond: BondParams = {
            faceValue: 1000,
            couponRate: 0.05,
            yield: 0.01,
            maturity: 10,
            frequency: 2,
        };

        const duration = calculateDuration(bond);
        const expectedDuration = 9.47;
        expect(duration).toBeCloseTo(expectedDuration, 2);

        const convexity = calculateConvexity(bond);
        const expectedConvexity = 111.96;
        expect(convexity).toBeCloseTo(expectedConvexity, 2);
    });

    it('should handle a bond with a short maturity', () => {
        const bond: BondParams = {
            faceValue: 1000,
            couponRate: 0.05,
            yield: 0.05,
            maturity: 1,
            frequency: 2,
        };

        const duration = calculateDuration(bond);
        const expectedDuration = 0.975;
        expect(duration).toBeCloseTo(expectedDuration, 2);

        const convexity = calculateConvexity(bond);
        const expectedConvexity = 0.951;
        expect(convexity).toBeCloseTo(expectedConvexity, 2);
    });
});
```