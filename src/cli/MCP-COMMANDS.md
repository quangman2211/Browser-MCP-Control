# MCP Browser Control Commands

Emma's CLI has been extended với MCP (Model Context Protocol) browser control capabilities. These commands allow you to control browser actions through Mike's MCP Server và Sarah's Chrome Extension.

## Prerequisites

1. **Mike's MCP Server** must be running on `http://localhost:3000`
2. **Sarah's Chrome Extension** must be loaded và connected
3. **Chrome browser** với active tabs

## Available Commands

### `mcp-browser console-hello [message]`

Execute console.log in the active browser tab via MCP Server.

**Usage:**
```bash
# Basic console execution
node index.js mcp-browser console-hello

# Custom message
node index.js mcp-browser console-hello "Hello from Emma's CLI!"

# With retry attempts
node index.js mcp-browser console-hello --retry 5 "Testing message"
```

**Options:**
- `-r, --retry <number>` - Number of retry attempts (default: 3)
- `-h, --help` - Display command help

**Example Output:**
```
🌐 MCP Browser Execution Result:
  Message: "Hello from Emma's CLI!"
  Tool: mcp:tool.console_hello
  Timestamp: 8/4/2025, 10:30:45 AM
  Execution Time: 150ms
  Browser Info:
    Tab: Example Website
    URL: https://example.com
```

### `mcp-browser tools`

Discover và list all available MCP tools.

**Usage:**
```bash
# List available tools
node index.js mcp-browser tools

# Detailed tool information
node index.js mcp-browser tools --verbose
```

**Options:**
- `-v, --verbose` - Show detailed tool information including parameters
- `-h, --help` - Display command help

**Example Output:**
```
🔧 Available MCP Tools:

  1. mcp:tool.console_hello
     Description: Execute console.log in browser tab

📊 Total tools: 1
Registry version: 1.0.0
```

### `mcp-browser status`

Check MCP server và browser extension status.

**Usage:**
```bash
# Full status check
node index.js mcp-browser status

# Connection test only
node index.js mcp-browser status --connection
```

**Options:**
- `-c, --connection` - Test connection only
- `-h, --help` - Display command help

**Example Output:**
```
🏥 MCP Server Status:
  Status: healthy
  Server Type: MCP Server
  Uptime: 3600s
  Version: 1.0.0
  Active Connections: 1
  Tools Registered: 1
  Last Activity: 8/4/2025, 10:30:00 AM

🌐 Browser Extension Status:
  Connected: Yes
  Active Tabs: 3
```

## Command Aliases

You can use the shorter alias `mcp` instead of `mcp-browser`:

```bash
# These are equivalent
node index.js mcp console-hello
node index.js mcp-browser console-hello
```

## Integration Testing

The CLI includes MCP integration tests:

```bash
# Basic tests (includes MCP connection và discovery)
node index.js test

# Full tests (includes actual tool execution)
node index.js test --all
```

**Test Coverage:**
- ✅ MCP Server Connection
- ✅ MCP Tools Discovery  
- ✅ MCP Console Hello Tool Execution (với --all flag)

## End-to-End Workflow

1. **User runs CLI command:** `node index.js mcp console-hello "Hello World"`
2. **CLI calls MCP Server:** `POST /api/tools/mcp:tool.console_hello/call`
3. **MCP Server forwards to Extension:** WebSocket message to Chrome Extension
4. **Extension executes in browser:** `console.log("Hello World")` in active tab
5. **Extension responds back:** Execution result via WebSocket
6. **MCP Server returns to CLI:** HTTP response với execution details
7. **CLI displays result to user:** Formatted output với status và timing

## Error Handling

The CLI provides comprehensive error handling:

- **Connection Errors:** Clear messages when MCP Server is not running
- **Tool Errors:** Detailed error messages from tool execution
- **Retry Logic:** Automatic retries với exponential backoff
- **Troubleshooting:** Helpful tips for common issues

## Troubleshooting

**MCP Server not running:**
```
❌ Cannot connect to MCP Server. Make sure Mike's MCP server is running.

💡 Troubleshooting:
  1. Start Mike's MCP server: npm run start:server
  2. Ensure Chrome Extension is loaded
  3. Check server logs for errors
```

**Tool not found:**
```
❌ Tool 'mcp:tool.console_hello' not found in registry
```

**Extension not connected:**
```
❌ Browser Extension is not connected to MCP Server
```

## Configuration

MCP commands use the same configuration as other CLI commands:

```bash
# Set MCP server URL
node index.js config --set httpUrl=http://localhost:3001

# Set timeout
node index.js config --set timeout=10000

# Set retry attempts  
node index.js config --set retries=5
```

## Development Notes

- **MCP Client:** Located in `src/cli/mcp-client.js`
- **Command Handlers:** Integrated into main `src/cli/index.js`
- **HTTP API Integration:** Uses axios for MCP Server communication
- **Error Handling:** Comprehensive error messages và troubleshooting guidance
- **Retry Logic:** Exponential backoff for failed requests

---

Built by **Emma - Integration Engineer Agent** 🔧
Part of the Multi-Agent Development System