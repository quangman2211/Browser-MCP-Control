# Usage Guide - Browser-MCP-Control System

This guide provides comprehensive usage instructions for the Browser-MCP-Control system, covering CLI commands, browser integration, and workflow examples.

## 🚀 Getting Started

### System Startup Sequence

1. **Start MCP Server**:
```bash
cd src/server
npm start
# ✅ MCP Server running on http://localhost:3000
# ✅ WebSocket server ready for extension connections
```

2. **Verify Extension is Loaded**:
   - Open Chrome browser
   - Check extension icon in toolbar
   - Extension should show "Connected" status

3. **Test CLI Connection**:
```bash
mcp-browser status
# ✅ MCP Server: Connected (http://localhost:3000)
# ✅ Chrome Extension: Active
# ✅ WebSocket: Established
```

## 📋 CLI Commands Reference

### Core Browser Control Commands

#### `mcp-browser console-hello`
Execute console.log in active browser tab.

```bash
# Basic usage
mcp-browser console-hello "Hello World!"

# With custom styling
mcp-browser console-hello "Styled message" --style "color: red; font-size: 16px;"

# With retry options
mcp-browser console-hello "Retry test" --retry 3

# Verbose output
mcp-browser console-hello "Debug message" --verbose
```

**Output:**
```
🎯 Executing console.log in browser...
✅ Command sent to MCP Server
✅ WebSocket message delivered to extension
✅ Console.log executed in active tab
📝 Check browser console for output: "Hello World!"
```

#### `mcp-browser tools`
List available MCP tools and their capabilities.

```bash
# List all tools
mcp-browser tools

# Detailed tool information
mcp-browser tools --verbose

# Filter tools by category
mcp-browser tools --category browser
```

**Output:**
```
📊 Available MCP Tools:

🔧 mcp:tool.console_hello
   Description: Execute console.log commands in browser tabs
   Parameters: message (string), style (optional)
   Status: ✅ Active

🔧 Future tools will appear here...
```

#### `mcp-browser status`
Check system status and connectivity.

```bash
# Basic status check
mcp-browser status

# Detailed system information
mcp-browser status --detailed

# Check specific components
mcp-browser status --component server
mcp-browser status --component extension
```

**Output:**
```
🎯 Browser-MCP-Control System Status:

🌐 MCP Server: ✅ Connected (http://localhost:3000)
   Uptime: 2h 34m
   Active connections: 1
   Tools registered: 1

🔌 Chrome Extension: ✅ Active
   WebSocket: ✅ Connected
   Active tabs: 3

⚡ CLI Tool: ✅ Ready
   Version: 1.0.0
   Command history: 5 commands
```

### System Management Commands

#### `mcp-browser logs`
View system logs and debugging information.

```bash
# Recent logs
mcp-browser logs

# Filter by component
mcp-browser logs --component server
mcp-browser logs --component extension

# Follow logs in real-time
mcp-browser logs --follow

# Error logs only
mcp-browser logs --level error
```

#### `mcp-browser test`
Run system connectivity and functionality tests.

```bash
# Basic connectivity test
mcp-browser test

# Full system test
mcp-browser test --full

# Performance test
mcp-browser test --performance
```

### Advanced Options

#### Global Flags
Available for all commands:

- `--verbose`: Detailed output and debugging information
- `--quiet`: Minimal output, errors only
- `--timeout <ms>`: Command timeout (default: 5000ms)
- `--retry <count>`: Number of retry attempts (default: 1)

#### Configuration Options

```bash
# Set default server URL
mcp-browser config set server-url http://localhost:3000

# Set default timeout
mcp-browser config set timeout 10000

# View current configuration
mcp-browser config list
```

## 🌐 Browser Integration

### Extension Features

#### WebSocket Connection
The Chrome extension maintains a persistent WebSocket connection to the MCP Server:

- **Auto-reconnect**: Automatically reconnects if connection drops
- **Status indicator**: Visual indicator in extension popup
- **Real-time commands**: Instant command execution from CLI

#### Console Execution
When `console-hello` commands are executed:

1. **CLI sends command** → MCP Server
2. **Server routes via WebSocket** → Chrome Extension  
3. **Extension injects content script** → Active browser tab
4. **Content script executes** → `console.log()` in browser console
5. **Visual confirmation** → Overlay appears briefly in tab

#### Visual Feedback
- **Success overlay**: Green confirmation when command executes
- **Error overlay**: Red notification if command fails
- **Extension badge**: Shows connection status

### Browser Console Output

When using `mcp-browser console-hello`, check browser developer console:

```javascript
// Standard output
"Hello World!"

// Styled output (with --style flag)
%c"Styled message", "color: red; font-size: 16px;"

// With metadata
"[MCP-Browser] Hello World! (timestamp: 2024-01-01 12:00:00)"
```

## 🎯 Workflow Examples

### Basic Browser Automation

```bash
# Start system
cd src/server && npm start &

# Test connection
mcp-browser status

# Send message to browser console
mcp-browser console-hello "Starting automation sequence..."

# Execute multiple commands
mcp-browser console-hello "Step 1: Initialize"
mcp-browser console-hello "Step 2: Process data"
mcp-browser console-hello "Step 3: Complete"
```

### Development Workflow

```bash
# Monitor system status while developing
mcp-browser status --follow &

# Test new features
mcp-browser console-hello "Testing new feature..." --verbose

# Check logs for debugging
mcp-browser logs --component server --level debug

# Run comprehensive tests
cd tests && npm test
```

### Debugging Workflow

```bash
# Enable verbose logging
mcp-browser console-hello "Debug test" --verbose

# Check specific component status
mcp-browser status --component extension --detailed

# Follow logs in real-time
mcp-browser logs --follow --level all

# Test system resilience
mcp-browser test --full --retry 3
```

## 🔧 Advanced Usage

### Custom Styling

```bash
# Colored console output
mcp-browser console-hello "Success!" --style "color: green; font-weight: bold;"

# Large text
mcp-browser console-hello "Important!" --style "font-size: 24px; color: red;"

# Custom formatting
mcp-browser console-hello "Data: {value: 123}" --style "font-family: monospace;"
```

### Batch Operations

```bash
# Using shell scripting
for i in {1..5}; do
  mcp-browser console-hello "Message $i"
  sleep 1
done

# With error handling
if mcp-browser status --quiet; then
  mcp-browser console-hello "System ready!"
else
  echo "System not ready, please check server"
fi
```

### Integration with Other Tools

```bash
# Pipe data to browser console
echo "Processing complete" | xargs mcp-browser console-hello

# Use with watch for monitoring
watch -n 5 'mcp-browser status --component server'

# Integration with scripts
./my-script.sh && mcp-browser console-hello "Script completed successfully"
```

## 📊 Performance Tips

### Optimal Usage Patterns

1. **Keep server running**: Don't restart server frequently
2. **Use appropriate timeouts**: Increase timeout for slow connections
3. **Batch similar commands**: Group related console messages
4. **Monitor system status**: Check status before executing commands

### Performance Monitoring

```bash
# Check system performance
mcp-browser test --performance

# Monitor response times
time mcp-browser console-hello "Performance test"

# View detailed timing
mcp-browser console-hello "Test" --verbose | grep "took"
```

## 🚨 Error Handling

### Common Error Scenarios

#### Server Not Running
```bash
$ mcp-browser console-hello "test"
❌ Error: Cannot connect to MCP Server (http://localhost:3000)
💡 Solution: Start server with 'cd src/server && npm start'
```

#### Extension Not Connected
```bash
$ mcp-browser status
🌐 MCP Server: ✅ Connected
🔌 Chrome Extension: ❌ Not connected
💡 Solution: Reload extension or check WebSocket connection
```

#### Browser Tab Issues
```bash
$ mcp-browser console-hello "test"
⚠️  Warning: No active browser tab found
💡 Solution: Open a browser tab and try again
```

### Error Recovery

```bash
# Test system recovery
mcp-browser test --recovery

# Force reconnection
mcp-browser status --reconnect

# Reset extension connection
# (requires extension reload in Chrome)
```

## 📈 Best Practices

### 1. System Management
- Always start server before using CLI commands
- Check system status before batch operations
- Monitor logs for debugging information

### 2. Command Usage  
- Use verbose mode when debugging issues
- Set appropriate timeouts for slow connections
- Use retry options for unreliable connections

### 3. Browser Integration
- Keep browser tabs active for reliable execution
- Check browser console for command output
- Use extension popup to monitor connection status

### 4. Development Workflow
- Run tests after making changes
- Use logging to debug complex workflows
- Test error scenarios regularly

## 🎓 Learning Resources

### Understanding MCP Protocol
- MCP commands flow: CLI → Server → Extension → Browser
- WebSocket maintains real-time connection
- Tool registry manages available commands

### Extending Functionality
- Add new MCP tools to `src/server/mcp-tools.js`
- Extend CLI commands in `src/cli/`
- Add browser APIs to extension content scripts

### Testing Your Changes
```bash
# Run full test suite
cd tests && npm test

# Test specific components
npm run test:unit
npm run test:integration  
npm run test:e2e
```

---

**Ready to automate your browser with CLI commands!**

*This usage guide covers the complete Browser-MCP-Control workflow from basic commands to advanced automation scenarios.*