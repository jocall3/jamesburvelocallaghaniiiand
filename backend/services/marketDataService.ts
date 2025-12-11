export interface MarketDataPoint {
  date: string; // ISO date string (e.g., "YYYY-MM-DDTHH:mm:ssZ")
  price: number | null;
  yield: number | null;
}

export interface CurrentMarketData {
  price: number | null;
  yield: number | null;
  lastUpdated: string | null; // ISO date string, indicating when data was last updated
}

export type HistoricalDataRange = "1M" | "3M" | "1Y" | "3Y" | "ALL";

class MarketDataService {
  private mockData: {
    [isin: string]: {
      current: CurrentMarketData;
      historical: MarketDataPoint[];
    };
  };

  constructor() {
    this.mockData = {
      // --- Mock data for the example bond: USA, CMB 21dec2021 4m (US912796P781) ---
      // This is a zero-coupon bond, matured on 2021-12-21.
      // Current price/yield should be null as it's not traded.
      // Historical data should reflect its zero-coupon nature approaching par at maturity.
      "US912796P781": {
        current: {
          price: null, // Matured, not traded
          yield: null, // Matured, not traded
          lastUpdated: "2021-12-17T00:00:00Z", // As per example "Latest data on 17/12/2021"
        },
        historical: this.generateZeroCouponHistoricalData(
          new Date("2020-12-17T00:00:00Z"), // Start roughly 1 year before last data date
          new Date("2021-12-17T00:00:00Z"), // End at last data date for active trading
          new Date("2021-12-21T00:00:00Z"), // Maturity Date
          100, // Nominal value
          0.007 // Starting approximate yield
        ),
      },
      // --- Example for an active bond (fictional ISIN) ---
      "US0000000001": {
        current: {
          price: 101.25,
          yield: 0.025,
          lastUpdated: new Date().toISOString(),
        },
        historical: [
          { date: "2023-01-01T00:00:00Z", price: 100.00, yield: 0.030 },
          { date: "2023-02-01T00:00:00Z", price: 100.50, yield: 0.028 },
          { date: "2023-03-01T00:00:00Z", price: 101.00, yield: 0.026 },
          { date: "2023-04-01T00:00:00Z", price: 101.25, yield: 0.025 },
          { date: "2023-05-01T00:00:00Z", price: 101.30, yield: 0.024 },
          { date: "2023-06-01T00:00:00Z", price: 101.10, yield: 0.026 },
          { date: "2023-07-01T00:00:00Z", price: 101.20, yield: 0.0255 },
          { date: new Date().toISOString(), price: 101.25, yield: 0.025 }, // Latest active data
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      },
      // Add more mock data for other bonds as needed
    };
  }

  /**
   * Helper to generate plausible historical data for a zero-coupon bond.
   * Price should approach nominal at maturity, yield should approach zero.
   */
  private generateZeroCouponHistoricalData(
    startDate: Date,
    endDate: Date, // This is the last data point desired, e.g., 2021-12-17
    maturityDate: Date,
    nominal: number,
    initialYield: number
  ): MarketDataPoint[] {
    const data: MarketDataPoint[] = [];
    const _startDate = new Date(startDate);
    const _endDate = new Date(endDate);

    let currentDate = new Date(_startDate);

    while (currentDate.getTime() <= _endDate.getTime()) {
      const daysToMaturity = Math.max(0, (maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      let currentYield = initialYield * (daysToMaturity / (365 * 3)); // Example: yield generally decreases as maturity approaches

      if (currentYield < 0) currentYield = 0;
      if (daysToMaturity < 5 && daysToMaturity > 0) currentYield *= 0.5; // Rapid drop very close to maturity
      if (daysToMaturity === 0) currentYield = 0;

      let price = nominal;
      if (daysToMaturity > 0 && currentYield > 0) {
        // Simple approximation for zero-coupon bond price: P = Nominal / (1 + YTM)^(DaysToMaturity/365.25)
        price = nominal / Math.pow(1 + currentYield, daysToMaturity / 365.25);
      } else {
        price = nominal; // At maturity or very low daysToMaturity with 0 yield, price equals nominal
      }

      data.push({
        date: currentDate.toISOString(),
        price: parseFloat(price.toFixed(2)),
        yield: parseFloat(currentYield.toFixed(4)),
      });

      currentDate.setDate(currentDate.getDate() + 7); // Increment by a week
    }

    // Ensure the very last actual endDate is included if not already present
    // This handles cases where endDate is not exactly a 7-day multiple from startDate or falls outside the loop increment.
    if (data.length === 0 || new Date(data[data.length - 1].date).getTime() < _endDate.getTime()) {
      const daysToMaturity = Math.max(0, (maturityDate.getTime() - _endDate.getTime()) / (1000 * 60 * 60 * 24));
      let currentYield = initialYield * (daysToMaturity / (365 * 3));
      if (currentYield < 0) currentYield = 0;
      if (daysToMaturity < 5 && daysToMaturity > 0) currentYield *= 0.5;
      if (daysToMaturity === 0) currentYield = 0;

      let price = nominal;
      if (daysToMaturity > 0 && currentYield > 0) {
        price = nominal / Math.pow(1 + currentYield, daysToMaturity / 365.25);
      } else {
        price = nominal;
      }
      data.push({
        date: _endDate.toISOString(),
        price: parseFloat(price.toFixed(2)),
        yield: parseFloat(currentYield.toFixed(4)),
      });
    }

    // Sort by date to be safe, though it should already be sorted
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Retrieves the current market data for a given bond ISIN.
   * @param isin The ISIN of the bond.
   * @returns A promise that resolves to CurrentMarketData or null if not found.
   */
  public async getCurrentMarketData(isin: string): Promise<CurrentMarketData | null> {
    // In a production environment, this would call an external market data API.
    // e.g., using axios.get(`https://api.marketdata.com/v1/bonds/${isin}/current`)
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        resolve(this.mockData[isin]?.current || null);
      }, 100);
    });
  }

  /**
   * Retrieves historical market data for a given bond ISIN.
   * Can specify a predefined range or custom 'from'/'to' dates.
   * @param isin The ISIN of the bond.
   * @param range Predefined historical data range (e.g., "1M", "3Y"). Defaults to "ALL".
   * @param from Optional custom start date (ISO string). Overrides 'range' if both 'from' and 'to' are provided.
   * @param to Optional custom end date (ISO string). Overrides 'range' if both 'from' and 'to' are provided.
   * @returns A promise that resolves to an array of MarketDataPoint.
   */
  public async getHistoricalMarketData(
    isin: string,
    range: HistoricalDataRange = "ALL",
    from?: string,
    to?: string
  ): Promise<MarketDataPoint[]> {
    // In a production environment, this would call an external market data API
    // e.g., using axios.get(`https://api.marketdata.com/v1/bonds/${isin}/historical?range=${range}`)
    return new Promise((resolve) => {
      setTimeout(() => {
        let data = this.mockData[isin]?.historical || [];

        // Determine the effective 'now' date for range calculations
        // For matured bonds, 'now' should be its last update date to show relevant history relative to trading cessation.
        const effectiveNow = isin === "US912796P781"
          ? new Date(this.mockData["US912796P781"].current.lastUpdated || "2021-12-17T00:00:00Z")
          : new Date();

        let filteredData = [...data]; // Create a mutable copy

        // Apply custom date range filtering if 'from' and 'to' are both provided
        if (from && to) {
          const startDate = new Date(from);
          const endDate = new Date(to);
          filteredData = filteredData.filter(point => {
            const pointDate = new Date(point.date);
            return pointDate >= startDate && pointDate <= endDate;
          });
        } else if (range !== "ALL") {
          // Apply predefined range filtering
          let filterDate = new Date(effectiveNow);

          switch (range) {
            case "1M":
              filterDate.setMonth(effectiveNow.getMonth() - 1);
              break;
            case "3M":
              filterDate.setMonth(effectiveNow.getMonth() - 3);
              break;
            case "1Y":
              filterDate.setFullYear(effectiveNow.getFullYear() - 1);
              break;
            case "3Y":
              filterDate.setFullYear(effectiveNow.getFullYear() - 3);
              break;
          }
          filteredData = filteredData.filter(point => {
            const pointDate = new Date(point.date);
            // Ensure data is within the range and not past the effective "now" date
            return pointDate >= filterDate && pointDate <= effectiveNow;
          });
        }

        resolve(filteredData);
      }, 150);
    });
  }
}

// Export a singleton instance of the service
export const marketDataService = new MarketDataService();