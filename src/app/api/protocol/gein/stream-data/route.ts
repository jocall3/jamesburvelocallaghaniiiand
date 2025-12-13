import { NextResponse } from 'next/server';

// Simulate a real-time data stream for economic indicators
// In a real application, this would connect to a live data source (e.g., WebSockets, SSE)
async function* generateEconomicDataStream() {
  let counter = 0;
  while (counter < 500) { // Simulate streaming for a limited duration or until a condition is met
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate data arrival delay

    const data = {
      timestamp: new Date().toISOString(),
      indicator: 'GDP',
      value: Math.random() * 10000, // Simulated economic value
      country: 'Global',
      source: 'GEIN',
      id: `data-${counter}`,
    };

    yield `data: ${JSON.stringify(data)}\n\n`;
    counter++;
  }
}

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of generateEconomicDataStream()) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}