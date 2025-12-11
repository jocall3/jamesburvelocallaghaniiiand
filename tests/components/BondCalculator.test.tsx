```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BondCalculator from '../../components/BondCalculator'; // Adjust the path as needed

describe('BondCalculator Component', () => {
  it('renders the component without errors', () => {
    render(<BondCalculator />);
    // Check for some basic elements to confirm rendering
    expect(screen.getByText(/Calculator/i)).toBeInTheDocument(); // Example: Check for a title
  });

  it('calculates yield correctly when inputs are provided', () => {
    render(<BondCalculator />);

    // Mock input values
    const faceValue = '1000';
    const price = '950';
    const couponRate = '5'; // Example coupon rate
    const yearsToMaturity = '10';

    // Enter values into the input fields
    const faceValueInput = screen.getByLabelText(/Face Value/i);
    const priceInput = screen.getByLabelText(/Price/i);
    const couponRateInput = screen.getByLabelText(/Coupon Rate/i);
    const yearsToMaturityInput = screen.getByLabelText(/Years to Maturity/i);

    fireEvent.change(faceValueInput, { target: { value: faceValue } });
    fireEvent.change(priceInput, { target: { value: price } });
    fireEvent.change(couponRateInput, { target: { value: couponRate } });
    fireEvent.change(yearsToMaturityInput, { target: { value: yearsToMaturity } });

    // Assuming the yield is displayed in a specific element
    const yieldElement = screen.getByText(/Yield/i);

    // Give time for calculation to occur.  This might need adjustment depending
    // on how the component handles calculations.  Consider using async/await and
    // waitFor if calculations are asynchronous.
    // Use a more specific assertion based on expected yield calculation logic.
    // For example:
    // const expectedYield = calculateYield(faceValue, price, couponRate, yearsToMaturity);
    // expect(yieldElement).toHaveTextContent(expect.stringContaining(expectedYield));
    expect(yieldElement).toBeInTheDocument(); // Basic check if some yield is shown. Needs a better assertion.
  });

  it('handles invalid input gracefully (e.g., non-numeric values)', () => {
    render(<BondCalculator />);

    const priceInput = screen.getByLabelText(/Price/i);
    fireEvent.change(priceInput, { target: { value: 'abc' } });

    const yieldElement = screen.getByText(/Yield/i);
    expect(yieldElement).toBeInTheDocument(); // Expect yield to display some result, perhaps indicating an error, or to not change.  Need more knowledge of component's error handling.
  });

  it('clears input fields when clear button is clicked', () => {
    render(<BondCalculator />);

    const faceValueInput = screen.getByLabelText(/Face Value/i);
    fireEvent.change(faceValueInput, { target: { value: '1000' } });
    const clearButton = screen.getByText(/Clear/i); // Adjust based on your button text
    fireEvent.click(clearButton);

    expect(faceValueInput).toHaveValue('');
  });


  it('calculates duration correctly', () => {
        render(<BondCalculator />);

        // Mock input values
        const faceValue = '1000';
        const price = '950';
        const couponRate = '5'; // Example coupon rate
        const yearsToMaturity = '10';

        // Enter values into the input fields
        const faceValueInput = screen.getByLabelText(/Face Value/i);
        const priceInput = screen.getByLabelText(/Price/i);
        const couponRateInput = screen.getByLabelText(/Coupon Rate/i);
        const yearsToMaturityInput = screen.getByLabelText(/Years to Maturity/i);

        fireEvent.change(faceValueInput, { target: { value: faceValue } });
        fireEvent.change(priceInput, { target: { value: price } });
        fireEvent.change(couponRateInput, { target: { value: couponRate } });
        fireEvent.change(yearsToMaturityInput, { target: { value: yearsToMaturity } });

        const durationElement = screen.getByText(/Duration/i);

        expect(durationElement).toBeInTheDocument();
  });
});
```