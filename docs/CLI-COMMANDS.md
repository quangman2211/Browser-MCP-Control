# CLI Commands Reference

## Overview

The Browser-MCP-Control CLI provides intuitive command-line access to browser automation through the MCP (Multi-Agent Command Protocol) system. Built by Emma 🔧, the CLI offers both MCP browser control commands and legacy server interaction commands.

## Installation

```bash
cd src/cli
npm install
npm link  # Install globally
```

## Global Options

All commands support these global options:

- `--help` - Show help information
- `--version` - Show version information
- `--verbose` - Enable verbose output

## MCP Browser Control Commands

### mcp-browser

The main command for browser automation via MCP protocol.

```bash
mcp-browser <subcommand> [parameters] [options]
```

**Aliases:** `mcp`

---

### mcp-browser console-hello

Execute console.log statements in browser tabs.

**Syntax:**
```bash
mcp-browser console-hello [message] [options]
```

**Parameters:**
- `message` (optional) - Text to log to browser console
  - Default: "Hello from Emma's CLI via MCP Browser Control!"
  - Maximum length: 500 characters

**Options:**
- `-r, --retry <number>` - Number of retry attempts (default: 3)

**Examples:**
```bash
# Basic usage with default message
mcp-browser console-hello

# Custom message
mcp-browser console-hello "Hello World!"

# With retry configuration
mcp-browser console-hello "Test message" --retry 5

# Verbose output
mcp-browser console-hello "Debug message" --verbose
```

**Output:**
```
✓ Console.log executed successfully in browser!

🌐 MCP Browser Execution Result:
  Message: "Hello World!"
  Tool: mcp:tool.console_hello
  Timestamp: 8/4/2024, 10:30:00 AM
  Execution Time: 145ms
  Browser Info:
    Tab: Example Page
    URL: https://example.com
```

**Error Handling:**
```bash
# Server not running
❌ Error details:
  Cannot connect to MCP Server. Make sure Mike's MCP server is running.

💡 Troubleshooting:
  1. Start Mike's MCP server: npm run start:server
  2. Ensure Chrome Extension is loaded
  3. Check server logs for errors
```

---

### mcp-browser tools

List and discover available MCP tools.

**Syntax:**
```bash
mcp-browser tools [options]
```

**Options:**
- `-v, --verbose` - Show detailed tool information including parameters and examples

**Examples:**
```bash
# List all tools
mcp-browser tools

# Detailed tool information
mcp-browser tools --verbose
```

**Output (Basic):**
```
🔧 Available MCP Tools:

  1. mcp:tool.console_hello
     Description: Execute console.log message in browser tab via Chrome Extension

📊 Total tools: 1
Registry version: 1.0.0
```

**Output (Verbose):**
```
🔧 Available MCP Tools:

  1. mcp:tool.console_hello
     Description: Execute console.log message in browser tab via Chrome Extension
     Parameters:
       - message: string (required)
         Message to log to browser console
       - targetTab: string
         Target tab selector: active, all, or specific tab ID

📊 Total tools: 1
Registry version: 1.0.0
```

---

### mcp-browser status

Check MCP system status and connectivity.

**Syntax:**
```bash
mcp-browser status [options]
```

**Options:**
- `-c, --connection` - Test connection only (skip detailed status)

**Examples:**
```bash
# Full system status
mcp-browser status

# Connection test only
mcp-browser status --connection
```

**Output (Full Status):**
```
🏥 MCP Server Status:
  Status: healthy
  Server Type: MCP Server
  Uptime: 123s
  Version: 1.0.0
  Active Connections: 2
  Tools Registered: 1
  Last Activity: 8/4/2024, 10:29:45 AM

🌐 Browser Extension Status:
  Connected: Yes
  Active Tabs: 3
```

**Output (Connection Only):**
```
✅ MCP Server is reachable
```

---

## Legacy Server Commands

### hello-cli

Original server interaction commands (maintained for backward compatibility).

```bash
hello-cli <command> [parameters] [options]
```

---

### hello-cli greet

Send greeting to MCP server.

**Syntax:**
```bash
hello-cli greet [name] [options]
```

**Parameters:**
- `name` (optional) - Name to include in greeting
  - Default: Current system user or "Anonymous"

**Options:**
- `-w, --websocket` - Use WebSocket connection (default)
- `-r, --rest` - Use REST API instead of WebSocket
- `-i, --interactive` - Interactive mode with prompts

**Examples:**
```bash
# Basic greeting via WebSocket
hello-cli greet "John"

# Using REST API
hello-cli greet "Jane" --rest

# Interactive mode
hello-cli greet --interactive
```

**Output (WebSocket):**
```
🔗 Server Response (WebSocket):
  Hello John! Welcome to the Multi-Agent Hello World demo! 🎉
  Agent: mike
  Client ID: client-123e4567-e89b
  Server Time: 8/4/2024, 10:30:00 AM
  Message Count: 1
```

**Output (REST API):**
```
📡 Server Response (REST API):
  Hello Jane! This greeting comes from Mike's REST API endpoint! 🎯
  Agent: mike
  Time: 8/4/2024, 10:30:00 AM
  Response ID: resp-123e4567-e89b
```

---

### hello-cli status

Check server health and statistics.

**Syntax:**
```bash
hello-cli status [options]
```

**Options:**
- `-v, --verbose` - Show detailed information including recent messages

**Examples:**
```bash
# Basic status
hello-cli status

# Detailed status
hello-cli status --verbose
```

**Output:**
```
🏥 Server Health:
  Status: healthy
  Agent: mike
  Version: 1.0.0
  Uptime: 123s

📊 Server Statistics:
  Total Connections: 5
  Active Connections: 2
  Total Messages: 25
```

---

### hello-cli interactive

Start interactive session with the server.

**Syntax:**
```bash
hello-cli interactive
```

**Usage:**
- Type names to send greetings
- Type "exit" to quit

**Example Session:**
```
🔗 Starting interactive session...
✓ Connected to server!

Type messages to send to the server. Type "exit" to quit.

? Enter your name (or "exit"): Alice
  Server: Hello Alice! Great to meet you! 👋

? Enter your name (or "exit"): Bob
  Server: Greetings Bob! The server is happy to see you! 😊

? Enter your name (or "exit"): exit

Interactive session ended. Goodbye! 👋
```

---

### hello-cli config

Manage CLI configuration settings.

**Syntax:**
```bash
hello-cli config [options]
```

**Options:**
- `-s, --set <key=value>` - Set configuration value
- `-g, --get <key>` - Get configuration value
- `-l, --list` - List all configuration
- `-r, --reset` - Reset to default configuration

**Configuration Keys:**
- `serverUrl` - WebSocket server URL (default: ws://localhost:3000)
- `httpUrl` - HTTP server URL (default: http://localhost:3000)
- `defaultName` - Default name for greetings (default: system user)
- `timeout` - Connection timeout in milliseconds (default: 5000)
- `retries` - Default retry count (default: 3)

**Examples:**
```bash
# Set server URL
hello-cli config --set serverUrl=ws://localhost:4000

# Get current timeout
hello-cli config --get timeout

# List all settings
hello-cli config --list

# Reset to defaults
hello-cli config --reset
```

---

### hello-cli test

Run connectivity and functionality tests.

**Syntax:**
```bash
hello-cli test [options]
```

**Options:**
- `-a, --all` - Run all tests including MCP browser control

**Test Categories:**
1. **Server Health Check** - Basic connectivity test
2. **REST API Test** - HTTP endpoint validation
3. **WebSocket Connection** - WebSocket connectivity test
4. **MCP Server Connection** - MCP protocol connectivity
5. **MCP Tools Discovery** - Tool registry validation
6. **MCP Console Hello Tool** - Complete browser workflow test (with --all)

**Examples:**
```bash
# Basic tests
hello-cli test

# All tests including browser automation
hello-cli test --all
```

**Output:**
```
🧪 Running CLI tests...

✅ Server Health Check
✅ REST API Test
✅ WebSocket Connection
✅ MCP Server Connection
✅ MCP Tools Discovery
✅ MCP Console Hello Tool

🎉 Test suite completed!
```

---

## Global Configuration

### Configuration File

The CLI stores configuration in a platform-specific location:

- **Linux/macOS**: `~/.config/hello-cli/config.json`
- **Windows**: `%APPDATA%/hello-cli/config.json`

### Environment Variables

You can override configuration using environment variables:

```bash
export MCP_SERVER_URL=http://localhost:3000
export MCP_WS_URL=ws://localhost:3000
export MCP_DEFAULT_NAME="Your Name"
export MCP_TIMEOUT=10000
export MCP_RETRIES=5
```

---

## Error Handling

### Common Error Scenarios

**MCP Server Not Running:**
```bash
❌ Cannot connect to MCP Server. Make sure Mike's MCP server is running.

💡 Troubleshooting:
  1. Start Mike's MCP server: npm run start:server
  2. Ensure Chrome Extension is loaded
  3. Check server logs for errors
```

**Chrome Extension Not Connected:**
```bash
❌ Error details:
  Browser tab not available for content script injection

💡 Troubleshooting:
  1. Verify extension is loaded in chrome://extensions/
  2. Ensure active browser tab is available
  3. Try refreshing the browser tab
```

**Network Connection Issues:**
```bash
❌ Connection timeout after 5000ms

💡 Try:
  1. Check if server is running on correct port
  2. Verify firewall settings
  3. Increase timeout: hello-cli config --set timeout=10000
```

**Invalid Parameters:**
```bash
❌ Invalid parameters: message must be between 1-500 characters

💡 Fix:
  1. Check message length
  2. Use quotes for messages with spaces
  3. See: mcp-browser console-hello --help
```

### Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Server connection error
- `4` - Tool execution error
- `5` - Configuration error

---

## Advanced Usage

### Scripting and Automation

**Bash Script Example:**
```bash
#!/bin/bash

# Check if MCP server is running
if ! mcp-browser status --connection > /dev/null 2>&1; then
  echo "MCP server not running. Starting..."
  npm start --prefix ../server &
  sleep 3
fi

# Execute browser automation
mcp-browser console-hello "Automated message from script"

# Check execution result
if [ $? -eq 0 ]; then
  echo "Browser automation successful"
else
  echo "Browser automation failed"
  exit 1
fi
```

**PowerShell Script Example:**
```powershell
# Test MCP connection
$status = mcp-browser status --connection 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "MCP server not running. Please start the server first."
    exit 1
}

# Execute browser command
mcp-browser console-hello "PowerShell automation test"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Browser automation completed successfully"
} else {
    Write-Host "Browser automation failed"
    exit 1
}
```

### Batch Operations

**Multiple Commands:**
```bash
# Execute multiple console commands
for message in "Message 1" "Message 2" "Message 3"; do
  mcp-browser console-hello "$message"
  sleep 1
done
```

**With Error Handling:**
```bash
#!/bin/bash

messages=("Hello" "World" "Test")
failed=0

for msg in "${messages[@]}"; do
  if ! mcp-browser console-hello "$msg" --retry 3; then
    echo "Failed to execute: $msg"
    ((failed++))
  fi
done

if [ $failed -gt 0 ]; then
  echo "$failed commands failed"
  exit 1
fi

echo "All commands executed successfully"
```

---

## Performance Considerations

### Execution Times

- **MCP Server Connection**: ~50ms
- **Tool Discovery**: ~100ms
- **Console Execution**: ~150ms (typical)
- **Full CLI-to-Browser Workflow**: <2000ms (target)

### Optimization Tips

1. **Connection Reuse**: The CLI optimizes WebSocket connections automatically
2. **Batch Operations**: Use loops for multiple commands rather than starting CLI repeatedly
3. **Retry Logic**: Configure appropriate retry counts for reliability
4. **Timeout Settings**: Adjust timeouts based on network conditions

### Monitoring

**Check performance:**
```bash
# Time a command
time mcp-browser console-hello "Performance test"

# Multiple executions for average
for i in {1..10}; do
  time mcp-browser console-hello "Test $i"
done
```

---

## Development and Debugging

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Verbose CLI output
mcp-browser console-hello "Debug test" --verbose

# Enable debug logs
DEBUG=* mcp-browser console-hello "Debug test"
```

### Log Locations

- **CLI Logs**: Displayed in terminal output
- **Server Logs**: `src/server/combined.log`
- **Extension Logs**: Chrome DevTools → Extensions → Background Page

### Contributing

When adding new CLI commands:

1. Follow the existing command structure
2. Add comprehensive help text
3. Include error handling and user feedback
4. Add examples to this documentation
5. Test with various input scenarios

---

## Version History

- **v1.0.0** - Initial Browser-MCP-Control implementation
  - Added `mcp-browser` commands
  - MCP protocol integration
  - Chrome Extension communication
  - E2E browser automation workflow

- **v0.x** - Legacy Hello World Demo
  - Basic `hello-cli` commands
  - WebSocket and REST API communication
  - Interactive mode