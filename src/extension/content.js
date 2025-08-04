// Sarah's Content Script - Hello World Extension
// Runs on web pages để interact với page content

class HelloWorldContent {
    constructor() {
        this.init();
    }
    
    init() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true;
        });
        
        // Add extension indicator to page (for testing purposes)
        this.addExtensionIndicator();
        
        console.log('Hello World Content Script loaded by Sarah 💻 on:', window.location.href);
    }
    
    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'extension_activated':
                this.handleExtensionActivated(message.tabInfo, sendResponse);
                break;
                
            case 'inject_hello_message':
                this.injectHelloMessage(message.data, sendResponse);
                break;
                
            case 'get_page_info':
                this.getPageInfo(sendResponse);
                break;
                
            case 'execute_console_hello':
                this.executeConsoleHello(message.data, sendResponse);
                break;
                
            default:
                sendResponse({ error: 'Unknown message type' });
        }
    }
    
    handleExtensionActivated(tabInfo, sendResponse) {
        console.log('Extension activated on page:', tabInfo);
        
        // Could show a temporary notification on the page
        this.showPageNotification('Hello World Extension activated! 👋');
        
        sendResponse({ success: true, pageReady: true });
    }
    
    injectHelloMessage(data, sendResponse) {
        try {
            const message = data.message || 'Hello from the extension!';
            const position = data.position || 'top-right';
            
            this.createFloatingMessage(message, position);
            
            sendResponse({ success: true, injected: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    
    getPageInfo(sendResponse) {
        try {
            const pageInfo = {
                url: window.location.href,
                title: document.title,
                domain: window.location.hostname,
                timestamp: new Date().toISOString(),
                hasHelloWorldElements: this.findHelloWorldElements()
            };
            
            sendResponse({ success: true, pageInfo: pageInfo });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    
    executeConsoleHello(data, sendResponse) {
        try {
            const message = data.message || 'Hello World';
            const timestamp = data.timestamp || Date.now();
            
            // Execute console.log safely
            console.log(message);
            
            // Capture execution info
            const executionInfo = {
                success: true,
                message: message,
                timestamp: timestamp,
                executed_at: new Date().toISOString(),
                page_url: window.location.href,
                page_title: document.title,
                console_method: 'console.log'
            };
            
            // Optional: Show visual confirmation on page
            this.showConsoleExecutionConfirmation(message);
            
            console.log('Content Script: Console execution successful:', executionInfo);
            sendResponse(executionInfo);
            
        } catch (error) {
            const errorInfo = {
                success: false,
                error: error.message,
                page_url: window.location.href,
                page_title: document.title,
                timestamp: data.timestamp || Date.now()
            };
            
            console.error('Content Script: Console execution failed:', error);
            sendResponse(errorInfo);
        }
    }
    
    showConsoleExecutionConfirmation(message) {
        // Show a brief visual confirmation that console.log was executed
        const confirmationId = 'console-execution-confirmation';
        
        // Remove existing confirmation
        const existing = document.querySelector(`#${confirmationId}`);
        if (existing) {
            existing.remove();
        }
        
        const confirmation = document.createElement('div');
        confirmation.id = confirmationId;
        confirmation.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            z-index: 10003;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        
        confirmation.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <span>✓</span>
                <span>Console executed: "${message}"</span>
            </div>
        `;
        
        document.body.appendChild(confirmation);
        
        // Animate in
        setTimeout(() => {
            confirmation.style.opacity = '1';
        }, 10);
        
        // Animate out after 2 seconds
        setTimeout(() => {
            confirmation.style.opacity = '0';
            setTimeout(() => {
                confirmation.remove();
            }, 300);
        }, 2000);
    }
    
    addExtensionIndicator() {
        // Add a small indicator that extension is active (for development/testing)
        if (document.querySelector('#hello-world-indicator')) {
            return; // Already added
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'hello-world-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 10px;
            height: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            z-index: 10000;
            opacity: 0.7;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        // Fade out after 3 seconds
        setTimeout(() => {
            indicator.style.opacity = '0.3';
        }, 3000);
    }
    
    showPageNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('#hello-world-notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.id = 'hello-world-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Animate out after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    createFloatingMessage(message, position) {
        const floatingMsg = document.createElement('div');
        floatingMsg.className = 'hello-world-floating-message';
        
        let positionStyle = '';
        switch (position) {
            case 'top-left':
                positionStyle = 'top: 20px; left: 20px;';
                break;
            case 'top-right':
                positionStyle = 'top: 20px; right: 20px;';
                break;
            case 'bottom-left':
                positionStyle = 'bottom: 20px; left: 20px;';
                break;
            case 'bottom-right':
                positionStyle = 'bottom: 20px; right: 20px;';
                break;
            case 'center':
                positionStyle = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
                break;
            default:
                positionStyle = 'top: 20px; right: 20px;';
        }
        
        floatingMsg.style.cssText = `
            position: fixed;
            ${positionStyle}
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 16px;
            font-weight: 500;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10002;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 350px;
            text-align: center;
        `;
        
        floatingMsg.innerHTML = `
            <div style="margin-bottom: 8px;">🎉</div>
            <div>${message}</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">
                From the Hello World Multi-Agent Team
            </div>
        `;
        
        document.body.appendChild(floatingMsg);
        
        // Animate in
        setTimeout(() => {
            floatingMsg.style.opacity = '1';
            floatingMsg.style.transform = 'scale(1)';
        }, 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            floatingMsg.style.opacity = '0';
            floatingMsg.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                floatingMsg.remove();
            }, 400);
        }, 5000);
    }
    
    findHelloWorldElements() {
        // Look for "hello world" related content on the page
        const bodyText = document.body.textContent.toLowerCase();
        const titleText = document.title.toLowerCase();
        
        const helloWorldKeywords = [
            'hello world',
            'hello-world', 
            'helloworld',
            'greetings',
            'welcome'
        ];
        
        const found = helloWorldKeywords.some(keyword => 
            bodyText.includes(keyword) || titleText.includes(keyword)
        );
        
        return {
            found: found,
            keywords: helloWorldKeywords.filter(keyword => 
                bodyText.includes(keyword) || titleText.includes(keyword)
            ),
            pageLength: bodyText.length,
            title: document.title
        };
    }
}

// Initialize content script
const helloWorldContent = new HelloWorldContent();