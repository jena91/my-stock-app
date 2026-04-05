import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FullStockData } from '../models/stock.model';
import { CardService } from '../services/card-service';
@Component({
  selector: 'app-stock-dashboard-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-dashboard-component.html',
  styleUrls: ['./stock-dashboard-component.css'],
})
export class StockDashboardComponent implements OnInit, OnDestroy {
  stocks: FullStockData[] = [];
  loading = true;
  error = false;
  symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']; // Added TEST for debugging

  private realTimeSubscription!: Subscription;

  constructor(private cardService: CardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // get initial data
    this.getInitData();

    // Connect WebSocket and subscribe after connection is open
    this.cardService.connectWebSocket;

    // Use the service's internal queuing mechanism if available,
    // otherwise wait a bit and then subscribe
    setTimeout(() => {
      this.symbols.forEach(sym => this.cardService.subscribeToSymbol(sym));
    }, 1500); // Increased delay to ensure WebSocket is open

    // Listen for real-time price updates
    this.realTimeSubscription = this.cardService.realTimePrice$.subscribe(update => {
      console.log('Component received update:', update);
      const stock = this.stocks.find(s => s.symbol === update.symbol);
      if (stock && stock.isActive) {
        console.log(`Updated ${stock.symbol} price to ${update.price}`);
        stock.currentPrice = update.price;
        stock.lastUpdate = new Date();
        // Manually trigger change detection if needed (often not required)
        this.cdr.detectChanges();
      }
    });

  }

  private getInitData(): void {
    this.loading = true;
    this.error = false;
    this.cardService.fetchMultipleStocks(this.symbols).subscribe({
      next: (data) => {
        // Add isActive flag and set to true by default
        this.stocks = data.map(stock => ({ ...stock, isActive: true }));
        console.log('Initial stocks loaded:', this.stocks);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching stock data:', err);
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleStock(stock: FullStockData): void {
    stock.isActive = !stock.isActive;
    if (stock.isActive) {
      this.cardService.subscribeToSymbol(stock.symbol);
    } else {
      this.cardService.unsubscribeFromSymbol(stock.symbol);
    }
  }

  ngOnDestroy(): void {
    this.realTimeSubscription?.unsubscribe();
    this.cardService.disconnectWebSocket();
  }
}