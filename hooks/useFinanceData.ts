import { useState, useEffect } from 'react';

interface FinanceData {
  stockPrice: number;
  companyName: string;
  sector: string;
  financialMetrics?: {
    revenue: number;
    profit: number;
  };
}

const useFinanceData = (ticker: string): FinanceData => {
  const [data, setData] = useState<FinanceData | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await fetch(`https://financialmodelingprep.com/api/v3/stock/${ticker}/quote`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonData: any = await response.json();

        const parsedData: FinanceData = {
          stockPrice: jsonData.price,
          companyName: jsonData.name,
          sector: jsonData.sector,
          financialMetrics: jsonData.financials ? {
            revenue: jsonData.financials.revenue,
            profit: jsonData.financials.netIncome
          } : undefined,
        };

        setData(parsedData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  return { data, isLoading, error };
};

export default useFinanceData;