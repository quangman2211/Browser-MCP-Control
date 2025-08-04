# Troubleshooting Guide

## Overview

This guide covers common issues with the Browser-MCP-Control system and provides step-by-step solutions. The system involves multiple components (CLI, MCP Server, Chrome Extension) that must work together seamlessly.

## Quick System Health Check

Before diving into specific issues, run these commands to check overall system health:

```bash
# 1. Check MCP server status
mcp-browser status

# 2. Test basic connectivity
hello-cli test

# 3. Verify Chrome Extension is loaded
# Navigate to chrome://extensions/ and ensure the extension is enabled
```

---

## Common Issues

### 1. MCP Browser Commands Not Working

**Symptoms:**
- `mcp-browser console-hello` fails with connection errors
- CLI shows "Cannot connect to MCP Server"
- Commands hang or timeout

**Root Causes:**
- MCP Server not running
- Chrome Extension not loaded or disconnected
- CLI not installed properly
- Port conflicts or firewall issues

**Solutions:**

#### Step 1: Start MCP Server
```bash
cd src/server
npm install
npm start
```

**Expected Output:**
```
🚀 Hello World MCP Server started by Mike ⚙️
📡 HTTP Server: http://localhost:3000
🔗 WebSocket Server: ws://localhost:3000
💻 Ready for Sarah's extension và Emma's CLI!
```

#### Step 2: Verify Extension is Loaded
1. Open Chrome and navigate to `chrome://extensions/`
2. Ensure "Developer mode" is enabled (toggle in top right)
3. Verify the Browser-MCP-Control extension is present and enabled
4. Check that the extension shows "Service Worker (Inactive)" or "Service Worker"

#### Step 3: Test CLI Installation
```bash
# Verify CLI is installed
which mcp-browser

# If not found, reinstall
cd src/cli
npm install
npm link

# Test basic connectivity
mcp-browser status --connection
```

#### Step 4: Check Port Availability
```bash
# Check if port 3000 is in use
lsof -i :3000   # macOS/Linux
netstat -an | findstr 3000   # Windows

# If port is in use by another process, either:
# 1. Stop that process, or
# 2. Configure server to use different port
```

---

### 2. Extension WebSocket Connection Failed

**Symptoms:**
- Extension shows "disconnected" in browser console
- MCP Server logs show connection attempts but immediate disconnections
- Browser console shows WebSocket connection errors

**Root Causes:**
- Server not accessible from extension
- WebSocket protocol mismatch
- CORS or security policy issues
- Extension permissions insufficient

**Solutions:**

#### Step 1: Check Extension Background Page
1. Go to `chrome://extensions/`
2. Find your extension and click "Service Worker" link
3. Check for WebSocket connection errors in the console

**Common Error Messages:**
```javascript
// Connection refused
WebSocket connection to 'ws://localhost:3000/' failed: Error in connection establishment

// Protocol error
WebSocket connection to 'ws://localhost:3000/' failed: Error during WebSocket handshake
```

#### Step 2: Verify Server WebSocket Support
```bash
# Test WebSocket connection manually
npx wscat -c ws://localhost:3000

# Should connect and show server messages
# If this fails, the server WebSocket is not working properly
```

#### Step 3: Check Extension Manifest
Verify the extension manifest allows localhost connections:

```json
{
  "host_permissions": [
    "http://localhost:3000/*",
    "ws://localhost:3000/*"
  ]
}
```

#### Step 4: Restart Extension
1. Go to `chrome://extensions/`
2. Click the refresh icon on your extension
3. Wait 5 seconds for reconnection
4. Check background page console for connection success

---

### 3. Console.log Not Appearing in Browser

**Symptoms:**
- CLI reports successful execution
- No console.log appears in browser DevTools
- Visual confirmation overlay doesn't show

**Root Causes:**
- Content script not injected properly
- Browser tab not active or accessible
- Content script permissions missing
- Console execution blocked by page security

**Solutions:**

#### Step 1: Verify Active Tab
1. Ensure you have an active browser tab open
2. Make sure the tab is not chrome:// internal page
3. Try on a simple webpage like `https://example.com`

#### Step 2: Check Content Script Injection
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `console.log('Manual test')`
4. If this doesn't work, the page may block console access

#### Step 3: Verify Extension Permissions
Check extension has activeTab permission:

```json
{
  "permissions": ["activeTab", "scripting"],
  "host_permissions": ["<all_urls>"]
}
```

#### Step 4: Test on Different Page
```bash
# Try on a simple page
# 1. Navigate to https://example.com
# 2. Run command
mcp-browser console-hello "Test on example.com"

# Check if console.log appears in DevTools
```

#### Step 5: Check Content Script Loading
In browser DevTools:
1. Go to Sources tab
2. Look for extension content scripts
3. Verify the console execution code is present

---

### 4. CLI Tool Installation Issues

**Symptoms:**
- `command not found: mcp-browser`
- `npm link` fails or doesn't create global command
- Permission errors during installation

**Root Causes:**
- npm global bin path not in PATH
- Permissions issues with global npm packages
- Node.js version incompatibility
- npm cache corruption

**Solutions:**

#### Step 1: Check Node.js Version
```bash
node --version  # Should be 16.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

#### Step 2: Fix npm Global Path
```bash
# Check npm global bin path
npm config get prefix

# Add to PATH if missing (Linux/macOS)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Windows
# Add npm global bin path to System PATH environment variable
```

#### Step 3: Reinstall with Proper Permissions
```bash
cd src/cli

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install

# Link globally with proper permissions
sudo npm link  # macOS/Linux
npm link       # Windows (run as Administrator)
```

#### Step 4: Alternative Installation Method
If `npm link` continues to fail:

```bash
# Install globally directly
npm install -g /path/to/src/cli

# Or create manual symlink
ln -s /path/to/src/cli/index.js /usr/local/bin/mcp-browser
chmod +x /usr/local/bin/mcp-browser
```

---

### 5. Performance Issues

**Symptoms:**
- Commands take longer than 2 seconds to execute
- Frequent timeouts
- Poor reliability in command execution

**Root Causes:**
- System resource constraints
- Network latency
- Chrome Extension performance issues
- Inefficient WebSocket communication

**Solutions:**

#### Step 1: Check System Resources
```bash
# Check CPU and memory usage
top        # Linux/macOS
taskmgr    # Windows

# Monitor during command execution
mcp-browser console-hello "Performance test" &
top -p $(pgrep node)  # Monitor node processes
```

#### Step 2: Optimize Timeout Settings
```bash
# Increase timeout for slow systems
hello-cli config --set timeout=10000

# Increase retry count
mcp-browser console-hello "Test" --retry 5
```

#### Step 3: Profile Extension Performance
1. Open Extension DevTools
2. Go to Performance tab
3. Record while executing commands
4. Look for performance bottlenecks

#### Step 4: Check Network Latency
```bash
# Test localhost connectivity
ping localhost

# Test WebSocket connection speed
time npx wscat -c ws://localhost:3000 -x 'ping'
```

---

### 6. Testing and E2E Issues

**Symptoms:**
- E2E tests fail inconsistently
- Tests can't launch browser with extension
- Test environment setup fails

**Root Causes:**
- Chrome binary not found by Puppeteer
- Extension loading fails in test environment
- Test timing issues
- Port conflicts during testing

**Solutions:**

#### Step 1: Install Chrome for Testing
```bash
# Linux
sudo apt-get install google-chrome-stable

# macOS (via Homebrew)
brew install --cask google-chrome

# Windows
# Download and install Chrome manually
```

#### Step 2: Fix Puppeteer Chrome Path
```javascript
// In test configuration
const browser = await puppeteer.launch({
  executablePath: '/path/to/chrome',  // Set explicit path
  headless: false,
  args: [
    `--load-extension=${extensionPath}`,
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
});
```

#### Step 3: Increase Test Timeouts
```javascript
// In Jest configuration
module.exports = {
  testTimeout: 30000,  // 30 second timeout
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

#### Step 4: Fix Port Conflicts
```bash
# Kill any processes using test ports
lsof -ti:3000 | xargs kill -9

# Use different port for testing
export TEST_PORT=3001
npm test
```

---

## Debug Modes and Logging

### Server Debug Mode

Enable detailed server logging:

```bash
cd src/server
DEBUG=* npm start
```

**What to Look For:**
- WebSocket connection messages
- MCP tool registration logs
- Tool execution traces
- Error stack traces

### CLI Debug Mode

Enable verbose CLI output:

```bash
mcp-browser console-hello "Debug test" --verbose

# Or with environment variable
DEBUG=* mcp-browser console-hello "Debug test"
```

### Extension Debug Mode

1. **Background Script Debugging:**
   - Go to `chrome://extensions/`
   - Click "Service Worker" link under your extension
   - View WebSocket connection logs and message handling

2. **Content Script Debugging:**
   - Open any webpage
   - Press F12 to open DevTools
   - View console for content script logs
   - Check Sources tab for script injection

### Log File Locations

- **Server Logs**: `src/server/combined.log` and `src/server/error.log`
- **CLI Output**: Terminal/console output only
- **Extension Logs**: Browser DevTools console

---

## System Requirements

### Minimum Requirements

- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Chrome**: Version 88 or higher (Manifest V3 support)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 500MB free space

### Supported Platforms

- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 18.04 LTS or equivalent

### Network Requirements

- **Local Development**: localhost access on port 3000
- **WebSocket Support**: Browser must support WebSocket protocol
- **CORS**: Extension must have localhost permissions

---

## Security Considerations

### Development vs Production

**Development Mode (Current):**
- No authentication required
- Localhost-only access
- All CORS origins allowed
- Debug information exposed

**Production Recommendations:**
- Add API authentication
- Restrict CORS origins
- Use HTTPS/WSS protocols
- Sanitize debug information
- Implement rate limiting

### Extension Security

- **Content Script Injection**: Only on user-initiated commands
- **Cross-Origin Requests**: Limited to localhost during development
- **Permission Model**: Minimal required permissions
- **Code Execution**: No eval() or unsafe code execution

---

## Getting Help

### Before Asking for Help

1. **Run System Health Check:**
   ```bash
   mcp-browser status
   hello-cli test --all
   ```

2. **Check All Components:**
   - MCP Server running (`npm start` in `src/server`)
   - Chrome Extension loaded and enabled
   - CLI installed globally (`npm link` in `src/cli`)

3. **Gather Debug Information:**
   - Server logs (`src/server/combined.log`)
   - Extension background page console
   - CLI verbose output (`--verbose` flag)

### Reporting Issues

When reporting issues, include:

1. **System Information:**
   - Operating system and version
   - Node.js and npm versions
   - Chrome version

2. **Error Information:**
   - Complete error messages
   - Stack traces from logs
   - Steps to reproduce

3. **Environment Details:**
   - Which components are running
   - Any configuration changes
   - Network environment (proxy, firewall, etc.)

### Support Channels

- **Documentation**: Check all files in `docs/` directory
- **Code Examples**: See `tests/e2e/` for working examples
- **Component Logs**: Enable debug mode for detailed information

---

## Advanced Troubleshooting

### Network Diagnostics

```bash
# Test all network components
curl http://localhost:3000/health
npx wscat -c ws://localhost:3000
mcp-browser status --connection

# Check for proxy interference
curl --no-proxy http://localhost:3000/health
```

### Process Diagnostics

```bash
# Find all related processes
ps aux | grep node
ps aux | grep chrome

# Check process resource usage
top -p $(pgrep -f "mcp-server")
```

### File System Diagnostics

```bash
# Check file permissions
ls -la src/cli/index.js
ls -la src/extension/manifest.json

# Verify file integrity
npm ls  # Check for missing dependencies
```

### Chrome Extension Advanced Debugging

1. **Extension Internals:**
   - Go to `chrome://extensions-internals/`
   - Find your extension and check for errors

2. **Service Worker Lifecycle:**
   - Monitor service worker start/stop events
   - Check for excessive memory usage
   - Verify persistent connections

3. **Content Script Context:**
   - Verify scripts run in correct context
   - Check for CSP violations
   - Monitor cross-frame communication

---

## Prevention Best Practices

### Development Workflow

1. **Always Start Server First:**
   ```bash
   cd src/server && npm start
   ```

2. **Verify Extension Load:**
   Check `chrome://extensions/` before testing

3. **Use Health Checks:**
   ```bash
   mcp-browser status  # Before running commands
   ```

4. **Monitor Logs:**
   Keep server logs open during development

### Testing Best Practices

1. **Clean Environment:**
   - Restart server between major tests
   - Clear browser cache periodically
   - Reset extension state

2. **Systematic Debugging:**
   - Test components individually
   - Verify each integration point
   - Use minimal test cases

3. **Documentation:**
   - Document configuration changes
   - Note working vs broken states
   - Track resolution steps

---

This troubleshooting guide covers the most common issues with the Browser-MCP-Control system. For issues not covered here, enable debug mode and examine the detailed logs to identify the root cause.