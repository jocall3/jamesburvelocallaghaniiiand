import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, BrainCircuit, TrendingUp, AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- TYPE DEFINITIONS ---

interface ForecastDataPoint {
  year: number;
  value: number;
  confidenceMin?: number;
  confidenceMax?: number;
}

interface Scenario {
  id: string;
  name: string;
  color: string;
  parameters: {
    revenueGrowth: number; // percentage
    cogsPercentage: number; // percentage of revenue
    opexGrowth: number; // percentage
    marketSentiment: 'optimistic' | 'neutral' | 'pessimistic';
  };
}

interface ForecastResult {
  scenarioId: string;
  forecast: ForecastDataPoint[];
  keyMetrics: {
    cagr: number; // Compound Annual Growth Rate
    netProfitMargin: number;
    fiveYearRevenue: number;
  };
}

// --- MOCK DATA & API ---

const HISTORICAL_DATA: ForecastDataPoint[] = [
  { year: 2020, value: 100 },
  { year: 2021, value: 120 },
  { year: 2022, value: 150 },
  { year: 2023, value: 175 },
  { year: 2024, value: 210 },
];

const SCENARIO_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

const generateMockForecast = (
  baseValue: number,
  params: Scenario['parameters']
): ForecastDataPoint[] => {
  const forecast: ForecastDataPoint[] = [];
  let currentValue = baseValue;
  const sentimentMultiplier = {
    optimistic: 1.1,
    neutral: 1.0,
    pessimistic: 0.9,
  };

  for (let i = 1; i <= 5; i++) {
    const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // +/- 5% randomness
    const growthFactor = (1 + params.revenueGrowth / 100) * sentimentMultiplier[params.marketSentiment] * randomFactor;
    currentValue *= growthFactor;
    
    const confidenceInterval = currentValue * 0.08; // 8% confidence interval
    forecast.push({
      year: 2024 + i,
      value: Math.round(currentValue),
      confidenceMin: Math.round(currentValue - confidenceInterval),
      confidenceMax: Math.round(currentValue + confidenceInterval),
    });
  }
  return forecast;
};

// Simulates a call to a sophisticated AI backend
const fetchAIForecast = (scenarios: Scenario[]): Promise<ForecastResult[]> => {
  console.log("AI Model: Generating forecasts for scenarios...", scenarios);
  return new Promise((resolve) => {
    setTimeout(() => {
      const lastHistoricalValue = HISTORICAL_DATA[HISTORICAL_DATA.length - 1].value;
      const results: ForecastResult[] = scenarios.map(scenario => {
        const forecast = generateMockForecast(lastHistoricalValue, scenario.parameters);
        const fiveYearRevenue = forecast[forecast.length - 1].value;
        const cagr = (Math.pow(fiveYearRevenue / lastHistoricalValue, 1 / 5) - 1) * 100;
        const netProfitMargin = (100 - scenario.parameters.cogsPercentage) * 0.7 - 15; // Simplified calculation

        return {
          scenarioId: scenario.id,
          forecast,
          keyMetrics: {
            cagr: parseFloat(cagr.toFixed(2)),
            netProfitMargin: parseFloat(netProfitMargin.toFixed(2)),
            fiveYearRevenue,
          }
        };
      });
      console.log("AI Model: Forecasts generated.", results);
      resolve(results);
    }, 1500); // Simulate network latency and computation time
  });
};


// --- MAIN COMPONENT ---

export default function AIFinancialForecaster() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: uuidv4(),
      name: 'Baseline',
      color: SCENARIO_COLORS[0],
      parameters: {
        revenueGrowth: 15,
        cogsPercentage: 40,
        opexGrowth: 10,
        marketSentiment: 'neutral',
      },
    },
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);
  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeScenario = useMemo(() => scenarios.find(s => s.id === activeScenarioId), [scenarios, activeScenarioId]);

  const handleParameterChange = useCallback((param: keyof Scenario['parameters'], value: any) => {
    setScenarios(prev =>
      prev.map(s =>
        s.id === activeScenarioId ? { ...s, parameters: { ...s.parameters, [param]: value } } : s
      )
    );
  }, [activeScenarioId]);

  const handleRunForecast = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await fetchAIForecast(scenarios);
      setForecastResults(results);
    } catch (err) {
      setError("An error occurred while running the forecast. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [scenarios]);

  const addScenario = () => {
    const newScenario: Scenario = {
      id: uuidv4(),
      name: `Scenario ${scenarios.length + 1}`,
      color: SCENARIO_COLORS[scenarios.length % SCENARIO_COLORS.length],
      parameters: { ...scenarios[0].parameters, revenueGrowth: scenarios[0].parameters.revenueGrowth * 0.8 },
    };
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioId(newScenario.id);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 1) return; // Cannot remove the last scenario
    const newScenarios = scenarios.filter(s => s.id !== id);
    setScenarios(newScenarios);
    if (activeScenarioId === id) {
      setActiveScenarioId(newScenarios[0].id);
    }
  };

  const handleScenarioNameChange = (id: string, newName: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const chartData = useMemo(() => {
    const combinedData: { [year: number]: any } = {};
    
    HISTORICAL_DATA.forEach(d => {
      if (!combinedData[d.year]) combinedData[d.year] = { year: d.year };
      combinedData[d.year]['Historical Revenue'] = d.value;
    });

    forecastResults.forEach(result => {
      const scenario = scenarios.find(s => s.id === result.scenarioId);
      if (!scenario) return;

      result.forecast.forEach(d => {
        if (!combinedData[d.year]) combinedData[d.year] = { year: d.year };
        combinedData[d.year][scenario.name] = d.value;
        combinedData[d.year][`${scenario.name}_confidence`] = [d.confidenceMin, d.confidenceMax];
      });
    });

    return Object.values(combinedData).sort((a, b) => a.year - b.year);
  }, [forecastResults, scenarios]);

  if (!activeScenario) return null; // Should not happen

  return (
    <Card className="w-full max-w-7xl mx-auto shadow-2xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl">AI-Powered Financial Forecaster</CardTitle>
            <CardDescription>Analyze future financial performance with predictive AI and scenario modeling.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- CONTROLS PANE --- */}
        <div className="md:col-span-1 space-y-6">
          <Tabs defaultValue="scenarios" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
            </TabsList>
            <TabsContent value="scenarios" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Management</CardTitle>
                  <CardDescription>Add, remove, and select scenarios to compare.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scenarios.map(s => (
                    <div key={s.id} className={`flex items-center p-2 rounded-md transition-colors ${activeScenarioId === s.id ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: s.color }} />
                      <Input
                        value={s.name}
                        onChange={(e) => handleScenarioNameChange(s.id, e.target.value)}
                        className="flex-grow h-8 border-0 focus-visible:ring-1 focus-visible:ring-ring bg-transparent"
                        onClick={() => setActiveScenarioId(s.id)}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeScenario(s.id)} disabled={scenarios.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={addScenario}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Scenario
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="parameters" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Parameters</CardTitle>
                  <CardDescription>Adjust drivers for the '{activeScenario.name}' scenario.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="revenueGrowth">Annual Revenue Growth (%)</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        id="revenueGrowth"
                        min={-10}
                        max={50}
                        step={1}
                        value={[activeScenario.parameters.revenueGrowth]}
                        onValueChange={([val]) => handleParameterChange('revenueGrowth', val)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={activeScenario.parameters.revenueGrowth}
                        onChange={(e) => handleParameterChange('revenueGrowth', Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cogsPercentage">COGS (% of Revenue)</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        id="cogsPercentage"
                        min={10}
                        max={80}
                        step={1}
                        value={[activeScenario.parameters.cogsPercentage]}
                        onValueChange={([val]) => handleParameterChange('cogsPercentage', val)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={activeScenario.parameters.cogsPercentage}
                        onChange={(e) => handleParameterChange('cogsPercentage', Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="opexGrowth">Annual OpEx Growth (%)</Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        id="opexGrowth"
                        min={0}
                        max={30}
                        step={1}
                        value={[activeScenario.parameters.opexGrowth]}
                        onValueChange={([val]) => handleParameterChange('opexGrowth', val)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={activeScenario.parameters.opexGrowth}
                        onChange={(e) => handleParameterChange('opexGrowth', Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* --- VISUALIZATION PANE --- */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>Historical data and AI-generated projections.</CardDescription>
              </div>
              <Button onClick={handleRunForecast} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="mr-2 h-4 w-4" />
                )}
                Run Forecast
              </Button>
            </CardHeader>
            <CardContent className="flex-grow">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="h-[400px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis unit="$M" />
                      <Tooltip formatter={(value: number) => `$${value}M`} />
                      <Legend />
                      <Line type="monotone" dataKey="Historical Revenue" stroke="#16a34a" strokeWidth={3} dot={false} />
                      {scenarios.map(s => (
                        <Area
                          key={s.id}
                          type="monotone"
                          dataKey={s.name}
                          stroke={s.color}
                          fill={s.color}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                       {scenarios.map(s => (
                        <Area
                          key={`${s.id}-confidence`}
                          dataKey={`${s.name}_confidence`}
                          stroke={s.color}
                          strokeOpacity={0.2}
                          fill={s.color}
                          fillOpacity={0.1}
                          activeDot={false}
                          legendType="none"
                          tooltipType="none"
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
            {forecastResults.length > 0 && !isLoading && (
              <CardFooter>
                <div className="w-full">
                  <h4 className="font-semibold mb-2">Key Metrics (5-Year Outlook)</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead className="text-right">CAGR</TableHead>
                        <TableHead className="text-right">Est. Net Margin</TableHead>
                        <TableHead className="text-right">Final Year Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecastResults.map(result => {
                        const scenario = scenarios.find(s => s.id === result.scenarioId);
                        if (!scenario) return null;
                        return (
                          <TableRow key={result.scenarioId}>
                            <TableCell className="font-medium flex items-center">
                              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: scenario.color }} />
                              {scenario.name}
                            </TableCell>
                            <TableCell className="text-right">{result.keyMetrics.cagr}%</TableCell>
                            <TableCell className="text-right">{result.keyMetrics.netProfitMargin}%</TableCell>
                            <TableCell className="text-right">${result.keyMetrics.fiveYearRevenue}M</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}