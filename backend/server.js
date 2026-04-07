const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

let stocks = {
  AAPL: 175.50,
  GOOGL: 135.25,
  MSFT: 330.12,
  TSLA: 245.80
};

setInterval(() => {
  for (let sym in stocks) {
    const change = (Math.random() - 0.5) * 2;
    stocks[sym] = parseFloat((stocks[sym] + change).toFixed(2));
  }
  const message = JSON.stringify({
    type: 'trade',
    data: Object.entries(stocks).map(([s, p]) => ({ s, p }))
  });
  server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}, 2000);

server.on('connection', (ws) => {
  console.log('Client connected to mock WebSocket');
});

console.log('Mock WebSocket server running on ws://localhost:8080');