import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StockDashboardComponent } from './stock-dashboard-component/stock-dashboard-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, 
    StockDashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('stock-app');
}
