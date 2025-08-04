// Mike's MCP Protocol Handler - Multi-Agent Hello World Demo
// Coordinates MCP tool execution between CLI requests, server, and Chrome Extension

const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');

/**
 * MCP Protocol Handler
 * Manages the complete MCP tool execution workflow:
 * CLI → HTTP Request → WebSocket to Extension → Response → CLI
 */
class MCPProtocolHandler {
    constructor(toolRegistry, logger) {
        this.toolRegistry = toolRegistry;
        this.logger = logger;
        this.pendingExecutions = new Map(); // Track ongoing tool executions
        this.extensionConnections = new Set(); // Track extension connections
        this.executionTimeout = 30000; // 30 seconds timeout
        
        this.logger.info('MCP Protocol Handler initialized by Mike ⚙️');
    }
    
    /**
     * Register extension WebSocket connection
     */
    registerExtensionConnection(ws, clientInfo) {
        this.extensionConnections.add(ws);
        
        // Remove from set when connection closes
        ws.on('close', () => {
            this.extensionConnections.delete(ws);
            this.logger.info(`Extension connection removed: ${clientInfo.id}`);
        });
        
        this.logger.info(`Extension connection registered: ${clientInfo.id}`, {
            totalExtensions: this.extensionConnections.size
        });
    }
    
    /**
     * Execute MCP tool - main entry point from HTTP API
     */
    async executeTool(toolName, parameters, requestInfo = {}) {
        const startTime = Date.now();
        const executionId = uuidv4();
        
        this.logger.info(`MCP tool execution started: ${toolName}`, {
            executionId,
            parameters,
            requestInfo
        });
        
        try {
            // Validate tool call
            const validation = this.toolRegistry.validateToolCall(toolName, parameters);
            if (!validation.isValid) {
                const error = new Error(validation.error);
                error.statusCode = 400;
                error.details = {
                    availableTools: validation.availableTools
                };
                throw error;
            }
            
            const { tool, validatedParameters } = validation;
            
            // Execute based on tool's execution handler
            let result;
            switch (tool.executionHandler) {
                case 'websocket_extension_call':
                    result = await this.executeViaWebSocketExtension(
                        toolName, 
                        validatedParameters, 
                        executionId
                    );
                    break;
                default:
                    throw new Error(`Unknown execution handler: ${tool.executionHandler}`);
            }
            
            const executionTime = Date.now() - startTime;
            
            // Record execution in registry
            const executionRecord = this.toolRegistry.recordExecution(
                toolName,
                validatedParameters,
                result,
                executionTime
            );
            
            this.logger.info(`MCP tool execution completed: ${toolName}`, {
                executionId,
                success: result.success,
                executionTime
            });
            
            return {
                ...result,
                executionId,
                executionTime,
                recordId: executionRecord.id
            };
            
        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            this.logger.error(`MCP tool execution failed: ${toolName}`, {
                executionId,
                error: error.message,
                executionTime
            });
            
            // Record failed execution
            const failedResult = {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                executionMetadata: {
                    agent: 'mike',
                    executionTime,
                    failed: true
                }
            };
            
            this.toolRegistry.recordExecution(
                toolName,
                parameters,
                failedResult,
                executionTime
            );
            
            // Re-throw with additional context
            error.executionId = executionId;
            error.agent = 'mike';
            throw error;
        }
    }
    
    /**
     * Execute tool via WebSocket call to Chrome Extension
     */
    async executeViaWebSocketExtension(toolName, parameters, executionId) {
        return new Promise((resolve, reject) => {
            // Check if any extensions are connected
            if (this.extensionConnections.size === 0) {
                reject(new Error('No Chrome Extensions connected. Please ensure Sarah\'s extension is installed and active.'));
                return;
            }
            
            // Set up execution tracking
            const execution = {
                executionId,
                toolName,
                parameters,
                startTime: Date.now(),
                resolve,
                reject,
                timeout: null
            };
            
            this.pendingExecutions.set(executionId, execution);
            
            // Set timeout
            execution.timeout = setTimeout(() => {
                this.pendingExecutions.delete(executionId);
                reject(new Error(`Tool execution timeout after ${this.executionTimeout}ms`));
            }, this.executionTimeout);
            
            // Prepare message for extension
            const extensionMessage = {
                type: 'console_hello',
                data: {
                    executionId,
                    toolName,
                    parameters,
                    timestamp: new Date().toISOString(),
                    agent: 'mike'
                }
            };
            
            // Send to all connected extensions
            let messagesSent = 0;
            this.extensionConnections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(JSON.stringify(extensionMessage));
                        messagesSent++;
                    } catch (error) {
                        this.logger.warn('Failed to send message to extension', { error: error.message });
                    }
                }
            });
            
            if (messagesSent === 0) {
                clearTimeout(execution.timeout);
                this.pendingExecutions.delete(executionId);
                reject(new Error('No active extension connections available'));
                return;
            }
            
            this.logger.info(`WebSocket message sent to extensions`, {
                executionId,
                messagesSent,
                totalConnections: this.extensionConnections.size
            });
        });
    }
    
    /**
     * Handle response from Chrome Extension
     */
    handleExtensionResponse(ws, message, clientInfo) {
        try {
            if (message.type !== 'console_hello_response') {
                return false; // Not handled by this protocol
            }
            
            const { executionId, result, error } = message.data || {};
            
            if (!executionId) {
                this.logger.warn('Extension response missing executionId', { message });
                return true; // Handled but invalid
            }
            
            const execution = this.pendingExecutions.get(executionId);
            if (!execution) {
                this.logger.warn('Extension response for unknown execution', { executionId });
                return true; // Handled but unknown
            }
            
            // Clear timeout and remove from pending
            clearTimeout(execution.timeout);
            this.pendingExecutions.delete(executionId);
            
            this.logger.info(`Extension response received for ${execution.toolName}`, {
                executionId,
                success: !error,
                clientId: clientInfo.id
            });
            
            // Prepare final result
            const finalResult = {
                success: !error,
                result: result || (error ? `Error: ${error}` : 'Execution completed'),
                timestamp: new Date().toISOString(),
                executionMetadata: {
                    agent: 'mike',
                    extensionId: clientInfo.id,
                    executionTime: Date.now() - execution.startTime,
                    tabId: message.data?.tabId,
                    url: message.data?.url
                }
            };
            
            if (error) {
                finalResult.error = error;
            }
            
            // Resolve the promise
            execution.resolve(finalResult);
            
            return true; // Successfully handled
            
        } catch (processingError) {
            this.logger.error('Error processing extension response', {
                error: processingError.message,
                message
            });
            return true; // Handled but with error
        }
    }
    
    /**
     * Get current execution status
     */
    getExecutionStatus() {
        const pendingCount = this.pendingExecutions.size;
        const pendingExecutions = Array.from(this.pendingExecutions.values()).map(exec => ({
            executionId: exec.executionId,
            toolName: exec.toolName,
            startTime: exec.startTime,
            duration: Date.now() - exec.startTime
        }));
        
        return {
            pendingExecutions: pendingCount,
            connectedExtensions: this.extensionConnections.size,
            executionTimeout: this.executionTimeout,
            pending: pendingExecutions,
            timestamp: new Date().toISOString(),
            agent: 'mike'
        };
    }
    
    /**
     * Cleanup expired executions
     */
    cleanupExpiredExecutions() {
        const now = Date.now();
        let cleanedCount = 0;
        
        this.pendingExecutions.forEach((execution, executionId) => {
            const age = now - execution.startTime;
            if (age > this.executionTimeout) {
                clearTimeout(execution.timeout);
                this.pendingExecutions.delete(executionId);
                execution.reject(new Error('Execution expired during cleanup'));
                cleanedCount++;
            }
        });
        
        if (cleanedCount > 0) {
            this.logger.info(`Cleaned up ${cleanedCount} expired executions`);
        }
        
        return cleanedCount;
    }
    
    /**
     * Health check for MCP protocol
     */
    getProtocolHealth() {
        return {
            status: 'healthy',
            connectedExtensions: this.extensionConnections.size,
            pendingExecutions: this.pendingExecutions.size,
            registeredTools: this.toolRegistry.tools.size,
            executionTimeout: this.executionTimeout,
            capabilities: [
                'websocket_extension_communication',
                'tool_execution_coordination',
                'timeout_management',
                'execution_tracking'
            ],
            timestamp: new Date().toISOString(),
            agent: 'mike'
        };
    }
}

module.exports = MCPProtocolHandler;