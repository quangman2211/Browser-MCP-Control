# MCP Server API Reference

## Overview

The Browser-MCP-Control system exposes a comprehensive HTTP API for interacting with the MCP (Multi-Agent Command Protocol) server. This API enables CLI tools and other clients to discover, validate, and execute browser automation tools.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, the system operates in development mode with no authentication required. All endpoints are accessible without credentials.

## Content Types

- **Request Content-Type**: `application/json`
- **Response Content-Type**: `application/json`

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error description",
  "agent": "mike",
  "timestamp": "2024-08-04T10:30:00.000Z",
  "details": {}
}
```

## Health & Status Endpoints

### GET /health

Check server health and basic system information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-08-04T10:30:00.000Z",
  "agent": "mike",
  "server": "hello-world-mcp-server",
  "version": "1.0.0",
  "uptime": 123456,
  "stats": {
    "totalConnections": 5,
    "activeConnections": 2,
    "totalMessages": 25,
    "uptime": 123456
  }
}
```

**Status Codes:**
- `200` - Server is healthy
- `500` - Server error

---

## MCP Tool Discovery

### GET /api/tools

Discover all available MCP tools in the registry.

**Response:**
```json
{
  "protocol": "MCP",
  "version": "1.0.0",
  "server": "hello-world-mcp-server",
  "agent": "mike",
  "toolCount": 1,
  "tools": [
    {
      "name": "mcp:tool.console_hello",
      "description": "Execute console.log message in browser tab via Chrome Extension",
      "version": "1.0.0",
      "agent": "mike",
      "parameters": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string",
            "default": "Hello World",
            "description": "Message to log to browser console",
            "minLength": 1,
            "maxLength": 500
          },
          "targetTab": {
            "type": "string",
            "default": "active",
            "description": "Target tab selector: active, all, or specific tab ID",
            "enum": ["active", "all"]
          }
        },
        "required": ["message"],
        "additionalProperties": false
      },
      "returns": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean" },
          "result": { "type": "string" },
          "timestamp": { "type": "string" },
          "executionMetadata": {
            "type": "object",
            "properties": {
              "tabId": { "type": "number" },
              "url": { "type": "string" },
              "executionTime": { "type": "number" },
              "agent": { "type": "string" }
            }
          },
          "error": { "type": "string" }
        }
      },
      "callCount": 15,
      "lastCalled": "2024-08-04T10:25:00.000Z",
      "registeredAt": "2024-08-04T08:00:00.000Z"
    }
  ],
  "capabilities": [
    "tool_registry",
    "tool_discovery",
    "tool_validation",
    "execution_tracking",
    "websocket_extension_integration"
  ],
  "timestamp": "2024-08-04T10:30:00.000Z"
}
```

**Status Codes:**
- `200` - Tools retrieved successfully
- `500` - Server error

---

## MCP Tool Execution

### POST /api/tools/:toolName/call

Execute a specific MCP tool with provided parameters.

**URL Parameters:**
- `toolName` (string) - Name of the tool to execute (e.g., `mcp:tool.console_hello`)

**Request Body:**
```json
{
  "message": "Hello World from API!",
  "targetTab": "active"
}
```

**Response (Success):**
```json
{
  "id": "exec-123e4567-e89b-12d3-a456-426614174000",
  "success": true,
  "result": "Console execution completed successfully",
  "timestamp": "2024-08-04T10:30:00.000Z",
  "executionTime": 145,
  "data": {
    "message": "Hello World from API!",
    "executedAt": "2024-08-04T10:30:00.000Z",
    "browserInfo": {
      "tabId": 123456789,
      "url": "https://example.com",
      "title": "Example Page"
    }
  },
  "agent": "mike",
  "toolName": "mcp:tool.console_hello"
}
```

**Response (Error):**
```json
{
  "error": "Tool execution failed: Browser tab not available",
  "agent": "mike",
  "executionId": "exec-123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-08-04T10:30:00.000Z",
  "details": {
    "toolName": "mcp:tool.console_hello",
    "parameters": {
      "message": "Hello World from API!",
      "targetTab": "active"
    },
    "errorCode": "NO_ACTIVE_TAB"
  }
}
```

**Status Codes:**
- `200` - Tool executed successfully
- `400` - Invalid parameters or tool name
- `404` - Tool not found
- `500` - Execution error

**Parameter Validation:**

The server validates all parameters against the tool's schema:

- **message** (required): String between 1-500 characters
- **targetTab** (optional): Must be "active" or "all"

---

## MCP System Status

### GET /api/tools/status

Get detailed MCP system status and execution statistics.

**Response:**
```json
{
  "protocolStatus": {
    "version": "1.0.0",
    "healthy": true,
    "lastActivity": "2024-08-04T10:29:45.000Z"
  },
  "executionStats": {
    "totalTools": 1,
    "totalExecutions": 25,
    "recentExecutions": [
      {
        "id": "exec-123e4567-e89b-12d3-a456-426614174000",
        "toolName": "mcp:tool.console_hello",
        "timestamp": "2024-08-04T10:25:00.000Z",
        "success": true,
        "executionTime": 132
      }
    ],
    "toolUsage": [
      {
        "name": "mcp:tool.console_hello",
        "callCount": 25,
        "lastCalled": "2024-08-04T10:25:00.000Z"
      }
    ],
    "timestamp": "2024-08-04T10:30:00.000Z",
    "agent": "mike"
  },
  "protocolHealth": {
    "websocketConnections": 1,
    "toolRegistrations": 1,
    "lastHeartbeat": "2024-08-04T10:30:00.000Z"
  },
  "timestamp": "2024-08-04T10:30:00.000Z",
  "agent": "mike"
}
```

**Status Codes:**
- `200` - Status retrieved successfully
- `500` - Server error

---

## Legacy Endpoints

### GET /api/stats

Get general server statistics (legacy endpoint).

**Response:**
```json
{
  "totalConnections": 10,
  "activeConnections": 2,
  "totalMessages": 45,
  "uptime": 123456,
  "timestamp": "2024-08-04T10:30:00.000Z",
  "agent": "mike",
  "recentMessages": [
    {
      "clientId": "client-uuid",
      "timestamp": "2024-08-04T10:25:00.000Z",
      "type": "console_hello",
      "data": {
        "message": "Test message"
      }
    }
  ]
}
```

### GET /api/clients

Get information about connected WebSocket clients.

**Response:**
```json
{
  "activeConnections": 2,
  "clients": [
    {
      "id": "client-123e4567-e89b-12d3-a456-426614174000",
      "connectedAt": "2024-08-04T10:20:00.000Z",
      "messageCount": 5,
      "ip": "127.0.0.1"
    }
  ],
  "timestamp": "2024-08-04T10:30:00.000Z",
  "agent": "mike"
}
```

### GET /api/test

Simple test endpoint for connectivity validation.

**Response:**
```json
{
  "message": "MCP Server is working correctly!",
  "agent": "mike",
  "timestamp": "2024-08-04T10:30:00.000Z",
  "requestFrom": "127.0.0.1",
  "testPassed": true
}
```

---

## WebSocket API

### Connection

Connect to the WebSocket server for real-time MCP protocol communication:

```
ws://localhost:3000
```

### Message Format

All WebSocket messages use JSON format:

```json
{
  "type": "message_type",
  "data": {},
  "timestamp": "2024-08-04T10:30:00.000Z",
  "source": "client_identifier"
}
```

### Available Message Types

#### Client to Server

- `client_identify` - Client identification
- `ping` - Connection keepalive
- `console_hello_response` - Response from extension

#### Server to Client

- `server_info` - Server welcome message
- `console_hello` - Execute console command
- `pong` - Ping response

### Example WebSocket Communication

**Client Identification:**
```json
{
  "type": "client_identify",
  "data": {
    "client": "chrome_extension_background",
    "agent": "sarah",
    "capabilities": ["console_execution", "tab_injection"]
  }
}
```

**Console Execution Command:**
```json
{
  "type": "console_hello",
  "data": {
    "message": "Hello from WebSocket!",
    "requestId": "req-123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Execution Response:**
```json
{
  "type": "console_hello_response",
  "data": {
    "success": true,
    "message": "Hello from WebSocket!",
    "executed_at": "2024-08-04T10:30:00.000Z",
    "page_url": "https://example.com",
    "page_title": "Example Page",
    "tabId": 123456789
  },
  "timestamp": "2024-08-04T10:30:00.000Z",
  "source": "chrome_extension_content"
}
```

---

## Error Codes

### Tool Execution Errors

- `TOOL_NOT_FOUND` - Requested tool does not exist
- `INVALID_PARAMETERS` - Parameters failed validation
- `NO_ACTIVE_TAB` - No browser tab available for execution
- `EXTENSION_DISCONNECTED` - Chrome Extension not connected
- `EXECUTION_TIMEOUT` - Tool execution timed out
- `BROWSER_ERROR` - Error in browser console execution

### Server Errors

- `INTERNAL_SERVER_ERROR` - General server error
- `WEBSOCKET_ERROR` - WebSocket communication error
- `PROTOCOL_ERROR` - MCP protocol violation

---

## Rate Limiting

Currently, no rate limiting is implemented. In production deployments, consider implementing:

- **Tool Execution**: 10 requests per minute per client
- **Discovery**: 100 requests per minute per client
- **WebSocket**: 1000 messages per minute per connection

---

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class MCPClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  async discoverTools() {
    const response = await axios.get(`${this.baseURL}/api/tools`);
    return response.data;
  }

  async executeTool(toolName, parameters) {
    const response = await axios.post(
      `${this.baseURL}/api/tools/${toolName}/call`,
      parameters
    );
    return response.data;
  }

  async getStatus() {
    const response = await axios.get(`${this.baseURL}/api/tools/status`);
    return response.data;
  }
}

// Usage
const client = new MCPClient();

async function example() {
  // Discover available tools
  const tools = await client.discoverTools();
  console.log('Available tools:', tools.tools.length);

  // Execute console_hello tool
  const result = await client.executeTool('mcp:tool.console_hello', {
    message: 'Hello from JavaScript!'
  });
  console.log('Execution result:', result.success);
}
```

### Python

```python
import requests
import json

class MCPClient:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url

    def discover_tools(self):
        response = requests.get(f'{self.base_url}/api/tools')
        return response.json()

    def execute_tool(self, tool_name, parameters):
        response = requests.post(
            f'{self.base_url}/api/tools/{tool_name}/call',
            json=parameters
        )
        return response.json()

    def get_status(self):
        response = requests.get(f'{self.base_url}/api/tools/status')
        return response.json()

# Usage
client = MCPClient()

# Discover tools
tools = client.discover_tools()
print(f"Available tools: {len(tools['tools'])}")

# Execute tool
result = client.execute_tool('mcp:tool.console_hello', {
    'message': 'Hello from Python!'
})
print(f"Execution success: {result['success']}")
```

### cURL Examples

**Discover Tools:**
```bash
curl -X GET http://localhost:3000/api/tools
```

**Execute Tool:**
```bash
curl -X POST http://localhost:3000/api/tools/mcp:tool.console_hello/call \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from cURL!"}'
```

**Check Status:**
```bash
curl -X GET http://localhost:3000/api/tools/status
```

---

## Versioning

The current API version is `1.0.0`. Future versions will maintain backward compatibility for:

- Core endpoint URLs
- Required parameter schemas
- Response data structures

Breaking changes will be introduced in new major versions with appropriate deprecation notices.