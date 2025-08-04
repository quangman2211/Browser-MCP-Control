# Browser-MCP-Control System

A comprehensive browser automation system built using the Multi-Agent Command Protocol (MCP), showcasing coordinated development by specialized AI agents. This system enables CLI commands to execute JavaScript actions directly in browser tabs through a Chrome Extension and MCP Server integration.

## 🚀 Quick Start

### 1. Start the MCP Server
```bash
cd src/server
npm install
npm start
```

### 2. Load Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select `src/extension/` directory

### 3. Install and Use CLI Tool
```bash
cd src/cli
npm install
npm link  # Install globally

# Execute console.log in browser
mcp-browser console-hello "Hello from CLI!"
```

## 🏗️ System Architecture

```
CLI Tool → MCP Server → Chrome Extension → Browser Actions
 (HTTP)    (WebSocket)    (Chrome APIs)    (Console/DOM)
```

## 📖 Key Components

- **CLI Tool** (`src/cli/`): Command-line interface for browser control via MCP Server
- **MCP Server** (`src/server/`): Node.js server implementing MCP protocol with WebSocket support
- **Chrome Extension** (`src/extension/`): Browser-side MCP client for command execution
- **Testing Framework** (`tests/`): Comprehensive E2E browser workflow validation

## 🎯 Multi-Agent Development

This project demonstrates advanced multi-agent collaboration:

- **Alex (Project Manager)**: System architecture and multi-agent coordination
- **Sarah (Frontend)**: Chrome Extension with WebSocket MCP integration
- **Mike (Backend)**: MCP Server with tool registry and protocol implementation
- **Emma (Integration)**: CLI tool with MCP client and browser control commands
- **David (QA)**: Comprehensive E2E testing framework for browser workflows
- **Doc (Documentation)**: System documentation and user guides

## 📚 Documentation

For comprehensive technical documentation, see the [docs/](docs/) directory:

- [System Overview & Setup](docs/README.md)
- [Installation Guide](docs/INSTALLATION.md)
- [API Reference](docs/API-REFERENCE.md)
- [CLI Commands](docs/CLI-COMMANDS.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🧪 Testing

```bash
cd tests
npm install
npm test                  # All tests including E2E browser workflow
npm run test:e2e         # End-to-end browser-CLI-server tests
npm run test:performance # Performance benchmarks
```

## 🤝 Contributing

This project showcases multi-agent development for browser automation. When contributing:

1. Follow agent role specializations
2. Test complete CLI → MCP Server → Extension → Browser workflow
3. Maintain documentation with code changes (Golden Rule #11)
4. Ensure E2E test coverage for browser automation features

## 📄 License

MIT License - See LICENSE file for details.

---

**Built by the Multi-Agent Team:**
- 🎯 Alex (Project Management & MCP Architecture)
- 💻 Sarah (Chrome Extension & WebSocket MCP Client) 
- ⚙️ Mike (MCP Server & Tool Registry)
- 🔧 Emma (CLI Tool & Browser Control Integration)
- 🧪 David (E2E Testing & Browser Workflow Validation)
- 📚 Doc (Documentation & System Guides)

*This system transforms simple CLI commands into powerful browser actions through the Multi-Agent Command Protocol.*