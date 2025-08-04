// Emma's MCP Client Implementation - Browser Control Integration
// HTTP client for MCP tool discovery and execution

const axios = require('axios');
const chalk = require('chalk');

class MCPClient {
    constructor(baseUrl = 'http://localhost:3000', options = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.timeout = options.timeout || 10000;
        this.retries = options.retries || 3;
        
        // Create axios instance with defaults
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Emma-CLI/1.0.0'
            }
        });
        
        // Add request/response interceptors for debugging
        this.client.interceptors.request.use(
            (config) => {
                if (options.debug) {
                    console.log(chalk.gray(`→ ${config.method.toUpperCase()} ${config.url}`));
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
        
        this.client.interceptors.response.use(
            (response) => {
                if (options.debug) {
                    console.log(chalk.gray(`← ${response.status} ${response.statusText}`));
                }
                return response;
            },
            (error) => {
                if (options.debug && error.response) {
                    console.log(chalk.gray(`← ${error.response.status} ${error.response.statusText}`));
                }
                return Promise.reject(error);
            }
        );
    }
    
    /**
     * Discover available MCP tools
     * @returns {Promise<Object>} Tool registry information
     */
    async discoverTools() {
        try {
            const response = await this.client.get('/api/tools');
            return response.data;
        } catch (error) {
            throw this._handleError(error, 'Failed to discover MCP tools');
        }
    }
    
    /**
     * Get MCP server status
     * @returns {Promise<Object>} Server status information
     */
    async getStatus() {
        try {
            const response = await this.client.get('/api/tools/status');
            return response.data;
        } catch (error) {
            throw this._handleError(error, 'Failed to get MCP server status');
        }
    }
    
    /**
     * Execute console hello tool
     * @param {string} message - Optional custom message
     * @returns {Promise<Object>} Execution result
     */
    async executeConsoleHello(message = 'Hello from Emma\'s CLI!') {
        const toolName = 'mcp:tool.console_hello';
        const parameters = { message };
        
        return await this.executeTool(toolName, parameters);
    }
    
    /**
     * Execute any MCP tool
     * @param {string} toolName - Name of the tool to execute
     * @param {Object} parameters - Tool parameters
     * @returns {Promise<Object>} Execution result
     */
    async executeTool(toolName, parameters = {}) {
        try {
            const payload = {
                parameters: parameters,
                metadata: {
                    timestamp: new Date().toISOString(),
                    source: 'emma_cli',
                    version: '1.0.0'
                }
            };
            
            const response = await this.client.post(
                `/api/tools/${encodeURIComponent(toolName)}/call`,
                payload
            );
            
            return response.data;
            
        } catch (error) {
            throw this._handleError(error, `Failed to execute tool: ${toolName}`);
        }
    }
    
    /**
     * Test MCP server connectivity
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            await this.client.get('/health', { timeout: 5000 });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Validate tool exists and get its schema
     * @param {string} toolName - Name of the tool to validate
     * @returns {Promise<Object>} Tool schema information
     */
    async validateTool(toolName) {
        try {
            const tools = await this.discoverTools();
            
            if (!tools.tools || !Array.isArray(tools.tools)) {
                throw new Error('Invalid tools registry response');
            }
            
            const tool = tools.tools.find(t => t.name === toolName);
            
            if (!tool) {
                throw new Error(`Tool '${toolName}' not found in registry`);
            }
            
            return tool;
            
        } catch (error) {
            throw this._handleError(error, `Failed to validate tool: ${toolName}`);
        }
    }
    
    /**
     * Execute tool with retry logic
     * @param {string} toolName - Name of the tool to execute
     * @param {Object} parameters - Tool parameters
     * @param {number} maxRetries - Maximum number of retries
     * @returns {Promise<Object>} Execution result
     */
    async executeToolWithRetry(toolName, parameters = {}, maxRetries = null) {
        const retries = maxRetries || this.retries;
        let lastError;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await this.executeTool(toolName, parameters);
            } catch (error) {
                lastError = error;
                
                if (attempt === retries) {
                    break;
                }
                
                // Wait before retry (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }
    
    /**
     * Handle and format errors consistently
     * @private
     */
    _handleError(error, context) {
        if (error.code === 'ECONNREFUSED') {
            return new Error(`${context}: MCP Server is not running at ${this.baseUrl}`);
        }
        
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const message = error.response.data?.message || error.response.statusText;
            return new Error(`${context}: ${status} - ${message}`);
        }
        
        if (error.request) {
            // Request was made but no response received
            return new Error(`${context}: Network error - ${error.message}`);
        }
        
        // Something else happened
        return new Error(`${context}: ${error.message}`);
    }
    
    /**
     * Format execution results for display
     * @param {Object} result - Raw execution result
     * @returns {Object} Formatted result
     */
    formatResult(result) {
        if (!result) {
            return { success: false, message: 'No result received' };
        }
        
        return {
            success: result.success || false,
            message: result.message || 'No message',
            data: result.data || null,
            timestamp: result.timestamp || new Date().toISOString(),
            executionTime: result.executionTime || null,
            toolName: result.toolName || 'unknown'
        };
    }
}

module.exports = { MCPClient };