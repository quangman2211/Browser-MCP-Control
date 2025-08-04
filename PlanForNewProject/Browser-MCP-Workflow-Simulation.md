# Browser-MCP-Control: System Workflow Simulation

## 🎯 Overview

This document simulates exactly how the Browser-MCP-Control system works through detailed examples, showing real-time communication between AI Agent → CLI Tool → MCP Server → Chrome Extension → Browser.

---

## 📋 System Architecture Recap

```
AI Agent (Claude/GPT) ←→ CLI Tool ←→ MCP Server ←→ Chrome Extension ←→ Browser
    (NLP Request)      (HTTP API)   (WebSocket)     (Chrome APIs)     (Web Pages)
```

**MCP Server Role**: Central coordination hub that translates MCP protocol commands into browser actions

---

## 🎬 Simulation 1: Screenshot Capture Workflow

### **Scenario**: AI agent needs to capture screenshot of a news website

### **STEP 1: AI Agent → CLI Tool**
```bash
# User types natural language command
$ mcp-browser "Take a screenshot of the main article on CNN homepage"

# CLI Tool processes natural language using AI
🤖 CLI Tool: Processing natural language request...
🤖 CLI Tool: Parsed intent: screenshot
🤖 CLI Tool: Target: CNN homepage, element: main article
🤖 CLI Tool: Converting to MCP protocol...
```

### **STEP 2: CLI Tool → MCP Server (HTTP Request)**
```javascript
// CLI Tool sends HTTP request to MCP Server
const request = {
  method: 'POST',
  url: 'http://localhost:8080/api/tools/mcp:tool.screenshot/call',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MCP-Browser-CLI/1.0'
  },
  body: JSON.stringify({
    tool: "mcp:tool.screenshot",
    parameters: {
      url: "https://cnn.com",
      element: "main article, .story-body, .article-content",
      fullPage: false,
      format: "png",
      waitFor: "networkidle"
    },
    session_id: "session_20240804_001",
    timestamp: Date.now()
  })
};

console.log('📱 CLI → MCP Server:');
console.log(JSON.stringify(request.body, null, 2));
```

**Console Output:**
```
📱 CLI → MCP Server:
{
  "tool": "mcp:tool.screenshot",
  "parameters": {
    "url": "https://cnn.com",
    "element": "main article, .story-body, .article-content",
    "fullPage": false,
    "format": "png",
    "waitFor": "networkidle"
  },
  "session_id": "session_20240804_001",
  "timestamp": 1704067200000
}
```

### **STEP 3: MCP Server Processing**
```javascript
// MCP Server receives và processes request
app.post('/api/tools/:toolName/call', async (req, res) => {
  const startTime = Date.now();
  const { tool, parameters, session_id } = req.body;
  
  console.log('🔵 MCP Server: Incoming request');
  console.log('🔵 Tool:', tool);
  console.log('🔵 Session:', session_id);
  console.log('🔵 Parameters:', JSON.stringify(parameters, null, 2));
  
  // 1. Validate tool registration
  const toolConfig = toolRegistry.get(tool);
  if (!toolConfig) {
    console.log('❌ MCP Server: Tool not found:', tool);
    return res.status(404).json({
      success: false,
      error: `Tool ${tool} not registered`
    });
  }
  console.log('✅ MCP Server: Tool found in registry');
  
  // 2. Validate parameters
  const validation = validateParameters(parameters, toolConfig.schema);
  if (!validation.valid) {
    console.log('❌ MCP Server: Parameter validation failed:', validation.errors);
    return res.status(400).json({
      success: false,
      error: 'Invalid parameters',
      details: validation.errors
    });
  }
  console.log('✅ MCP Server: Parameters validated');
  
  // 3. Get or create session
  let session = sessionManager.get(session_id);
  if (!session) {
    session = await sessionManager.create(session_id);
    console.log('🔵 MCP Server: Created new session:', session_id);
  } else {
    console.log('🔵 MCP Server: Using existing session:', session_id);
  }
  
  // 4. Generate request ID và prepare for Extension
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log('🔵 MCP Server: Generated request ID:', requestId);
  
  // 5. Convert MCP tool to Extension action
  const extensionMessage = {
    type: 'tool_execution',
    id: requestId,
    action: mapToolToAction(tool), // "screenshot"
    parameters: normalizeParameters(parameters),
    sessionId: session_id,
    timestamp: Date.now()
  };
  
  console.log('🔵 MCP Server → Extension: Sending message');
  console.log(JSON.stringify(extensionMessage, null, 2));
  
  // 6. Forward to Chrome Extension via WebSocket
  try {
    const response = await sendToExtension(extensionMessage);
    const duration = Date.now() - startTime;
    
    console.log('✅ MCP Server: Request completed in', duration, 'ms');
    res.json(response);
    
  } catch (error) {
    console.error('❌ MCP Server: Request failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

**Console Output:**
```
🔵 MCP Server: Incoming request
🔵 Tool: mcp:tool.screenshot
🔵 Session: session_20240804_001
🔵 Parameters: {
  "url": "https://cnn.com",
  "element": "main article, .story-body, .article-content",
  "fullPage": false,
  "format": "png",
  "waitFor": "networkidle"
}
✅ MCP Server: Tool found in registry
✅ MCP Server: Parameters validated
🔵 MCP Server: Created new session: session_20240804_001
🔵 MCP Server: Generated request ID: req_1704067200123_x7k9m2p5q
🔵 MCP Server → Extension: Sending message
{
  "type": "tool_execution",
  "id": "req_1704067200123_x7k9m2p5q",
  "action": "screenshot",
  "parameters": {
    "url": "https://cnn.com",
    "selector": ".story-body, .article-content, main",
    "fullPage": false,
    "format": "png",
    "waitFor": "networkidle"
  },
  "sessionId": "session_20240804_001",
  "timestamp": 1704067200123
}
```

### **STEP 4: MCP Server → Chrome Extension (WebSocket)**
```javascript
// MCP Server sends via WebSocket
function sendToExtension(message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Extension timeout after 30s'));
    }, 30000);
    
    // Store pending request
    pendingRequests.set(message.id, {
      resolve: (data) => {
        clearTimeout(timeout);
        resolve(data);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
      startTime: Date.now()
    });
    
    // Send to extension
    if (extensionSocket && extensionSocket.readyState === WebSocket.OPEN) {
      console.log('🔵 MCP Server: WebSocket sending to Extension');
      extensionSocket.send(JSON.stringify(message));
    } else {
      console.error('❌ MCP Server: Extension not connected');
      reject(new Error('Chrome Extension not connected'));
    }
  });
}
```

### **STEP 5: Chrome Extension Receives Message**
```javascript
// Chrome Extension Background Script
chrome.runtime.onStartup.addListener(() => {
  console.log('🟢 Extension: Starting up...');
  connectToMCPServer();
});

function connectToMCPServer() {
  const ws = new WebSocket('ws://localhost:8080/extension');
  
  ws.onopen = () => {
    console.log('🟢 Extension: Connected to MCP Server');
    extensionSocket = ws;
  };
  
  ws.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('🟢 Extension: Received message from MCP Server');
      console.log('🟢 Type:', message.type);
      console.log('🟢 ID:', message.id);
      console.log('🟢 Action:', message.action);
      
      if (message.type === 'tool_execution') {
        await handleToolExecution(message);
      }
      
    } catch (error) {
      console.error('🟢 Extension: Error processing message:', error);
      sendErrorResponse(message.id, error.message);
    }
  };
  
  ws.onerror = (error) => {
    console.error('🟢 Extension: WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('🟢 Extension: Disconnected from MCP Server');
    // Attempt reconnection after 5 seconds
    setTimeout(connectToMCPServer, 5000);
  };
}

async function handleToolExecution(message) {
  const { id, action, parameters, sessionId } = message;
  
  console.log('🟢 Extension: Executing action:', action);
  console.log('🟢 Parameters:', JSON.stringify(parameters, null, 2));
  
  try {
    let result;
    
    switch (action) {
      case 'screenshot':
        result = await executeScreenshot(parameters, sessionId);
        break;
      case 'navigate':
        result = await executeNavigation(parameters, sessionId);
        break;
      case 'click':
        result = await executeClick(parameters, sessionId);
        break;
      case 'type':
        result = await executeType(parameters, sessionId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    console.log('✅ Extension: Action completed successfully');
    sendSuccessResponse(id, result);
    
  } catch (error) {
    console.error('❌ Extension: Action failed:', error);
    sendErrorResponse(id, error.message);
  }
}
```

**Console Output:**
```
🟢 Extension: Connected to MCP Server
🟢 Extension: Received message from MCP Server
🟢 Type: tool_execution
🟢 ID: req_1704067200123_x7k9m2p5q
🟢 Action: screenshot
🟢 Extension: Executing action: screenshot
🟢 Parameters: {
  "url": "https://cnn.com",
  "selector": ".story-body, .article-content, main",
  "fullPage": false,
  "format": "png",
  "waitFor": "networkidle"
}
```

### **STEP 6: Chrome Extension Executes Screenshot**
```javascript
async function executeScreenshot(parameters, sessionId) {
  const { url, selector, fullPage, format, waitFor } = parameters;
  
  console.log('🟢 Extension: Starting screenshot process...');
  
  // 1. Get or create tab for session
  let tab = await getSessionTab(sessionId);
  if (!tab) {
    console.log('🟢 Extension: Creating new tab for session');
    tab = await chrome.tabs.create({ url: 'about:blank', active: false });
    setSessionTab(sessionId, tab.id);
  }
  
  // 2. Navigate to URL if different
  if (url && tab.url !== url) {
    console.log('🟢 Extension: Navigating to', url);
    await chrome.tabs.update(tab.id, { url: url });
    
    // Wait for navigation complete
    await waitForTabLoad(tab.id);
    console.log('🟢 Extension: Navigation completed');
  }
  
  // 3. Wait for network idle if requested
  if (waitFor === 'networkidle') {
    console.log('🟢 Extension: Waiting for network idle...');
    await waitForNetworkIdle(tab.id, 2000); // 2 second idle
    console.log('🟢 Extension: Network idle detected');
  }
  
  // 4. Inject content script for element detection
  if (selector) {
    console.log('🟢 Extension: Injecting content script for element detection');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: highlightElement,
      args: [selector]
    });
  }
  
  // 5. Capture screenshot
  console.log('🟢 Extension: Capturing screenshot...');
  const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: format || 'png',
    quality: format === 'jpeg' ? 90 : undefined
  });
  
  // 6. Process screenshot if element selector provided
  let finalScreenshot = screenshot;
  let elementBounds = null;
  
  if (selector) {
    console.log('🟢 Extension: Getting element coordinates');
    const [coordinates] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getElementCoordinates,
      args: [selector]
    });
    
    if (coordinates.result) {
      elementBounds = coordinates.result;
      console.log('🟢 Extension: Element found at:', elementBounds);
      
      // Crop screenshot to element
      finalScreenshot = await cropScreenshot(screenshot, elementBounds);
      console.log('🟢 Extension: Screenshot cropped to element');
    } else {
      console.log('⚠️ Extension: Element not found, using full page');
    }
  }
  
  // 7. Get page metadata
  const [pageInfo] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getPageInfo
  });
  
  const result = {
    screenshot: finalScreenshot,
    metadata: {
      url: tab.url,
      title: tab.title,
      timestamp: Date.now(),
      format: format || 'png',
      selector: selector,
      elementFound: !!elementBounds,
      elementBounds: elementBounds,
      pageInfo: pageInfo.result,
      screenshotSize: finalScreenshot.length
    }
  };
  
  console.log('✅ Extension: Screenshot captured successfully');
  console.log('🟢 Screenshot size:', finalScreenshot.length, 'bytes');
  console.log('🟢 Page title:', tab.title);
  
  return result;
}

// Content script functions
function highlightElement(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el, index) => {
    el.style.outline = '2px solid #ff0000';
    el.style.outlineOffset = '2px';
    if (index === 0) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  // Remove highlight after 1 second
  setTimeout(() => {
    elements.forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  }, 1000);
}

function getElementCoordinates(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  return {
    x: rect.left + scrollX,
    y: rect.top + scrollY,
    width: rect.width,
    height: rect.height,
    visible: rect.width > 0 && rect.height > 0
  };
}

function getPageInfo() {
  return {
    title: document.title,
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    scroll: {
      x: window.pageXOffset,
      y: window.pageYOffset
    },
    documentSize: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    }
  };
}
```

**Console Output:**
```
🟢 Extension: Starting screenshot process...
🟢 Extension: Creating new tab for session
🟢 Extension: Navigating to https://cnn.com
🟢 Extension: Navigation completed
🟢 Extension: Waiting for network idle...
🟢 Extension: Network idle detected
🟢 Extension: Injecting content script for element detection
🟢 Extension: Capturing screenshot...
🟢 Extension: Getting element coordinates
🟢 Extension: Element found at: {
  "x": 120,
  "y": 240,
  "width": 720,
  "height": 480,
  "visible": true
}
🟢 Extension: Screenshot cropped to element
✅ Extension: Screenshot captured successfully
🟢 Screenshot size: 157832 bytes
🟢 Page title: CNN - Breaking News, Latest News and Videos
```

### **STEP 7: Chrome Extension → MCP Server (WebSocket Response)**
```javascript
function sendSuccessResponse(requestId, data) {
  const response = {
    type: 'tool_response',
    id: requestId,
    success: true,
    data: data,
    timestamp: Date.now()
  };
  
  console.log('🟢 Extension → MCP Server: Sending success response');
  console.log('🟢 Request ID:', requestId);
  console.log('🟢 Data size:', JSON.stringify(data).length, 'bytes');
  
  if (extensionSocket && extensionSocket.readyState === WebSocket.OPEN) {
    extensionSocket.send(JSON.stringify(response));
  } else {
    console.error('❌ Extension: Cannot send response - WebSocket not connected');
  }
}
```

### **STEP 8: MCP Server Processes Response**
```javascript
// MCP Server WebSocket message handler
extensionSocket.on('message', (data) => {
  try {
    const response = JSON.parse(data);
    console.log('🔵 MCP Server: Received response from Extension');
    console.log('🔵 Response ID:', response.id);
    console.log('🔵 Success:', response.success);
    
    if (response.type === 'tool_response') {
      handleToolResponse(response);
    }
    
  } catch (error) {
    console.error('🔵 MCP Server: Error parsing Extension response:', error);
  }
});

function handleToolResponse(response) {
  const { id, success, data, error } = response;
  
  // Find pending request
  const pendingRequest = pendingRequests.get(id);
  if (!pendingRequest) {
    console.log('⚠️ MCP Server: No pending request found for ID:', id);
    return;
  }
  
  const executionTime = Date.now() - pendingRequest.startTime;
  console.log('🔵 MCP Server: Request execution time:', executionTime, 'ms');
  
  if (success) {
    console.log('✅ MCP Server: Tool execution successful');
    
    // Format response according to MCP protocol
    const mcpResponse = {
      success: true,
      data: data,
      metadata: {
        executionTime: executionTime,
        timestamp: response.timestamp,
        tool: 'mcp:tool.screenshot'
      }
    };
    
    console.log('🔵 MCP Server: Formatted MCP response');
    console.log('🔵 Screenshot size:', data.screenshot?.length, 'bytes');
    console.log('🔵 Page URL:', data.metadata?.url);
    
    // Resolve pending request
    pendingRequest.resolve(mcpResponse);
    
  } else {
    console.error('❌ MCP Server: Tool execution failed:', error);
    pendingRequest.reject(new Error(error));
  }
  
  // Cleanup
  pendingRequests.delete(id);
  console.log('🔵 MCP Server: Cleaned up pending request:', id);
}
```

**Console Output:**
```
🔵 MCP Server: Received response from Extension
🔵 Response ID: req_1704067200123_x7k9m2p5q
🔵 Success: true
🔵 MCP Server: Request execution time: 3420 ms
✅ MCP Server: Tool execution successful
🔵 MCP Server: Formatted MCP response
🔵 Screenshot size: 157832 bytes
🔵 Page URL: https://cnn.com
🔵 MCP Server: Cleaned up pending request: req_1704067200123_x7k9m2p5q
```

### **STEP 9: MCP Server → CLI Tool (HTTP Response)**
```javascript
// MCP Server returns HTTP response to CLI Tool
const httpResponse = {
  success: true,
  data: {
    screenshot: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", // truncated
    metadata: {
      url: "https://cnn.com",
      title: "CNN - Breaking News, Latest News and Videos",
      timestamp: 1704067203543,
      format: "png",
      selector: ".story-body, .article-content, main",
      elementFound: true,
      elementBounds: {
        x: 120,
        y: 240,
        width: 720,
        height: 480,
        visible: true
      },
      pageInfo: {
        title: "CNN - Breaking News, Latest News and Videos",
        url: "https://cnn.com",
        viewport: { width: 1920, height: 1080 },
        scroll: { x: 0, y: 0 },
        documentSize: { width: 1920, height: 2840 }
      },
      screenshotSize: 157832
    }
  },
  metadata: {
    executionTime: 3420,
    timestamp: 1704067203543,
    tool: "mcp:tool.screenshot"
  }
};

console.log('🔵 MCP Server → CLI Tool: HTTP Response');
console.log('🔵 Status: 200 OK');
console.log('🔵 Execution time:', httpResponse.metadata.executionTime, 'ms');
```

### **STEP 10: CLI Tool Processes Response**
```javascript
// CLI Tool receives HTTP response
const response = await fetch('http://localhost:8080/api/tools/mcp:tool.screenshot/call', {
  method: 'POST',
  body: JSON.stringify(request)
});

const result = await response.json();

console.log('📱 CLI Tool: Received response from MCP Server');
console.log('📱 Success:', result.success);
console.log('📱 Execution time:', result.metadata.executionTime, 'ms');

if (result.success) {
  const { screenshot, metadata } = result.data;
  
  console.log('✅ CLI Tool: Screenshot captured successfully');
  console.log('📱 Page:', metadata.title);
  console.log('📱 URL:', metadata.url);
  console.log('📱 Element found:', metadata.elementFound);
  console.log('📱 Image size:', metadata.screenshotSize, 'bytes');
  
  // Save screenshot to file
  const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `screenshot-${Date.now()}.png`;
  
  await fs.writeFile(filename, buffer);
  console.log('📱 CLI Tool: Screenshot saved as', filename);
  
  // Return success to user
  return {
    success: true,
    message: `Screenshot captured from ${metadata.url}`,
    filename: filename,
    size: metadata.screenshotSize,
    executionTime: result.metadata.executionTime
  };
  
} else {
  console.error('❌ CLI Tool: Screenshot failed:', result.error);
  throw new Error(result.error);
}
```

**Final Console Output:**
```
📱 CLI Tool: Received response from MCP Server
📱 Success: true
📱 Execution time: 3420 ms
✅ CLI Tool: Screenshot captured successfully
📱 Page: CNN - Breaking News, Latest News and Videos
📱 URL: https://cnn.com
📱 Element found: true
📱 Image size: 157832 bytes
📱 CLI Tool: Screenshot saved as screenshot-1704067203543.png

✅ Screenshot captured from https://cnn.com
   File: screenshot-1704067203543.png
   Size: 157,832 bytes
   Time: 3.42 seconds
```

---

## 🎬 Simulation 2: Form Filling Workflow

### **Scenario**: AI agent needs to fill out a contact form

### **STEP 1: AI Agent Request**
```bash
$ mcp-browser "Fill out the contact form on example.com with name 'John Doe', email 'john@example.com', and message 'Hello world'"
```

### **STEP 2: CLI → MCP Server**
```javascript
const formRequest = {
  tool: "mcp:tool.form_fill",
  parameters: {
    url: "https://example.com/contact",
    fields: [
      { selector: "input[name='name']", value: "John Doe", type: "text" },
      { selector: "input[name='email']", value: "john@example.com", type: "email" },
      { selector: "textarea[name='message']", value: "Hello world", type: "textarea" }
    ],
    submitSelector: "button[type='submit']",
    waitAfterFill: 1000
  },
  session_id: "session_20240804_002"
};

console.log('📱 CLI → MCP Server: Form fill request');
console.log(JSON.stringify(formRequest, null, 2));
```

### **STEP 3: MCP Server → Extension**
```javascript
const extensionMessage = {
  type: 'tool_execution',
  id: 'req_1704067300456_k3j8d9f2l',
  action: 'form_fill',
  parameters: {
    url: "https://example.com/contact",
    fields: [
      { selector: "input[name='name']", value: "John Doe" },
      { selector: "input[name='email']", value: "john@example.com" },
      { selector: "textarea[name='message']", value: "Hello world" }
    ],
    submitSelector: "button[type='submit']",
    waitAfterFill: 1000
  },
  sessionId: "session_20240804_002"
};

console.log('🔵 MCP Server → Extension: Form fill message');
```

### **STEP 4: Extension Executes Form Fill**
```javascript
async function executeFormFill(parameters, sessionId) {
  const { url, fields, submitSelector, waitAfterFill } = parameters;
  
  console.log('🟢 Extension: Starting form fill process...');
  
  // 1. Navigate to URL
  let tab = await getSessionTab(sessionId);
  if (!tab || tab.url !== url) {
    console.log('🟢 Extension: Navigating to', url);
    tab = await chrome.tabs.update(tab.id, { url: url });
    await waitForTabLoad(tab.id);
  }
  
  // 2. Fill each field
  const results = [];
  for (const field of fields) {
    console.log('🟢 Extension: Filling field:', field.selector);
    
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillField,
      args: [field.selector, field.value]
    });
    
    results.push({
      selector: field.selector,
      success: result.result.success,
      error: result.result.error
    });
    
    if (result.result.success) {
      console.log('✅ Extension: Field filled successfully');
    } else {
      console.log('❌ Extension: Field fill failed:', result.result.error);
    }
    
    // Small delay between fields
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 3. Wait after filling
  if (waitAfterFill) {
    console.log('🟢 Extension: Waiting', waitAfterFill, 'ms after fill');
    await new Promise(resolve => setTimeout(resolve, waitAfterFill));
  }
  
  // 4. Optional: Submit form if selector provided
  let submitted = false;
  if (submitSelector) {
    console.log('🟢 Extension: Attempting to submit form');
    
    const [submitResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clickElement,
      args: [submitSelector]
    });
    
    submitted = submitResult.result.success;
    if (submitted) {
      console.log('✅ Extension: Form submitted successfully');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission
    }
  }
  
  return {
    url: tab.url,
    fieldsProcessed: results,
    submitted: submitted,
    timestamp: Date.now()
  };
}

// Content script functions
function fillField(selector, value) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }
    
    // Focus the element
    element.focus();
    
    // Clear existing value
    element.value = '';
    
    // Type the new value
    element.value = value;
    
    // Trigger input events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function clickElement(selector) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }
    
    element.click();
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Console Output:**
```
🟢 Extension: Starting form fill process...
🟢 Extension: Navigating to https://example.com/contact
🟢 Extension: Filling field: input[name='name']
✅ Extension: Field filled successfully
🟢 Extension: Filling field: input[name='email']
✅ Extension: Field filled successfully
🟢 Extension: Filling field: textarea[name='message']
✅ Extension: Field filled successfully
🟢 Extension: Waiting 1000 ms after fill
🟢 Extension: Attempting to submit form
✅ Extension: Form submitted successfully
```

---

## 🎬 Simulation 3: Data Extraction Workflow

### **Scenario**: Extract product information from e-commerce page

### **STEP 1: Data Extraction Request**
```javascript
const extractRequest = {
  tool: "mcp:tool.extract_data",
  parameters: {
    url: "https://example-shop.com/product/123",
    selectors: {
      title: "h1.product-title",
      price: ".price-current",
      description: ".product-description",
      images: "img.product-image",
      rating: ".rating-stars",
      availability: ".stock-status"
    },
    extractAttributes: {
      images: ["src", "alt"],
      rating: ["data-rating"]
    }
  },
  session_id: "session_20240804_003"
};
```

### **STEP 2: Extension Data Extraction**
```javascript
async function executeDataExtraction(parameters, sessionId) {
  const { url, selectors, extractAttributes } = parameters;
  
  console.log('🟢 Extension: Starting data extraction...');
  
  // Navigate to URL
  let tab = await getSessionTab(sessionId);
  await chrome.tabs.update(tab.id, { url: url });
  await waitForTabLoad(tab.id);
  
  // Extract data using content script
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractPageData,
    args: [selectors, extractAttributes]
  });
  
  console.log('✅ Extension: Data extraction completed');
  console.log('🟢 Extracted fields:', Object.keys(result.result.data));
  
  return {
    url: tab.url,
    title: tab.title,
    data: result.result.data,
    extractedAt: Date.now()
  };
}

function extractPageData(selectors, extractAttributes = {}) {
  const data = {};
  
  for (const [key, selector] of Object.entries(selectors)) {
    try {
      const elements = document.querySelectorAll(selector);
      
      if (elements.length === 0) {
        data[key] = null;
        continue;
      }
      
      if (elements.length === 1) {
        // Single element
        const element = elements[0];
        data[key] = {
          text: element.textContent.trim(),
          html: element.innerHTML
        };
        
        // Extract attributes if specified
        if (extractAttributes[key]) {
          data[key].attributes = {};
          for (const attr of extractAttributes[key]) {
            data[key].attributes[attr] = element.getAttribute(attr);
          }
        }
        
      } else {
        // Multiple elements
        data[key] = Array.from(elements).map(element => {
          const item = {
            text: element.textContent.trim(),
            html: element.innerHTML
          };
          
          // Extract attributes if specified
          if (extractAttributes[key]) {
            item.attributes = {};
            for (const attr of extractAttributes[key]) {
              item.attributes[attr] = element.getAttribute(attr);
            }
          }
          
          return item;
        });
      }
      
    } catch (error) {
      data[key] = { error: error.message };
    }
  }
  
  return { data };
}
```

**Console Output:**
```
🟢 Extension: Starting data extraction...
✅ Extension: Data extraction completed
🟢 Extracted fields: ["title", "price", "description", "images", "rating", "availability"]
```

---

## 📊 Session Management Deep Dive

### **Session Lifecycle Example**

```javascript
// MCP Server Session Manager
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.cleanup();
  }
  
  async create(sessionId) {
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      tabId: null,
      windowId: null,
      currentUrl: null,
      state: {},
      history: [],
      activeTools: new Set()
    };
    
    this.sessions.set(sessionId, session);
    
    console.log('🔵 Session Manager: Created session', sessionId);
    console.log('🔵 Active sessions:', this.sessions.size);
    
    return session;
  }
  
  update(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = Date.now();
      
      console.log('🔵 Session Manager: Updated session', sessionId);
      console.log('🔵 Updates:', Object.keys(updates));
    }
  }
  
  addToHistory(sessionId, action, result) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.history.push({
        timestamp: Date.now(),
        action: action,
        result: result,
        url: session.currentUrl
      });
      
      // Keep only last 50 history entries
      if (session.history.length > 50) {
        session.history = session.history.slice(-50);
      }
      
      console.log('🔵 Session Manager: Added to history:', action);
    }
  }
  
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      const timeout = 30 * 60 * 1000; // 30 minutes
      
      let cleanedCount = 0;
      for (const [id, session] of this.sessions) {
        if (now - session.lastActivity > timeout) {
          this.sessions.delete(id);
          cleanedCount++;
          
          console.log('🔵 Session Manager: Cleaned expired session', id);
        }
      }
      
      if (cleanedCount > 0) {
        console.log('🔵 Session Manager: Cleaned', cleanedCount, 'expired sessions');
        console.log('🔵 Active sessions remaining:', this.sessions.size);
      }
      
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}
```

### **Multi-Session Example**
```javascript
// Multiple AI agents working simultaneously
const sessionA = await mcp.createSession({ browser: "chrome", purpose: "shopping" });
const sessionB = await mcp.createSession({ browser: "chrome", purpose: "research" });
const sessionC = await mcp.createSession({ browser: "chrome", purpose: "testing" });

// Session A: Shopping workflow
await sessionA.navigate("https://amazon.com");
await sessionA.screenshot({ filename: "amazon-homepage.png" });
await sessionA.type("#twotabsearchtextbox", "laptop");
await sessionA.click("#nav-search-submit-button");

// Session B: Research workflow (parallel)
await sessionB.navigate("https://wikipedia.org");
await sessionB.type("#searchInput", "artificial intelligence");
await sessionB.click("#searchButton");

// Session C: Testing workflow (parallel)
await sessionC.navigate("https://example.com");
await sessionC.fillForm({
  name: "Test User",
  email: "test@example.com"
});

console.log('All sessions completed successfully');
```

**Console Output:**
```
🔵 Session Manager: Created session session_shopping_001
🔵 Session Manager: Created session session_research_002  
🔵 Session Manager: Created session session_testing_003
🔵 Active sessions: 3

🟢 Extension: Session session_shopping_001 - Navigating to Amazon
🟢 Extension: Session session_research_002 - Navigating to Wikipedia
🟢 Extension: Session session_testing_003 - Navigating to Example.com

All sessions completed successfully
```

---

## 🔧 Error Handling Examples

### **Network Error Scenario**
```javascript
// Simulate network timeout
async function executeScreenshot(parameters, sessionId) {
  try {
    console.log('🟢 Extension: Starting screenshot...');
    
    // Navigate to URL
    await chrome.tabs.update(tab.id, { url: parameters.url });
    
    // Wait for load with timeout
    const loadTimeout = setTimeout(() => {
      throw new Error('Page load timeout after 30 seconds');
    }, 30000);
    
    await waitForTabLoad(tab.id);
    clearTimeout(loadTimeout);
    
    console.log('✅ Extension: Page loaded successfully');
    
  } catch (error) {
    console.error('❌ Extension: Network error:', error.message);
    
    // Send error response back to MCP Server
    sendErrorResponse(requestId, {
      type: 'NETWORK_ERROR',
      message: error.message,
      url: parameters.url,
      timestamp: Date.now()
    });
    
    throw error;
  }
}
```

### **Element Not Found Scenario**  
```javascript
function fillField(selector, value) {
  try {
    const element = document.querySelector(selector);
    
    if (!element) {
      console.log('⚠️ Content Script: Element not found:', selector);
      
      // Try alternative selectors
      const alternatives = [
        selector.replace('#', '[id="') + '"]',
        selector.replace('.', '[class*="') + '"]',
        `*[name="${selector.replace(/[#.\[\]]/g, '')}"]`
      ];
      
      for (const alt of alternatives) {
        const altElement = document.querySelector(alt);
        if (altElement) {
          console.log('✅ Content Script: Found element với alternative selector:', alt);
          altElement.value = value;
          return { success: true, usedSelector: alt };
        }
      }
      
      return { 
        success: false, 
        error: 'Element not found',
        triedSelectors: [selector, ...alternatives]
      };
    }
    
    element.value = value;
    return { success: true, usedSelector: selector };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## 📈 Performance Monitoring

### **Real-time Performance Metrics**
```javascript
// MCP Server Performance Tracker
class PerformanceTracker {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      toolUsage: new Map(),
      sessionCount: 0
    };
  }
  
  recordRequest(tool, startTime, success, error = null) {
    const duration = Date.now() - startTime;
    
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration) / 
      this.metrics.totalRequests;
    
    // Track tool usage
    const toolCount = this.metrics.toolUsage.get(tool) || 0;
    this.metrics.toolUsage.set(tool, toolCount + 1);
    
    console.log('📊 Performance: Request completed');
    console.log('📊 Tool:', tool);
    console.log('📊 Duration:', duration, 'ms');
    console.log('📊 Success rate:', 
      (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(1) + '%');
  }
  
  getStats() {
    return {
      ...this.metrics,
      toolUsage: Object.fromEntries(this.metrics.toolUsage),
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests
    };
  }
}
```

---

## 🎯 Complete System Summary

### **Key System Characteristics:**

1. **🔄 Asynchronous Communication**: All components communicate asynchronously via HTTP và WebSocket
2. **🔌 Modular Architecture**: Each component can be developed và deployed independently  
3. **📡 Real-time Coordination**: MCP Server coordinates all interactions trong real-time
4. **🛡️ Error Resilience**: Comprehensive error handling at every level
5. **📊 Performance Monitoring**: Built-in metrics và monitoring throughout
6. **🔄 Session Management**: Stateful sessions enable complex multi-step workflows

### **Communication Patterns:**
- **AI Agent ↔ CLI**: Natural language → Structured commands
- **CLI ↔ MCP Server**: HTTP REST API với JSON payloads
- **MCP Server ↔ Extension**: WebSocket real-time messaging
- **Extension ↔ Browser**: Chrome Extension APIs

### **Data Flow:**
1. **Command**: Natural language → MCP protocol → Browser action
2. **Response**: Browser result → Structured data → AI-readable format
3. **State**: Persistent sessions maintain context across operations
4. **Monitoring**: Real-time metrics và logging throughout pipeline

**🎯 The MCP Server acts as the intelligent coordination hub, translating between different protocols và managing the complexity of browser automation while providing a clean, standard interface for AI agents.**