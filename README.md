# Algod WebSocket Proxy

A simple, secure WebSocket proxy server that forwards Algorand algod API requests. Keeps your algod API token secure on the server while providing real-time access to Algorand data.

## Features

- **Secure**: API tokens stay server-side, never exposed to clients
- **Real-time**: WebSocket connections for low-latency data access
- **CORS-free**: Bypasses browser CORS restrictions
- **Simple**: Minimal configuration, easy to deploy
- **Production-ready**: Error handling, authentication, and graceful shutdown

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install ws dotenv
   ```

2. **Configure environment:**
   ```bash
   cp .env.template .env
   # Edit .env with your settings
   ```

3. **Run the server:**
   ```bash
   node websocket-server.js
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALGOD_TOKEN` | Your algod API token | *required* |
| `ALGOD_SERVER` | Algod server URL | `http://localhost` |
| `ALGOD_PORT` | Algod port | `8080` |
| `WS_PORT` | WebSocket server port | `8081` |
| `WS_AUTH_TOKEN` | Client authentication token | *required* |

## Usage

**Connect to WebSocket:**
```javascript
const ws = new WebSocket('ws://your-server:8081/algod?token=your_auth_token')
```

**Send requests:**
```javascript
ws.send(JSON.stringify({
  endpoint: '/v2/transactions/pending',
  method: 'GET'
}))
```

**Receive responses:**
```javascript
ws.onmessage = (event) => {
  const response = JSON.parse(event.data)
  console.log(response.data) // Algod response
}
```

## Use Cases

- Real-time mempool monitoring
- DeFi applications needing live data
- Analytics dashboards
- Any app requiring secure algod access

## Security

- Only `/v2/` endpoints allowed
- Token-based client authentication
- API tokens never exposed to clients
- Request validation and error handling

## License

MIT