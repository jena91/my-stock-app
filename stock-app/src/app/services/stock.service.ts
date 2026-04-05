import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, timer, Subject } from 'rxjs';
import { takeWhile, tap, filter } from 'rxjs/operators';

export interface MockStockData {
  [symbol: string]: number;
}
@Injectable({
  providedIn: 'root'
})

export class StockService {
  private socket!: WebSocket;
  private priceSubject = new Subject<MockStockData>();
  public prices$ = this.priceSubject.asObservable();

  private mockInterval: any;
  private useMock = false;

  constructor() {
    this.connectToWebSocket();
  }

  connectToWebSocket(): void {
    this.socket = new WebSocket('ws://localhost:8080');

    this.socket.onopen = () => {
      console.log('Connected to real WebSocket server');
      if (this.mockInterval) clearInterval(this.mockInterval);
      this.useMock = false;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'priceUpdate' || data.type === 'init') {
        this.priceSubject.next(data.data);
      }
    };

    this.socket.onerror = (err) => {
      console.warn('WebSocket error, switching to mock mode', err);
      this.startMockMode();
    };

    this.socket.onclose = () => {
      if (!this.useMock) {
        console.log('WebSocket closed, switching to mock mode');
        this.startMockMode();
      }
    };
  }

  private startMockMode(): void {
    if (this.useMock) return;
    this.useMock = true;

    const mockStocks: MockStockData = {
      AAPL: 175.50,
      GOOGL: 135.25,
      TSLA: 245.80,
      MSFT: 330.12
    };

    // Send initial data
    this.priceSubject.next({ ...mockStocks });

    // Update every 2 seconds with random changes
    this.mockInterval = setInterval(() => {
      for (const sym in mockStocks) {
        const change = (Math.random() - 0.5) * 3;
        let newVal = mockStocks[sym] + change;
        newVal = Math.max(newVal, 0.01);
        mockStocks[sym] = parseFloat(newVal.toFixed(2));
      }
      this.priceSubject.next({ ...mockStocks });
    }, 2000);
  }

  // Call this in ngOnDestroy of your component to clean up
  public disconnect(): void {
    if (this.socket) this.socket.close();
    if (this.mockInterval) clearInterval(this.mockInterval);
  }
  
}
    