const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

// Mock stock symbols and initial prices
const stocks = {
  AAPL: 175.50,
  GOOGL: 135.25,
  TSLA: 245.80,
  MSFT: 330.12
};

// Function to generate random price changes
function updatePrices() {
  for (const symbol in stocks) {
    const change = (Math.random() - 0.5) * 3; // -1.5 to +1.5
    stocks[symbol] = +(stocks[symbol] + change).toFixed(2);
  }
}

// Broadcast to all connected clients every 2 seconds
setInterval(() => {
  updatePrices();
  const message = JSON.stringify({ type: 'priceUpdate', data: stocks });
  server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}, 2000);

server.on('connection', (ws) => {
  console.log('Client connected');
  // Send initial prices immediately
  ws.send(JSON.stringify({ type: 'init', data: stocks }));
});

console.log('WebSocket server running on ws://localhost:8080');