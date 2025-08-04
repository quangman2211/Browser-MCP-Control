// Sarah's Background Service Worker - Hello World Extension
// Handles extension lifecycle và background communication

class HelloWorldBackground {
    constructor() {
        this.websocket = null;
        this.isConnected = false;
        this.serverUrl = 'ws://localhost:3000';
        this.init();
    }
    
    init() {
        // Extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });
        
        // Extension startup  
        chrome.runtime.onStartup.addListener(() => {
            console.log('Hello World Extension started');
        });
        
        // Handle messages from content scripts và popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });
        
        // Handle extension action (icon click)
        chrome.action.onClicked.addListener((tab) => {
            this.handleActionClick(tab);
        });
        
        console.log('Hello World Background Service Worker initialized by Sarah 💻');
        
        // Initialize MCP Server connection
        this.initMCPConnection();
    }
    
    handleInstallation(details) {
        console.log('Extension installed:', details);
        
        if (details.reason === 'install') {
            // First time installation
            this.setDefaultSettings();
            
            // Show welcome notification
            chrome.notifications?.create?.({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Hello World Extension',
                message: 'Multi-agent demo extension installed successfully!'
            });
            
        } else if (details.reason === 'update') {
            // Extension updated
            console.log('Extension updated from version:', details.previousVersion);
        }
    }
    
    async setDefaultSettings() {
        try {
            await chrome.storage.local.set({
                messageCount: 0,
                serverUrl: 'ws://localhost:3000',
                autoConnect: true,
                lastUserName: '',
                installDate: new Date().toISOString(),
                version: chrome.runtime.getManifest().version
            });
            
            console.log('Default settings initialized');
        } catch (error) {
            console.error('Failed to set default settings:', error);
        }
    }
    
    handleMessage(message, sender, sendResponse) {
        console.log('Background received message:', message, 'from:', sender);
        
        switch (message.type) {
            case 'get_extension_info':
                this.getExtensionInfo(sendResponse);
                break;
                
            case 'check_server_connection':
                this.checkServerConnection(message.data, sendResponse);
                break;
                
            case 'store_analytics':
                this.storeAnalytics(message.data, sendResponse);
                break;
                
            case 'get_stored_data':
                this.getStoredData(message.data, sendResponse);
                break;
                
            case 'console_hello':
                this.executeConsoleHello(message.data, sendResponse);
                break;
                
            default:
                sendResponse({ error: 'Unknown message type' });
        }
    }
    
    async getExtensionInfo(sendResponse) {
        try {
            const manifest = chrome.runtime.getManifest();
            const storage = await chrome.storage.local.get();
            
            sendResponse({
                success: true,
                data: {
                    version: manifest.version,
                    name: manifest.name,
                    storage: storage,
                    agents: {
                        frontend: 'Sarah 💻',
                        backend: 'Mike ⚙️', 
                        integration: 'Emma 🔧',
                        qa: 'David 🧪',
                        docs: 'Doc 📚',
                        pm: 'Alex 🎯'
                    }
                }
            });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    
    async checkServerConnection(data, sendResponse) {
        try {
            // Simple HTTP check to server health endpoint
            const response = await fetch('http://localhost:3000/health', {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const serverInfo = await response.json();
                sendResponse({ 
                    success: true, 
                    connected: true,
                    serverInfo: serverInfo
                });
            } else {
                sendResponse({ 
                    success: true, 
                    connected: false,
                    error: `Server responded with ${response.status}`
                });
            }
        } catch (error) {
            sendResponse({ 
                success: true, 
                connected: false,
                error: error.message
            });
        }
    }
    
    async storeAnalytics(data, sendResponse) {
        try {
            const timestamp = new Date().toISOString();
            const analyticsKey = `analytics_${Date.now()}`;
            
            await chrome.storage.local.set({
                [analyticsKey]: {
                    ...data,
                    timestamp: timestamp
                }
            });
            
            // Keep only recent analytics (last 100 entries)
            const allData = await chrome.storage.local.get();
            const analyticsKeys = Object.keys(allData)
                .filter(key => key.startsWith('analytics_'))
                .sort()
                .slice(0, -100); // Keep last 100
                
            if (analyticsKeys.length > 0) {
                await chrome.storage.local.remove(analyticsKeys);
            }
            
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    
    async getStoredData(data, sendResponse) {
        try {
            const keys = data.keys || null;
            const result = await chrome.storage.local.get(keys);
            sendResponse({ success: true, data: result });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    
    // MCP Server Connection Methods
    initMCPConnection() {
        // Try to connect to MCP Server automatically
        setTimeout(() => {
            this.connectToMCPServer();
        }, 1000);
    }
    
    connectToMCPServer() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            return; // Already connected
        }
        
        try {
            this.websocket = new WebSocket(this.serverUrl);
            
            this.websocket.onopen = () => {
                this.isConnected = true;
                console.log('Background: Connected to MCP Server');
                
                // Send identification message
                this.websocket.send(JSON.stringify({
                    type: 'client_identify',
                    data: {
                        client: 'chrome_extension_background',
                        agent: 'sarah',
                        capabilities: ['console_execution', 'tab_injection']
                    }
                }));
            };
            
            this.websocket.onmessage = (event) => {
                this.handleMCPMessage(event.data);
            };
            
            this.websocket.onclose = (event) => {
                this.isConnected = false;
                console.log('Background: Disconnected from MCP Server');
                
                // Attempt reconnection after 5 seconds
                if (event.code !== 1000) {
                    setTimeout(() => {
                        this.connectToMCPServer();
                    }, 5000);
                }
            };
            
            this.websocket.onerror = (error) => {
                this.isConnected = false;
                console.error('Background: MCP WebSocket error:', error);
            };
            
        } catch (error) {
            this.isConnected = false;
            console.error('Background: MCP connection error:', error);
        }
    }
    
    handleMCPMessage(messageData) {
        try {
            const message = JSON.parse(messageData);
            console.log('Background: Received MCP message:', message);
            
            switch (message.type) {
                case 'console_hello':
                    this.executeConsoleHelloFromMCP(message.data);
                    break;
                    
                case 'ping':
                    this.sendMCPResponse('pong', { timestamp: Date.now() });
                    break;
                    
                default:
                    console.log('Background: Unknown MCP message type:', message.type);
            }
            
        } catch (error) {
            console.error('Background: Failed to parse MCP message:', error);
        }
    }
    
    sendMCPResponse(type, data) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
                type: type,
                data: data,
                timestamp: Date.now(),
                source: 'chrome_extension_background'
            }));
        }
    }
    
    // Console Execution Methods
    async executeConsoleHelloFromMCP(data) {
        try {
            // Get the active tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tabs.length === 0) {
                this.sendMCPResponse('console_hello_response', {
                    success: false,
                    error: 'No active tab found'
                });
                return;
            }
            
            const activeTab = tabs[0];
            
            // Execute console.log in the active tab
            await this.executeConsoleInTab(activeTab.id, data);
            
        } catch (error) {
            console.error('Background: Console execution error:', error);
            this.sendMCPResponse('console_hello_response', {
                success: false,
                error: error.message
            });
        }
    }
    
    async executeConsoleHello(data, sendResponse) {
        try {
            // Get the active tab for direct message handling
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tabs.length === 0) {
                sendResponse({ success: false, error: 'No active tab found' });
                return;
            }
            
            const activeTab = tabs[0];
            const result = await this.executeConsoleInTab(activeTab.id, data);
            sendResponse(result);
            
        } catch (error) {
            console.error('Background: Console execution error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    
    async executeConsoleInTab(tabId, data) {
        return new Promise((resolve) => {
            // Send message to content script to execute console.log
            chrome.tabs.sendMessage(tabId, {
                type: 'execute_console_hello',
                data: {
                    message: data.message || 'Hello World',
                    timestamp: Date.now()
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    const errorMsg = chrome.runtime.lastError.message;
                    console.error('Background: Tab message error:', errorMsg);
                    
                    const result = {
                        success: false,
                        error: errorMsg,
                        tabId: tabId
                    };
                    
                    // Send response to MCP Server if connected
                    this.sendMCPResponse('console_hello_response', result);
                    resolve(result);
                } else {
                    const result = response || { success: false, error: 'No response from content script' };
                    
                    // Send response to MCP Server if connected
                    this.sendMCPResponse('console_hello_response', result);
                    resolve(result);
                }
            });
        });
    }
    
    handleActionClick(tab) {
        // This handler is called when user clicks extension icon
        // In manifest v3, popup should open automatically
        // But we can add additional logic here if needed
        
        console.log('Extension icon clicked on tab:', tab.url);
        
        // Could send message to content script if needed
        chrome.tabs.sendMessage(tab.id, {
            type: 'extension_activated',
            tabInfo: {
                url: tab.url,
                title: tab.title
            }
        }).catch(error => {
            // Content script might not be loaded, that's ok
            console.log('No content script available:', error.message);
        });
    }
}

// Initialize background service worker
const helloWorldBackground = new HelloWorldBackground();