import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { CompanyProfile, FullStockData, StockMetrics, StockQuote } from '../models/stock.model';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  private baseUrl = 'https://finnhub.io/api/v1';
  private apiKey = 'd7797d1r01qp6afknn90d7797d1r01qp6afknn9g';
  private ws!: WebSocket;
  private tradeSubject = new Subject<{ symbol: string; price: number }>();
  public realTimePrice$ = this.tradeSubject.asObservable();
  // Track active subscriptions
  private activeSymbols = new Set<string>();
  private pendingSubscriptions: string[] = [];

  constructor(private http: HttpClient, private ngZone: NgZone) { }

  //  ---------- WebSocket for Real-Time Price Updates --------
  connectWebSocket(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    const wsUrl = `wss://ws.finnhub.io?token=${this.apiKey}`;
    // const wsUrl = 'ws://localhost:8080';   // <-- local mock server

    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Send any queued subscriptions (first-time)
      this.pendingSubscriptions.forEach(sym => this.sendSubscribe(sym));
      this.pendingSubscriptions = [];
      this.activeSymbols.forEach(sym => this.sendSubscribe(sym));
    };

    this.ws.onmessage = (event) => {
      console.log('Raw WebSocket message:', event.data);
      this.ngZone.run(() => {
        const data = JSON.parse(event.data);
        console.log('Parsed data:', data);
        if (data.type === 'trade' && data.data) {
          data.data.forEach((trade: any) => {
            console.log(`Trade: ${trade.s} @ $${trade.p}`);
            this.tradeSubject.next({ symbol: trade.s, price: trade.p });
          });
        }
      });
    };

    this.ws.onerror = (err) => console.error('WebSocket error', err);
    this.ws.onclose = () => {
      console.warn('WebSocket closed, reconnecting in 3s...');
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }

  private sendSubscribe(symbol: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({ type: 'subscribe', symbol });
      this.ws.send(msg);
    } else {
      console.warn(`Cannot subscribe to ${symbol} – WebSocket state:`, this.ws?.readyState);
    }
  }
  private sendUnsubscribe(symbol: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
    }
  }

  subscribeToSymbol(symbol: string): void {
    if (!this.activeSymbols.has(symbol)) {
      this.activeSymbols.add(symbol);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendSubscribe(symbol);
      } else {
        // Queue the subscription for when the WebSocket opens
        console.log(`Queueing subscription for ${symbol}`);
        this.pendingSubscriptions.push(symbol);
      }
    }
  }

  unsubscribeFromSymbol(symbol: string): void {
    if (this.activeSymbols.has(symbol)) {
      this.activeSymbols.delete(symbol);
      this.sendUnsubscribe(symbol);
    }
  }

  disconnectWebSocket(): void {
    if (this.ws) this.ws.close();
  }

  getQuote(symbol: string): Observable<StockQuote> {
    return this.http.get<StockQuote>(`${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`);
  }

  getCompanyProfile(symbol: string): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>(`${this.baseUrl}/stock/profile2?symbol=${symbol}&token=${this.apiKey}`);
  }

  getStockMetrics(symbol: string): Observable<StockMetrics> {
    return this.http.get<any>(`${this.baseUrl}/stock/metric?symbol=${symbol}&metric=all&token=${this.apiKey}`).pipe(
      map(res => ({
        '52WeekHigh': res.metric?.['52WeekHigh'] || 0,
        '52WeekLow': res.metric?.['52WeekLow'] || 0
      }))
    );
  }

  // -------- Fetch all stock data for a single symbol --------
  fetchFullStockData(symbol: string): Observable<FullStockData> {
    return forkJoin({
      profile: this.getCompanyProfile(symbol),
      quote: this.getQuote(symbol),
      metrics: this.getStockMetrics(symbol)
    }).pipe(
      map(({ profile, quote, metrics }) => ({
        symbol: symbol,
        companyName: profile.name,
        currentPrice: quote.c,
        dailyHigh: quote.h,
        dailyLow: quote.l,
        percentChange: quote.dp,
        week52High: metrics['52WeekHigh'],
        week52Low: metrics['52WeekLow'],
        lastUpdate: new Date(),
        isActive: true,
      }))
    );
  }

  // ------- Fetch for all stock data multiple symbols -----
  fetchMultipleStocks(symbols: string[]): Observable<FullStockData[]> {
    const requests = symbols.map(sym => this.fetchFullStockData(sym));
    return forkJoin(requests);
  }

}