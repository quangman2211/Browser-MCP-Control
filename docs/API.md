# API Documentation

Complete API reference for the Hello World Multi-Agent Demo MCP Server.

## 🔌 Server Endpoints

**Base URL**: `http://localhost:3000`  
**WebSocket URL**: `ws://localhost:3000`

## 📡 REST API Endpoints

### Health Check

Check server health và status.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "agent": "mike",
  "server": "hello-world-mcp-server",
  "version": "1.0.0",
  "uptime": 12345,
  "stats": {
    "totalConnections": 42,
    "activeConnections": 3,
    "totalMessages": 156,
    "uptime": 12345
  }
}
```

### Hello Greeting

Send a greeting request via REST API.

**Endpoint**: `POST /api/hello`

**Request Body**:
```json
{
  "name": "string (required, max 100 chars)"
}
```

**Response**:
```json
{
  "greeting": "Hello John! This greeting comes from Mike's REST API endpoint! 🎯",
  "userName": "John",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "agent": "mike",
  "source": "rest_api",
  "responseId": "uuid-v4-string"
}
```

**Error Response** (400):
```json
{
  "error": "Name is required",
  "agent": "mike"
}
```

### Server Statistics

Get detailed server statistics.

**Endpoint**: `GET /api/stats`

**Response**:
```json
{
  "totalConnections": 42,
  "activeConnections": 3,
  "totalMessages": 156,
  "uptime": 12345,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "agent": "mike",
  "recentMessages": [
    {
      "clientId": "uuid-string",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "type": "hello_request",
      "data": {
        "name": "John"
      }
    }
  ]
}
```

### Connected Clients

Get information about currently connected WebSocket clients.

**Endpoint**: `GET /api/clients`

**Response**:
```json
{
  "activeConnections": 3,
  "clients": [
    {
      "id": "uuid-string",
      "connectedAt": "2024-01-01T11:55:00.000Z",
      "messageCount": 5,
      "ip": "127.0.0.1"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "agent": "mike"
}
```

### Test Endpoint

Simple test endpoint for connectivity verification.

**Endpoint**: `GET /api/test`

**Response**:
```json
{
  "message": "MCP Server is working correctly!",
  "agent": "mike",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestFrom": "127.0.0.1",
  "testPassed": true
}
```

## 🔗 WebSocket API

### Connection

Connect to WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected to MCP Server');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Message Format

All WebSocket messages follow this structure:

```json
{
  "type": "message_type",
  "data": {
    // Message-specific data
  }
}
```

### Server Info Message

Sent automatically when client connects.

**Message Type**: `server_info`

**Data**:
```json
{
  "type": "server_info",
  "data": {
    "message": "Connected to Hello World MCP Server",
    "clientId": "uuid-string",
    "agent": "mike",
    "serverTime": "2024-01-01T12:00:00.000Z",
    "serverVersion": "1.0.0"
  }
}
```

### Hello Request

Send a greeting request via WebSocket.

**Message Type**: `hello_request`

**Client Sends**:
```json
{
  "type": "hello_request",
  "data": {
    "name": "John",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "source": "chrome_extension",
    "agent": "sarah"
  }
}
```

**Server Responds**:
```json
{
  "type": "hello_response",
  "data": {
    "greeting": "Hello John! Welcome to the Multi-Agent Hello World demo! 🎉",
    "userName": "John",
    "server_time": "2024-01-01T12:00:00.000Z",
    "agent": "mike",
    "clientId": "uuid-string",
    "messageCount": 1,
    "responseId": "uuid-string"
  }
}
```

### Ping/Pong

Keep-alive mechanism.

**Client Sends**:
```json
{
  "type": "ping",
  "data": {
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Server Responds**:
```json
{
  "type": "pong",
  "data": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "agent": "mike",
    "clientId": "uuid-string"
  }
}
```

### Statistics Request

Request server statistics via WebSocket.

**Client Sends**:
```json
{
  "type": "get_stats",
  "data": {}
}
```

**Server Responds**:
```json
{
  "type": "stats_response",
  "data": {
    "totalConnections": 42,
    "activeConnections": 3,
    "totalMessages": 156,
    "uptime": 12345,
    "clientInfo": {
      "id": "uuid-string",
      "connectedAt": "2024-01-01T11:55:00.000Z",
      "messageCount": 5
    }
  }
}
```

### Error Handling

When an error occurs, server sends error message.

**Message Type**: `error`

**Server Sends**:
```json
{
  "type": "error",
  "data": {
    "message": "Invalid message format",
    "details": "Missing required field 'name'",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "agent": "mike"
  }
}
```

## 🛡️ Security

### Input Validation

- **Name field**: Required, string, 1-100 characters
- **Message format**: Must be valid JSON
- **Rate limiting**: Automatic protection against abuse

### CORS Configuration

```javascript
// Allowed origins
cors({
  origin: ['chrome-extension://*', 'http://localhost:*'],
  credentials: true
})
```

### WebSocket Security

- Connection validation
- Message format verification
- Automatic disconnection for invalid clients
- Ping/pong heartbeat for connection health

## 🔧 Error Codes

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Endpoint not found
- `500`: Internal Server Error

### WebSocket Error Types

- `invalid_message`: Malformed JSON or missing fields
- `unknown_message_type`: Unsupported message type
- `processing_error`: Server-side processing failure

## 📊 Rate Limits

- **REST API**: No explicit rate limiting (handled by connection limits)
- **WebSocket**: No message rate limiting (connection-based limits only)
- **Concurrent Connections**: Limited by server capacity

## 🧪 Testing

### cURL Examples

**Health Check**:
```bash
curl http://localhost:3000/health
```

**Send Greeting**:
```bash
curl -X POST http://localhost:3000/api/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "API Test"}'
```

**Get Statistics**:
```bash
curl http://localhost:3000/api/stats
```

### WebSocket Testing

Using `wscat` tool:

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3000

# Send hello request
{"type": "hello_request", "data": {"name": "WebSocket Test"}}
```

### Using CLI Tool

```bash
# Test REST API
hello-cli greet "CLI Test" --rest

# Test WebSocket
hello-cli greet "CLI Test"

# Check server status
hello-cli status
```

## 📈 Performance

### Response Time Targets

- **REST API**: < 100ms average
- **WebSocket**: < 50ms average
- **Health Check**: < 10ms average

### Throughput Capabilities

- **Concurrent WebSocket Connections**: 1000+
- **HTTP Requests per Second**: 1000+
- **WebSocket Messages per Second**: 5000+

### Monitoring

Monitor performance using:

- `GET /api/stats` - Server statistics
- `hello-cli status` - CLI status check
- Server logs - Detailed request logging

---

*This API documentation is maintained by Doc 📚 as part of the multi-agent development framework.*