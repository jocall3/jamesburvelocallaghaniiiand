import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { analyzeFinancialData } from './analyzer';
import { generateInvestmentRecommendations } from './recommender';
import { FinancialData } from './types';
import { fetchMarketData } from './marketData';
import { simulatePortfolio } from './simulator';
import { optimizePortfolio } from './optimizer';
import { monitorPortfolio } from './monitor';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('AI Financial Advisor Service is running');
});

app.post('/analyze', async (req: Request, res: Response) => {
  try {
    const financialData: FinancialData = req.body;
    const analysis = analyzeFinancialData(financialData);
    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing financial data:", error);
    res.status(500).json({ error: 'Failed to analyze financial data' });
  }
});

app.post('/recommend', async (req: Request, res: Response) => {
  try {
    const financialData: FinancialData = req.body;
    const recommendations = generateInvestmentRecommendations(financialData);
    res.json(recommendations);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({ error: 'Failed to generate investment recommendations' });
  }
});

app.get('/market-data/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    const marketData = await fetchMarketData(symbol);
    res.json(marketData);
  } catch (error) {
    console.error("Error fetching market data:", error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

app.post('/simulate', async (req: Request, res: Response) => {
  try {
    const portfolio = req.body;
    const simulationResults = simulatePortfolio(portfolio);
    res.json(simulationResults);
  } catch (error) {
    console.error("Error simulating portfolio:", error);
    res.status(500).json({ error: 'Failed to simulate portfolio' });
  }
});

app.post('/optimize', async (req: Request, res: Response) => {
    try {
        const portfolio = req.body;
        const optimizedPortfolio = optimizePortfolio(portfolio);
        res.json(optimizedPortfolio);
    } catch (error) {
        console.error("Error optimizing portfolio:", error);
        res.status(500).json({ error: 'Failed to optimize portfolio' });
    }
});

app.post('/monitor', async (req: Request, res: Response) => {
    try {
        const portfolio = req.body;
        const monitoringResults = monitorPortfolio(portfolio);
        res.json(monitoringResults);
    } catch (error) {
        console.error("Error monitoring portfolio:", error);
        res.status(500).json({ error: 'Failed to monitor portfolio' });
    }
});

app.listen(port, () => {
  console.log(`AI Financial Advisor service listening on port ${port}`);
});