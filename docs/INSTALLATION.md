# Installation Guide - Browser-MCP-Control System

This guide provides step-by-step installation instructions for the Browser-MCP-Control system, including all components and dependencies.

## 📋 Prerequisites

### System Requirements

- **Node.js**: Version 16 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Chrome Browser**: Latest stable version
- **Operating System**: Windows, macOS, or Linux
- **Terminal**: Command line interface access

### Verify Prerequisites

```bash
# Check Node.js version (should be 16+)
node --version

# Check npm version (should be 8+)
npm --version

# Check Chrome version
google-chrome --version  # Linux
# OR open Chrome and go to chrome://version/
```

## 🛠️ Installation Steps

### Step 1: Clone and Setup Project

```bash
# Clone the repository (if applicable)
# git clone <repository-url>
# cd Browser-MCP-Control

# Verify project structure
ls -la
# Should see: src/, docs/, tests/, todo/, CLAUDE.md, README.md
```

### Step 2: Install MCP Server

```bash
# Navigate to server directory
cd src/server

# Install server dependencies
npm install

# Verify server installation
npm run --silent --version

# Test server startup (optional)
npm start
# Should see: "MCP Server running on http://localhost:3000"
# Press Ctrl+C to stop
```

**Expected server dependencies:**
- express (web framework)
- ws (WebSocket support)
- cors (cross-origin requests)
- helmet (security middleware)
- winston (logging)

### Step 3: Install CLI Tool

```bash
# Navigate to CLI directory
cd ../cli

# Install CLI dependencies
npm install

# Install CLI globally for system-wide access
npm link

# Verify CLI installation
mcp-browser --version
# Should display version information

# Test CLI connectivity (optional)
mcp-browser status
# Should show server connection status
```

**Expected CLI dependencies:**
- axios (HTTP client)
- commander (CLI framework)
- chalk (colored output)
- figlet (ASCII art headers)

### Step 4: Load Chrome Extension

#### Method 1: Load Unpacked Extension (Development)

1. **Open Chrome Extensions Page**:
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**:
   - Toggle "Developer mode" switch in top-right corner
   - New buttons will appear

3. **Load Extension**:
   - Click "Load unpacked" button
   - Navigate to your project directory
   - Select the `src/extension/` folder
   - Click "Select Folder"

4. **Verify Extension**:
   - Extension should appear in extensions list
   - Note the extension ID for debugging
   - Should show "Browser MCP Control" extension

#### Method 2: Pack Extension (Production)

```bash
# Navigate to extension directory
cd ../extension

# Create extension package (if needed)
# Chrome will create .crx file when packing

# Load packed extension:
# 1. Go to chrome://extensions/
# 2. Click "Pack extension"
# 3. Select src/extension folder
# 4. Install generated .crx file
```

### Step 5: Install Testing Framework

```bash
# Navigate to tests directory  
cd ../../tests

# Install test dependencies
npm install

# Verify test installation
npm run test:version
# Should show Jest and testing framework versions

# Run quick test (optional)
npm run test:unit
# Should pass basic unit tests
```

**Expected test dependencies:**
- jest (testing framework)
- puppeteer (browser automation)
- supertest (API testing)
- @jest/globals (Jest utilities)

## 🔧 Configuration

### Server Configuration

Default server configuration (`src/server/package.json`):
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

**Environment Variables** (optional):
```bash
# Create .env file in src/server/ if needed
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Extension Configuration

Extension manifest (`src/extension/manifest.json`):
```json
{
  "manifest_version": 3,
  "name": "Browser MCP Control",
  "version": "1.0.0",
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["<all_urls>"]
}
```

### CLI Configuration

CLI package configuration (`src/cli/package.json`):
```json
{
  "bin": {
    "mcp-browser": "./bin/mcp-browser"
  }
}
```

## ✅ Verification

### Complete Installation Test

Run this verification sequence to ensure everything is working:

```bash
# 1. Start MCP Server (in terminal 1)
cd src/server
npm start
# Should show: "MCP Server running on http://localhost:3000"

# 2. Test CLI commands (in terminal 2)
mcp-browser status
# Should show: "✅ MCP Server: Connected"

mcp-browser tools
# Should list available MCP tools

# 3. Test browser integration
mcp-browser console-hello "Installation Test"
# Should execute console.log in active browser tab

# 4. Run tests (in terminal 3)
cd tests
npm test
# Should pass all E2E tests
```

### Component Status Check

```bash
# Check all components
cd src/server && npm start &
sleep 5
cd ../cli && mcp-browser status
cd ../../tests && npm run test:integration
```

## 🚨 Troubleshooting

### Common Installation Issues

#### Node.js Version Issues
```bash
# If Node.js version is too old
# Install Node.js 16+ from https://nodejs.org/
# Or use Node Version Manager (nvm)
nvm install 16
nvm use 16
```

#### npm Permission Issues
```bash
# Fix npm global install permissions (Linux/macOS)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### Chrome Extension Issues
```bash
# If extension won't load:
# 1. Check for manifest.json errors in chrome://extensions/
# 2. Verify all required files exist in src/extension/
# 3. Check browser console for errors
# 4. Try disabling/re-enabling extension
```

#### Server Port Conflicts
```bash
# If port 3000 is in use
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
# Or change port in src/server/server.js
```

#### CLI Command Not Found
```bash
# If mcp-browser command not found after npm link
npm unlink -g mcp-browser
cd src/cli
npm link
which mcp-browser  # Should show global path
```

### Verification Commands

```bash
# Check all installations
node --version      # ✅ 16+
npm --version       # ✅ 8+
mcp-browser --version  # ✅ Shows version
chrome --version    # ✅ Latest stable

# Check running processes
ps aux | grep node  # Should show server process
lsof -i :3000      # Should show server on port 3000
```

## 🎯 Next Steps

After successful installation:

1. **Read Usage Guide**: [USAGE.md](USAGE.md)
2. **Review API Reference**: [API-REFERENCE.md](API-REFERENCE.md)
3. **Check CLI Commands**: [CLI-COMMANDS.md](CLI-COMMANDS.md)
4. **Run Full Test Suite**: `cd tests && npm test`
5. **Explore Examples**: Try various `mcp-browser` commands

## 🆘 Getting Help

If you encounter issues during installation:

1. **Check Prerequisites**: Ensure all system requirements are met
2. **Review Error Messages**: Look for specific error details
3. **Check Logs**: View server logs and browser console
4. **Consult Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
5. **Verify Network**: Ensure no firewall blocking localhost:3000

---

**Installation completed successfully!** 

Your Browser-MCP-Control system is ready for CLI-to-Browser automation.

*Built by the Multi-Agent Team with focus on reliable installation and setup.*