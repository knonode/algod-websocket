#!/usr/bin/env node
require('dotenv').config()
/**
 * WebSocket Algod Proxy Server
 * 
 * Simple, secure proxy that forwards algod API requests via WebSocket
 * 
 * Usage:
 *   ALGOD_TOKEN=your_token_here ALGOD_SERVER=http://localhost ALGOD_PORT=8080 node websocket-server.js
 * 
 * Environment Variables:
 *   ALGOD_TOKEN - Your algod API token (required)
 *   ALGOD_SERVER - Algod server URL (default: http://localhost)  
 *   ALGOD_PORT - Algod port (default: 8080)
 *   WS_PORT - WebSocket server port (default: 8081)
 */

const WebSocket = require('ws')

// Configuration from environment variables
const ALGOD_TOKEN = process.env.ALGOD_TOKEN
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'http://localhost'
const ALGOD_PORT = process.env.ALGOD_PORT || '8080'
const WS_PORT = process.env.WS_PORT || 8081
const WS_AUTH_TOKEN = process.env.WS_AUTH_TOKEN

// Validation
if (!ALGOD_TOKEN) {
  console.error('❌ ALGOD_TOKEN environment variable is required')
  process.exit(1)
}

const ALGOD_BASE_URL = `${ALGOD_SERVER}:${ALGOD_PORT}`

console.log(
  "                      ██████▓▒░                                  \n" +
  "                 ███▓ ▒         ▒▓██████░                        \n" +
  "          ░▒▓██▓░   ▒█▓                  █                       \n" +
  "     ▒███▒            ██▓███▓           ▒                        \n" +
  "  ██░            ░▒▓███  ░░▒▓████████▓▓▒▓                        \n" +
  "   █      ░░▒▓█████▓▒ ███▓░░        ░▒▓█       the marvelous     \n" +
  "   ░█░▓▓█████▒      ▒▒█ ░▓██▓███████▓▒░▒      algod web-socket   \n" +
  "    ░█▓▒     ░▒▓███████▒░       ░▒▒▒▓▓█▓        proxy server     \n" +
  "      ▒▒███████▓    ░█▓█████████▒░     █    put it close         \n" +
  "      ██▓▒░    ░▒▓███▒      ░▒▒▓████████      to algod           \n" +
  "       ▓ ░▓█████▓▓▒ ░▒    ░▒▒░        █     connect from         \n" +
  "       ███▓░░       █  ▓█████▒▒██     ▒       anywhere           \n" +
  "       █░          ░█ ██████   ▓██▒   █                          \n" +
  "        █          ▒░█████▒ ▒█  ███   ▓     secure fast          \n" +
  "        █          █ ████  █▓  ░███░ ░         open source       \n" +
  "        ░▓        ░▒ ▓█▓ ▒█░ ▓░ ███  ▓                           \n" +
  "         █       ░▓   ████▒▒██▒ ██   █     does not smell        \n" +
  "          ▓      █      ████████▒   ▒░        like old socks     \n" +
  "          █     ▓░                  █                            \n" +
  "          █    ▓░                   ▓                            \n" +
  "          ▒░  ░▓                    ▓      listen to the         \n" +
  "          ▒░ ░▓                     ▓        mempool             \n" +
  "          ▒░ █                      ▒                            \n" +
  "          ▒░█                       ░         the mempool        \n" +
  "          █▒░                       ░█                           \n" +
  "          █ █                        █░▓█          the mem       \n" +
  "          █ ▓░                        █  ▒█                      \n" +
  "          █  █░                        █    █         pool       \n" +
  "          █░   ▒▓                      ▒      ░█                 \n" +
  "          ░█▒    █                      ▓        ▓▓░             \n" +
  "           ▒██▒  ▒▒                     ▒░         ░█            \n" +
  "             ░█████░  ░                  █           ▓█          \n" +
  "                  ██   ▒▒                ▓              █▒       \n" +
  "     the mighty    ▓▓    ▒                █               █      \n" +
  "                    █░   ▒                ░█              ░▓     \n" +
  "       algod         █    ▒░                █░             ░▒    \n" +
  "                     ▓█    ░                ░█              █░   \n" +
  "    web-socket        █    ▒                 ▓▒             ██   \n" +
  "                       █                      █             ██   \n" +
  "     proxy server      ▓▓                     ▓░           ▒██   \n" +
  "                        █                     ░▒          ▓███   \n" +
  "                         █                     █░     ░▓█████    \n" +
  "    made with love       █▒                   ▒████████████      \n" +
  "      and ai              █░                  ██   ░▓░░          \n" +
  "                           █▒                ▒█▒                 \n" +
  "     by hampelman          ▒██▒             ▓██                  \n" +
  "                            ░████▒        ▒███▒                  \n" +
  "                              ░██████████████░                   \n" +
  "                                 ░█████████░                    \n" +
  "🚀 Starting WebSocket Algod Proxy Server"
)
console.log(`📡 Algod endpoint: ${ALGOD_BASE_URL}`)
console.log(`🔌 WebSocket server port: ${WS_PORT}`)

// Test algod connection on startup
async function testAlgodConnection() {
  try {
    const response = await fetch(`${ALGOD_BASE_URL}/v2/status`, {
      headers: {
        'X-Algo-API-Token': ALGOD_TOKEN,
        'Accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const status = await response.json()
      console.log(`✅ Algod connection successful - Round: ${status['last-round']}`)
      return true
    } else {
      console.error(`❌ Algod connection failed: ${response.status} ${response.statusText}`)
      return false
    }
  } catch (error) {
    console.error('❌ Algod connection error:', error.message)
    return false
  }
}

// Forward request to algod
async function forwardToAlgod(endpoint, method = 'GET', body = null) {
  const url = `${ALGOD_BASE_URL}${endpoint}`
  
  try {
    const options = {
      method,
      headers: {
        'X-Algo-API-Token': ALGOD_TOKEN,
        'Accept': 'application/json'
      }
    }
    
    if (body && method !== 'GET') {
      options.body = typeof body === 'string' ? body : JSON.stringify(body)
      options.headers['Content-Type'] = 'application/json'
    }
    
    const response = await fetch(url, options)
    const data = await response.json()
    
    if (response.ok) {
      return { data }
    } else {
      return { error: `Algod API error: ${response.status} ${response.statusText}` }
    }
  } catch (error) {
    console.error('Algod request error:', error.message)
    return { error: `Network error: ${error.message}` }
  }
}

// WebSocket request handler
function handleWebSocketMessage(ws, message) {
  try {
    const request = JSON.parse(message)
    const { endpoint, method = 'GET', body } = request
    
    // Validate request
    if (!endpoint || typeof endpoint !== 'string') {
      ws.send(JSON.stringify({ error: 'Invalid endpoint' }))
      return
    }
    
    // Security: only allow algod v2 API endpoints
    if (!endpoint.startsWith('/v2/')) {
      ws.send(JSON.stringify({ error: 'Only /v2/ endpoints are allowed' }))
      return
    }
    
    console.log(`📡 ${method} ${endpoint}`)
    
    // Forward to algod
    forwardToAlgod(endpoint, method, body)
      .then(result => {
        ws.send(JSON.stringify(result))
      })
      .catch(error => {
        console.error('Request forwarding error:', error)
        ws.send(JSON.stringify({ error: 'Internal server error' }))
      })
      
  } catch (error) {
    console.error('Invalid WebSocket message:', error.message)
    ws.send(JSON.stringify({ error: 'Invalid JSON message' }))
  }
}

// Start server
async function startServer() {
  // Test algod connection first
  const algodOk = await testAlgodConnection()
  if (!algodOk) {
    console.error('❌ Cannot start WebSocket server - algod connection failed')
    process.exit(1)
  }
  
  // Create WebSocket server
  const wss = new WebSocket.Server({ 
    port: WS_PORT,
    path: '/algod'
  })
  
  let connectionCount = 0
  
  wss.on('connection', (ws, request) => {
    // Extract token from URL query parameters
    const url = new URL(request.url, `http://${request.headers.host}`)
    const token = url.searchParams.get('token')
    
    // Validate authentication token
    if (!WS_AUTH_TOKEN) {
      console.error('❌ WS_AUTH_TOKEN environment variable is required')
      ws.close(1008, 'Server configuration error')
      return
    }
    
    if (token !== WS_AUTH_TOKEN) {
      console.log(`❌ Unauthorized connection attempt from ${request.socket.remoteAddress}`)
      ws.close(1008, 'Unauthorized')
      return
    }
    
    connectionCount++
    const clientId = connectionCount
    const clientIP = request.socket.remoteAddress
    
    console.log(`🔗 Client ${clientId} connected from ${clientIP}`)
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      status: 'connected', 
      message: 'Algod Web Socket Proxy Ready',
      timestamp: new Date().toISOString()
    }))
    
    ws.on('message', (message) => {
      handleWebSocketMessage(ws, message.toString())
    })
    
    ws.on('close', () => {
      console.log(`🔌 Client ${clientId} disconnected`)
    })
    
    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for client ${clientId}:`, error.message)
    })
  })
  
  wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error)
  })
  
  console.log(`✅ WebSocket server listening on port ${WS_PORT}`)
  console.log(`🌐 Clients can connect to: ws://[your-server-ip]:${WS_PORT}/algod`)
  console.log('')
  console.log('📋 Request format:')
  console.log('   { "endpoint": "/v2/transactions/pending", "method": "GET" }')
  console.log('')
  console.log('📋 Response format:')
  console.log('   { "data": algodResponse } or { "error": "errorMessage" }')
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down WebSocket server...')
  process.exit(0)
})

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})