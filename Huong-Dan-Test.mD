# 🧪 Hướng Dẫn Testing - Browser-MCP-Control System

## 🎯 Tổng Quan Hệ Thống Testing

**Mục tiêu**: Hướng dẫn chi tiết setup và test Browser-MCP-Control system trên Windows environment

**Kiến trúc testing**: CLI Tool → MCP Server → Chrome Extension → Browser Console

---

## 📋 Yêu Cầu Hệ Thống

### **Phần mềm cần thiết:**
- ✅ **Node.js** >= 16.0.0
- ✅ **npm** package manager  
- ✅ **Google Chrome** browser
- ✅ **Git** for version control
- ✅ **PowerShell** (Windows terminal)

### **Kiểm tra môi trường:**
```powershell
# Kiểm tra Node.js version
node --version

# Kiểm tra npm version  
npm --version

# Kiểm tra Chrome
google-chrome --version
# hoặc
"C:\Program Files\Google\Chrome\Application\chrome.exe" --version
```

---

## 🚀 Setup Testing Environment

### **Bước 1: Clone Project từ GitHub**
```powershell
# Mở PowerShell
cd C:\Users\boybo\Desktop

# Clone repository
git clone https://github.com/quangman2211/Browser-MCP-Control.git

# Navigate vào project folder
cd Browser-MCP-Control

# Verify project structure
dir
```

**Expected structure:**
```
Browser-MCP-Control\
├── src\
│   ├── server\     # Mike's MCP Server ⚙️
│   ├── cli\        # Emma's CLI tool 🔧
│   └── extension\  # Sarah's Chrome Extension 💻
├── tests\          # David's E2E tests 🧪
├── docs\           # Documentation 📚
├── README.md
└── CLAUDE.md
```

### **Bước 2: Install Dependencies**

#### **2.1 MCP Server Dependencies**
```powershell
cd src\server
npm install

# Expected packages:
# - express (HTTP server)
# - ws (WebSocket server)  
# - cors (Cross-origin requests)
# - helmet (Security headers)
# - uuid (Unique IDs)
# - winston (Logging)
# - joi (Validation)
```

#### **2.2 CLI Dependencies**
```powershell
cd ..\cli
npm install

# Expected packages:
# - commander (CLI framework)
# - axios (HTTP client)
# - chalk (Terminal colors)
# - ora (Loading spinners)
# - inquirer (Interactive prompts)
# - figlet (ASCII art)
# - conf (Configuration management)
```

#### **2.3 Testing Dependencies**
```powershell
cd ..\..\tests
npm install

# Expected packages:
# - puppeteer (Browser automation)
# - jest (Testing framework)
```

---

## 🏃‍♂️ Khởi Động Hệ Thống

### **Terminal 1: Start MCP Server**
```powershell
# Navigate to server directory
cd C:\Users\boybo\Desktop\Browser-MCP-Control\src\server

# Start MCP Server
node server.js

# ✅ Expected Output:
# 🚀 Browser-MCP-Control Server started by Mike ⚙️
# 📡 HTTP Server: http://localhost:3000
# 🔗 WebSocket Server: ws://localhost:3000
# 🛠️ MCP Tools: 1 registered
# 💻 Ready for Chrome Extension và CLI integration!
#
# === MCP Server Endpoints ===
# Health Check: http://localhost:3000/health
# Tool Discovery: http://localhost:3000/api/tools
# Tool Execution: http://localhost:3000/api/tools/:toolName/call
# System Status: http://localhost:3000/api/tools/status
# WebSocket: ws://localhost:3000
# ============================
```

**❗ Lưu terminal này chạy trong suốt quá trình testing**

### **Setup Chrome Extension**
1. **Mở Chrome browser**
2. **Navigate to Extensions**: `chrome://extensions/`
3. **Enable Developer Mode**: Toggle switch ở góc trên phải
4. **Load Extension**: 
   - Click "Load unpacked"
   - Select folder: `C:\Users\boybo\Desktop\Browser-MCP-Control\src\extension`
5. **Verify Loading**: Extension xuất hiện với tên "Browser-MCP-Control Extension"

### **Verify Extension Connection**
1. **Mở Chrome DevTools**: F12 hoặc Right-click → Inspect
2. **Check Console Tab**: Should see message:
   ```
   🟢 Extension: Connected to MCP Server
   ```
3. **Check Extension Background**: 
   - Go to `chrome://extensions/`
   - Click "Service Worker" under your extension
   - Should see connection logs

---

## 🧪 Testing Procedures

### **Test 1: Basic System Health Check**

#### **Terminal 2: CLI Health Check**
```powershell
# Navigate to CLI directory
cd C:\Users\boybo\Desktop\Browser-MCP-Control\src\cli

# Test basic connection
node index.js mcp status

# ✅ Expected Output:
# 🏥 MCP System Health:
#   Server Status: healthy
#   Uptime: XXXs
#   Tool Registry: 1 tools
#   Extensions Connected: 1
#
# 📊 Tool Registry:
#   🔧 mcp:tool.console_hello
#
# 📈 Server Statistics:
#   Total Tool Calls: 0
#   Tool Executions: 0
#   Active Connections: 1
```

### **Test 2: MCP Tool Discovery**
```powershell
# Discover available MCP tools
node index.js mcp tools

# ✅ Expected Output:
# 📋 Available MCP Tools:
#
# 🔧 mcp:tool.console_hello
#    Execute console.log in browser tab
```

#### **Test with verbose output:**
```powershell
node index.js mcp tools --verbose

# ✅ Expected Output:
# 📋 Available MCP Tools:
#
# 🔧 mcp:tool.console_hello
#    Execute console.log in browser tab
#    Category: browser_control
#    Version: 1.0.0
#    Agent: mike
#    Parameters:
#      • message (string): Message to log to console
#    Example: Basic console hello
#    Stats: 0 calls, 0% success rate
```

### **Test 3: Console Execution (Core Functionality)**

#### **Prepare Browser:**
1. **Open any website** (e.g., google.com, github.com)
2. **Open DevTools**: F12 → Console tab
3. **Clear console**: Ctrl+L or click clear button

#### **Execute Console Command:**
```powershell
# Basic console execution
node index.js mcp-browser console-hello

# ✅ Expected CLI Output:
# 🌐 MCP Browser Execution Result:
#   Message: "Hello World"
#   Tool: mcp:tool.console_hello
#   Timestamp: 8/4/2024, 10:30:45 AM
#   Execution Time: 150ms
#   Browser Info:
#     Tab: Google
#     URL: https://google.com
#
# ✅ Check browser DevTools Console to see the message!
```

#### **Expected Browser Console Output:**
```javascript
Hello World
```

#### **Expected Visual Confirmation:**
- Green overlay appears briefly in browser với message "Console executed: Hello World"
- Overlay fades out after 2 seconds

### **Test 4: Custom Message Testing**
```powershell
# Test với custom message
node index.js mcp-browser console-hello "Testing from Windows CLI! 🎉"

# Test với Vietnamese message
node index.js mcp-browser console-hello "Xin chào từ CLI!"

# Test với special characters
node index.js mcp-browser console-hello "Testing: @#$%^&*()_+-={}[]|\\:;\"'<>?,./"
```

### **Test 5: Error Handling & Resilience**

#### **Test server connection issues:**
```powershell
# Stop MCP Server (Ctrl+C in Terminal 1)
# Then try CLI command
node index.js mcp-browser console-hello

# ✅ Expected Error Output:
# ❌ MCP Console Execution Error:
#   Connection refused. Make sure MCP Server is running:
#   cd src\server && node server.js
#
# 💡 Troubleshooting:
#   1. Check MCP Server is running: node src\server\server.js
#   2. Check Chrome Extension is loaded và connected
#   3. Use "mcp status" to check system health
```

#### **Test với retry logic:**
```powershell
# Restart MCP Server first
# Test với retry attempts
node index.js mcp-browser console-hello --retry 5 "Retry test message"
```

### **Test 6: Performance Testing**
```powershell
# Test execution speed (should be < 2 seconds)
Measure-Command { node index.js mcp-browser console-hello "Performance test" }

# Expected: TotalMilliseconds < 2000
```

---

## 🤖 Automated E2E Testing

### **Run Complete Test Suite**
```powershell
# Navigate to tests directory
cd C:\Users\boybo\Desktop\Browser-MCP-Control\tests

# Run basic test suite
npm test

# Run full E2E tests (requires MCP Server + Extension running)
npm run e2e

# Run tests in headless mode
npm run e2e:headless

# Run quick validation
npm run e2e:validate
```

### **Individual Test Scenarios**
```powershell
# Test system integration
node -e "
const test = require('./e2e/browser-mcp-control.test.js');
test.runSystemIntegrationTest();
"

# Test console execution
node -e "
const test = require('./e2e/browser-mcp-control.test.js');
test.runConsoleExecutionTest();
"

# Test error handling
node -e "
const test = require('./e2e/browser-mcp-control.test.js');
test.runErrorHandlingTest();
"
```

---

## 📊 Test Results Validation

### **✅ Success Criteria**

#### **System Health:**
- MCP Server starts without errors
- Chrome Extension connects successfully  
- CLI commands execute without timeouts
- Browser console shows expected output
- Visual confirmation appears và fades

#### **Performance Targets:**
- **Execution Time**: < 2000ms (CLI → Browser console)
- **Success Rate**: > 95% in repeated testing
- **Connection Time**: < 1000ms (Extension → Server)
- **Memory Usage**: Stable, no memory leaks

#### **Functional Requirements:**
- Console.log appears in browser DevTools
- Custom messages display correctly
- Vietnamese và special characters supported
- Error messages are clear và helpful
- Retry logic works for transient failures

### **🔍 Debugging Tools**

#### **Server Debugging:**
```powershell
# Start server với debug mode
cd src\server
node --inspect server.js

# Open Chrome DevTools for server debugging:
# chrome://inspect → Open dedicated DevTools for Node
```

#### **CLI Debugging:**
```powershell
# Verbose CLI output
node index.js mcp-browser console-hello --verbose

# CLI với custom timeout
node index.js mcp-browser console-hello --timeout 10000
```

#### **Extension Debugging:**
1. **Background Script Debug**:
   - Go to `chrome://extensions/`  
   - Click "Service Worker" under extension
   - Use Console và Sources tabs

2. **Content Script Debug**:
   - Open website DevTools (F12)
   - Check Console for extension logs
   - Look for messages starting with "🟢 Extension:"

#### **Network Debugging:**
```powershell
# Test server endpoints directly
curl http://localhost:3000/health
curl http://localhost:3000/api/tools
curl http://localhost:3000/api/tools/status

# Test WebSocket connection
# Use browser DevTools → Network → WS tab
```

---

## 🚨 Troubleshooting Guide

### **Common Issues & Solutions**

#### **Issue 1: MCP Server Won't Start**
```
Error: listen EADDRINUSE :::3000
```
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port
$env:PORT=3001; node server.js
```

#### **Issue 2: Chrome Extension Not Loading**
**Symptoms:** Extension not visible in chrome://extensions/

**Solutions:**
1. **Refresh Extensions Page**: Ctrl+R on chrome://extensions/
2. **Check Manifest**: Verify `src\extension\manifest.json` exists
3. **Clear Extension**: Remove → Reload unpacked
4. **Check Permissions**: Ensure Chrome has file access permissions

#### **Issue 3: Extension Not Connecting to Server**
**Symptoms:** No "Connected to MCP Server" message in console

**Solutions:**
1. **Check Server**: Ensure MCP Server running on localhost:3000
2. **Firewall**: Disable Windows Firewall temporarily
3. **Browser Console**: Check for WebSocket connection errors
4. **Extension Reload**: Reload extension in chrome://extensions/

#### **Issue 4: CLI Commands Fail**
**Symptoms:** "Connection refused" or timeout errors

**Solutions:**
1. **Server Check**: `curl http://localhost:3000/health`
2. **Port Check**: `netstat -ano | findstr :3000`
3. **Antivirus**: Temporarily disable antivirus
4. **Network**: Check localhost resolution: `ping localhost`

#### **Issue 5: Console Output Not Appearing**
**Symptoms:** CLI succeeds but no browser console output

**Solutions:**
1. **DevTools**: Ensure DevTools Console tab is open
2. **Console Filter**: Check console filter settings (All levels)
3. **Page Refresh**: Refresh browser page và try again
4. **Extension Status**: Verify extension background script running

#### **Issue 6: E2E Tests Failing**
**Symptoms:** Puppeteer tests timeout or fail

**Solutions:**
1. **Puppeteer Chrome**: Install Chrome for Puppeteer:
   ```powershell
   npm install puppeteer
   ```
2. **Headless Mode**: Try headless testing:
   ```powershell
   npm run e2e:headless
   ```
3. **Test Dependencies**: Reinstall test dependencies:
   ```powershell
   cd tests
   npm install
   ```

---

## 📈 Performance Monitoring

### **Execution Time Monitoring**
```powershell
# Measure CLI execution time
Measure-Command { node index.js mcp-browser console-hello "Performance test" }

# Multiple runs for average
for ($i=1; $i -le 10; $i++) {
    Write-Host "Run $i:"
    Measure-Command { node index.js mcp-browser console-hello "Test $i" }
}
```

### **Success Rate Testing**
```powershell
# Run 20 consecutive tests
$success = 0
$total = 20

for ($i=1; $i -le $total; $i++) {
    try {
        node index.js mcp-browser console-hello "Test $i" 2>$null
        if ($LASTEXITCODE -eq 0) { $success++ }
    } catch {}
    Start-Sleep -Milliseconds 500
}

Write-Host "Success Rate: $($success/$total*100)%"
```

---

## 🎯 Advanced Testing Scenarios

### **Concurrent Execution Testing**
```powershell
# Test multiple simultaneous commands
Start-Job { node index.js mcp-browser console-hello "Job 1" }
Start-Job { node index.js mcp-browser console-hello "Job 2" }  
Start-Job { node index.js mcp-browser console-hello "Job 3" }

# Check job results
Get-Job | Receive-Job
```

### **Load Testing**
```powershell
# Rapid consecutive execution
for ($i=1; $i -le 50; $i++) {
    node index.js mcp-browser console-hello "Load test $i"
    Start-Sleep -Milliseconds 100
}
```

### **Cross-Browser Testing**
1. **Chrome**: Primary testing browser
2. **Edge**: Test extension compatibility
3. **Chrome Canary**: Test với latest Chrome features

---

## 🏆 Success Validation Checklist

### **✅ Pre-Testing Checklist**
- [ ] Node.js >= 16.0.0 installed
- [ ] All dependencies installed successfully
- [ ] Chrome browser available
- [ ] Project cloned from GitHub
- [ ] No port conflicts on 3000

### **✅ System Integration Checklist**
- [ ] MCP Server starts without errors
- [ ] Server health endpoint responds
- [ ] Chrome Extension loads successfully
- [ ] Extension connects to WebSocket server
- [ ] CLI status command shows healthy system

### **✅ Functional Testing Checklist**
- [ ] Basic console-hello executes successfully
- [ ] Custom messages appear in browser console
- [ ] Visual confirmation overlay appears
- [ ] CLI shows execution results
- [ ] Response time < 2 seconds
- [ ] Vietnamese characters supported
- [ ] Special characters handled correctly
- [ ] Error handling works for offline scenarios

### **✅ E2E Testing Checklist**
- [ ] Automated tests pass
- [ ] Browser automation works
- [ ] Console output captured programmatically
- [ ] Performance tests meet targets
- [ ] Concurrent execution stable
- [ ] Success rate > 95%

---

## 📞 Support & Resources

### **Documentation:**
- **README.md**: Project overview và quick start
- **CLAUDE.md**: 11 Golden Rules và development guidelines
- **docs/**: Comprehensive technical documentation

### **Code Structure:**
- **src/server/**: Mike's MCP Server implementation
- **src/cli/**: Emma's CLI tool implementation  
- **src/extension/**: Sarah's Chrome Extension implementation
- **tests/**: David's E2E testing framework

### **GitHub Repository:**
- **URL**: https://github.com/quangman2211/Browser-MCP-Control
- **Issues**: Report bugs và feature requests
- **Wiki**: Additional documentation và examples

---

**🎉 Happy Testing! Hệ thống Browser-MCP-Control ready for AI-driven browser automation!**

*Last updated: August 4, 2024*
*Generated by Browser-MCP-Control Multi-Agent Team*