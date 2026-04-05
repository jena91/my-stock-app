export interface FullStockData {
    symbol: string;
    currentPrice: number;
    dailyHigh: number;
    dailyLow: number;
    percentChange: number;
    companyName: string;
    week52High: number;
    week52Low: number;
    isActive: boolean;
    lastUpdate: Date;
}

export interface StockQuote {
    c: number;   // current price
    h: number;   // daily high
    l: number;   // daily low
    dp: number;  // percent change
}

export interface CompanyProfile {
    name: string;
}

export interface StockMetrics {
    '52WeekHigh': number;
    '52WeekLow': number;
}

