```typescript
// src/services/trading/marketDataStream.ts

import { Observable, Subject } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { MarketData, Instrument, PriceUpdate } from '../../types'; // Assuming types are defined

export class MarketDataStreamService {
  private readonly marketDataSubject: Subject<MarketData> = new Subject<MarketData>();
  public readonly marketData$: Observable<MarketData>;
  private readonly instrumentStreams: Map<Instrument, Subject<PriceUpdate>> = new Map();


  constructor() {
    this.marketData$ = this.marketDataSubject.asObservable().pipe(
      shareReplay(1) // Replay the last emitted value to new subscribers
    );
  }

  // Simulate market data updates for a given instrument.  This is a simplified example.
  // In a real system, this would likely fetch from an external data feed.
  public subscribeToInstrument(instrument: Instrument): Observable<PriceUpdate> {
    if (this.instrumentStreams.has(instrument)) {
      return this.instrumentStreams.get(instrument)!.asObservable();
    }
    const instrumentSubject = new Subject<PriceUpdate>();
    this.instrumentStreams.set(instrument, instrumentSubject);

    return instrumentSubject.asObservable();
  }



  public publishMarketData(marketData: MarketData): void {
    this.marketDataSubject.next(marketData);

    marketData.priceUpdates.forEach(update => {
      const instrumentSubject = this.instrumentStreams.get(update.instrument);
      if (instrumentSubject) {
        instrumentSubject.next(update);
      }
    });

  }


  // Example: Generate sample market data (replace with real data feed).
  public startSimulatedMarketData(instruments: Instrument[], intervalMs: number = 1000): void {
    instruments.forEach(instrument => {
      let currentPrice = Math.random() * 100; // Initial random price

      setInterval(() => {
        const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
        currentPrice += change;
        currentPrice = Math.max(0, currentPrice); // Ensure price is not negative

        const priceUpdate: PriceUpdate = {
          instrument: instrument,
          bid: currentPrice - (Math.random() * 0.5),
          ask: currentPrice + (Math.random() * 0.5),
          last: currentPrice,
          timestamp: new Date(),
        };

        const marketData: MarketData = {
          priceUpdates: [priceUpdate],
          timestamp: new Date()
        }
        this.publishMarketData(marketData);

      }, intervalMs);
    });
  }


    public stopSimulatedMarketData():void{
        //implementation for stopping the stream would be added here
        //if a real data feed was integrated, the correct cleanup would be done.
        this.instrumentStreams.forEach(stream => stream.complete());
        this.instrumentStreams.clear();
        this.marketDataSubject.complete();
    }
}
```