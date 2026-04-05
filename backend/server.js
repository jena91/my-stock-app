// server.js
const WebSocket = require('ws');
const PORT = 8080;
const server = new WebSocket.Server({ port: PORT });

// Initial mock stock data
let stocks = {
  AAPL: 175.50,
  GOOGL: 135.25,
  TSLA: 245.80,
  MSFT: 330.12
};

// Random price fluctuation (±1.5%)
function updatePrices() {
  for (const sym in stocks) {
    const change = (Math.random() - 0.5) * 0.03;
    let newPrice = stocks[sym] * (1 + change);
    newPrice = Math.max(newPrice, 0.01);
    stocks[sym] = parseFloat(newPrice.toFixed(2));
  }
}

// Broadcast to all connected clients every 2 seconds
setInterval(() => {
  const message = JSON.stringify({
    type: 'trade',
    data: Object.entries(stocks).map(([s, p]) => ({ s, p }))
  });
  server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}, 2000);

server.on('connection', (ws) => {
  console.log('Client connected to mock server');
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'subscribe') {
      console.log(`Subscribed to ${data.symbol}`);
    }
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);