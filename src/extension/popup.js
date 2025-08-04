// Sarah's Frontend Logic - Hello World Extension
// Coordinates with Mike's server và Emma's integration

class HelloWorldExtension {
    constructor() {
        this.websocket = null;
        this.messageCount = 0;
        this.isConnected = false;
        this.serverUrl = 'ws://localhost:3000';
        
        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
        this.attemptAutoConnect();
    }
    
    initializeElements() {
        // Input elements
        this.nameInput = document.getElementById('nameInput');
        this.greetBtn = document.getElementById('greetBtn');
        this.connectBtn = document.getElementById('connectBtn');
        
        // Status elements  
        this.connectionStatus = document.getElementById('connectionStatus');
        this.responseArea = document.getElementById('responseArea');
        this.messageCountEl = document.getElementById('messageCount');
        this.responseTimeEl = document.getElementById('responseTime');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }
    
    bindEvents() {
        this.greetBtn.addEventListener('click', () => this.sendGreeting());
        this.connectBtn.addEventListener('click', () => this.toggleConnection());
        
        // Enter key support
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendGreeting();
            }
        });
        
        // Auto-focus name input
        this.nameInput.focus();
    }
    
    async loadStoredData() {
        try {
            const data = await chrome.storage.local.get(['messageCount', 'lastUserName']);
            this.messageCount = data.messageCount || 0;
            this.updateMessageCount();
            
            if (data.lastUserName) {
                this.nameInput.value = data.lastUserName;
            }
        } catch (error) {
            console.error('Failed to load stored data:', error);
        }
    }
    
    async saveData(key, value) {
        try {
            await chrome.storage.local.set({ [key]: value });
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }
    
    attemptAutoConnect() {
        // Try to connect automatically on popup open
        setTimeout(() => {
            if (!this.isConnected) {
                this.connectToServer();
            }
        }, 500);
    }
    
    connectToServer() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            return; // Already connected
        }
        
        this.showLoading(true);
        this.updateConnectionStatus('connecting');
        
        try {
            this.websocket = new WebSocket(this.serverUrl);
            
            this.websocket.onopen = () => {
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                this.showLoading(false);
                this.addResponseMessage('Connected to MCP Server! 🎉', 'success');
                console.log('Connected to server');
            };
            
            this.websocket.onmessage = (event) => {
                this.handleServerMessage(event.data);
            };
            
            this.websocket.onclose = (event) => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.showLoading(false);
                
                if (event.code !== 1000) { // Not normal closure
                    this.addResponseMessage('Connection lost. Click Connect to retry.', 'error');
                }
                console.log('Disconnected from server');
            };
            
            this.websocket.onerror = (error) => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.showLoading(false);
                this.addResponseMessage('Failed to connect to server. Make sure the MCP server is running on localhost:3000.', 'error');
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
            this.showLoading(false);
            this.addResponseMessage('Connection error: ' + error.message, 'error');
            console.error('Connection error:', error);
        }
    }
    
    disconnectFromServer() {
        if (this.websocket) {
            this.websocket.close(1000, 'User initiated disconnect');
            this.websocket = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus('disconnected');
        this.addResponseMessage('Disconnected from server.', '');
    }
    
    toggleConnection() {
        if (this.isConnected) {
            this.disconnectFromServer();
        } else {
            this.connectToServer();
        }
    }
    
    sendGreeting() {
        const name = this.nameInput.value.trim();
        
        if (!name) {
            this.nameInput.classList.add('shake');
            setTimeout(() => this.nameInput.classList.remove('shake'), 500);
            this.addResponseMessage('Please enter your name first! 😊', 'error');
            this.nameInput.focus();
            return;
        }
        
        if (!this.isConnected) {
            this.addResponseMessage('Not connected to server. Click Connect first!', 'error');
            return;
        }
        
        // Record start time for response time calculation
        const startTime = Date.now();
        
        const message = {
            type: 'hello_request',
            data: {
                name: name,
                timestamp: new Date().toISOString(),
                source: 'chrome_extension',
                agent: 'sarah'
            }
        };
        
        try {
            this.websocket.send(JSON.stringify(message));
            this.messageCount++;
            this.updateMessageCount();
            this.saveData('messageCount', this.messageCount);
            this.saveData('lastUserName', name);
            
            // Store start time for this message
            this.pendingRequestTime = startTime;
            
            this.addResponseMessage(`Sending greeting for "${name}"...`, '');
            
        } catch (error) {
            this.addResponseMessage('Failed to send message: ' + error.message, 'error');
            console.error('Send error:', error);
        }
    }
    
    handleServerMessage(messageData) {
        try {
            const message = JSON.parse(messageData);
            
            // Calculate response time if we have a pending request
            if (this.pendingRequestTime) {
                const responseTime = Date.now() - this.pendingRequestTime;
                this.updateResponseTime(responseTime);
                this.pendingRequestTime = null;
            }
            
            switch (message.type) {
                case 'hello_response':
                    this.handleHelloResponse(message.data);
                    break;
                    
                case 'error':
                    this.handleErrorResponse(message.data);
                    break;
                    
                case 'server_info':
                    this.handleServerInfo(message.data);
                    break;
                    
                default:
                    console.log('Unknown message type:', message.type);
                    this.addResponseMessage(`Server: ${JSON.stringify(message)}`, '');
            }
            
        } catch (error) {
            console.error('Failed to parse server message:', error);
            this.addResponseMessage('Received invalid message from server', 'error');
        }
    }
    
    handleHelloResponse(data) {
        const greeting = data.greeting || 'Hello!';
        const serverAgent = data.agent || 'server';
        const serverTime = data.server_time ? new Date(data.server_time).toLocaleTimeString() : '';
        
        let responseText = `${greeting}`;
        if (serverTime) {
            responseText += ` (Server time: ${serverTime})`;
        }
        if (serverAgent) {
            responseText += ` - Generated by ${serverAgent} ⚙️`;
        }
        
        this.addResponseMessage(responseText, 'success');
    }
    
    handleErrorResponse(data) {
        const errorMsg = data.message || 'Unknown server error';
        this.addResponseMessage(`Server Error: ${errorMsg}`, 'error');
    }
    
    handleServerInfo(data) {
        const info = data.message || 'Server information received';
        this.addResponseMessage(`ℹ️ ${info}`, '');
    }
    
    updateConnectionStatus(status) {
        this.connectionStatus.className = `status-${status}`;
        
        switch (status) {
            case 'connected':
                this.connectionStatus.textContent = 'Connected';
                this.connectBtn.textContent = 'Disconnect';
                this.connectBtn.className = 'btn-secondary';
                break;
                
            case 'connecting':
                this.connectionStatus.textContent = 'Connecting...';
                this.connectBtn.textContent = 'Cancel';
                this.connectBtn.className = 'btn-secondary';
                break;
                
            case 'disconnected':
            default:
                this.connectionStatus.textContent = 'Disconnected';
                this.connectBtn.textContent = 'Connect';
                this.connectBtn.className = 'btn-secondary';
                break;
        }
    }
    
    addResponseMessage(message, type = '') {
        // Clear welcome message on first real response
        const welcomeMsg = this.responseArea.querySelector('.welcome-message');
        if (welcomeMsg && (type === 'success' || type === 'error')) {
            welcomeMsg.remove();
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `response-message ${type} fade-in`;
        
        const timeStr = new Date().toLocaleTimeString();
        
        messageEl.innerHTML = `
            <div class="message-header">
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-content">${message}</div>
        `;
        
        this.responseArea.appendChild(messageEl);
        this.responseArea.scrollTop = this.responseArea.scrollHeight;
        
        // Limit message history to prevent memory issues
        const messages = this.responseArea.querySelectorAll('.response-message');
        if (messages.length > 10) {
            messages[0].remove();
        }
    }
    
    updateMessageCount() {
        this.messageCountEl.textContent = this.messageCount;
    }
    
    updateResponseTime(ms) {
        if (ms < 1000) {
            this.responseTimeEl.textContent = `${ms}ms`;
        } else {
            this.responseTimeEl.textContent = `${(ms / 1000).toFixed(1)}s`;
        }
    }
    
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }
}

// Initialize extension when popup loads
document.addEventListener('DOMContentLoaded', () => {
    // Add popup loaded indicator for testing
    document.body.setAttribute('data-popup-loaded', 'true');
    
    // Initialize the extension
    window.helloWorldExtension = new HelloWorldExtension();
    
    console.log('Hello World Extension initialized by Sarah 💻');
});