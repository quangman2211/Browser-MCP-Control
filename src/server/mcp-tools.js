// Mike's MCP Tool Registry - Multi-Agent Hello World Demo
// Manages tool definitions, validation, and execution for MCP protocol compliance

const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

/**
 * MCP Tool Registry
 * Handles tool registration, discovery, validation, and execution coordination
 */
class MCPToolRegistry {
    constructor(logger) {
        this.logger = logger;
        this.tools = new Map();
        this.executionHistory = [];
        
        // Register built-in tools
        this.registerBuiltInTools();
        
        this.logger.info('MCP Tool Registry initialized by Mike ⚙️');
    }
    
    /**
     * Register all built-in MCP tools
     */
    registerBuiltInTools() {
        // Register the console_hello tool for browser console execution
        this.registerTool({
            name: 'mcp:tool.console_hello',
            description: 'Execute console.log message in browser tab via Chrome Extension',
            version: '1.0.0',
            agent: 'mike',
            parameters: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        default: 'Hello World',
                        description: 'Message to log to browser console',
                        minLength: 1,
                        maxLength: 500
                    },
                    targetTab: {
                        type: 'string', 
                        default: 'active',
                        description: 'Target tab selector: active, all, or specific tab ID',
                        enum: ['active', 'all']
                    }
                },
                required: ['message'],
                additionalProperties: false
            },
            returns: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    result: { type: 'string' },
                    timestamp: { type: 'string' },
                    executionMetadata: {
                        type: 'object',
                        properties: {
                            tabId: { type: 'number' },
                            url: { type: 'string' },
                            executionTime: { type: 'number' },
                            agent: { type: 'string' }
                        }
                    },
                    error: { type: 'string' }
                }
            },
            executionHandler: 'websocket_extension_call'
        });
        
        this.logger.info('Built-in MCP tools registered', { 
            toolCount: this.tools.size,
            tools: Array.from(this.tools.keys())
        });
    }
    
    /**
     * Register a new MCP tool
     */
    registerTool(toolDefinition) {
        // Validate tool definition
        const validation = this.validateToolDefinition(toolDefinition);
        if (!validation.isValid) {
            throw new Error(`Invalid tool definition: ${validation.error}`);
        }
        
        const tool = {
            ...toolDefinition,
            registeredAt: new Date().toISOString(),
            registeredBy: 'mike',
            callCount: 0,
            lastCalled: null
        };
        
        this.tools.set(toolDefinition.name, tool);
        
        this.logger.info(`Tool registered: ${toolDefinition.name}`, {
            description: toolDefinition.description,
            version: toolDefinition.version
        });
        
        return true;
    }
    
    /**
     * Validate tool definition against MCP schema
     */
    validateToolDefinition(toolDefinition) {
        const toolSchema = Joi.object({
            name: Joi.string().pattern(/^mcp:tool\.[a-zA-Z_][a-zA-Z0-9_]*$/).required(),
            description: Joi.string().min(10).max(500).required(),
            version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
            agent: Joi.string().required(),
            parameters: Joi.object({
                type: Joi.string().valid('object').required(),
                properties: Joi.object().required(),
                required: Joi.array().items(Joi.string()).default([]),
                additionalProperties: Joi.boolean().default(false)
            }).required(),
            returns: Joi.object().required(),
            executionHandler: Joi.string().required()
        });
        
        const { error } = toolSchema.validate(toolDefinition);
        return {
            isValid: !error,
            error: error?.details[0]?.message
        };
    }
    
    /**
     * Get tool by name
     */
    getTool(toolName) {
        return this.tools.get(toolName);
    }
    
    /**
     * List all registered tools
     */
    listTools() {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            version: tool.version,
            agent: tool.agent,
            parameters: tool.parameters,
            returns: tool.returns,
            callCount: tool.callCount,
            lastCalled: tool.lastCalled,
            registeredAt: tool.registeredAt
        }));
    }
    
    /**
     * Validate tool call parameters
     */
    validateToolCall(toolName, parameters) {
        const tool = this.getTool(toolName);
        if (!tool) {
            return {
                isValid: false,
                error: `Tool not found: ${toolName}`,
                availableTools: Array.from(this.tools.keys())
            };
        }
        
        // Create Joi schema from tool parameters definition
        const paramSchema = this.createJoiSchemaFromParameters(tool.parameters);
        const { error, value } = paramSchema.validate(parameters);
        
        return {
            isValid: !error,
            error: error?.details[0]?.message,
            validatedParameters: value,
            tool: tool
        };
    }
    
    /**
     * Convert MCP parameter schema to Joi schema
     */
    createJoiSchemaFromParameters(parameterDef) {
        const properties = parameterDef.properties || {};
        const required = parameterDef.required || [];
        
        let schemaFields = {};
        
        Object.keys(properties).forEach(propName => {
            const prop = properties[propName];
            let joiField;
            
            switch (prop.type) {
                case 'string':
                    joiField = Joi.string();
                    if (prop.minLength) joiField = joiField.min(prop.minLength);
                    if (prop.maxLength) joiField = joiField.max(prop.maxLength);
                    if (prop.enum) joiField = joiField.valid(...prop.enum);
                    break;
                case 'number':
                    joiField = Joi.number();
                    if (prop.minimum !== undefined) joiField = joiField.min(prop.minimum);
                    if (prop.maximum !== undefined) joiField = joiField.max(prop.maximum);
                    break;
                case 'boolean':
                    joiField = Joi.boolean();
                    break;
                case 'object':
                    joiField = Joi.object();
                    break;
                case 'array':
                    joiField = Joi.array();
                    break;
                default:
                    joiField = Joi.any();
            }
            
            // Add default value if specified
            if (prop.default !== undefined) {
                joiField = joiField.default(prop.default);
            }
            
            // Make required if in required array
            if (!required.includes(propName)) {
                joiField = joiField.optional();
            }
            
            schemaFields[propName] = joiField;
        });
        
        return Joi.object(schemaFields);
    }
    
    /**
     * Record tool execution attempt
     */
    recordExecution(toolName, parameters, result, executionTime = null) {
        const tool = this.getTool(toolName);
        if (tool) {
            tool.callCount++;
            tool.lastCalled = new Date().toISOString();
        }
        
        const execution = {
            id: uuidv4(),
            toolName: toolName,
            parameters: parameters,
            result: result,
            timestamp: new Date().toISOString(),
            executionTime: executionTime,
            agent: 'mike'
        };
        
        this.executionHistory.push(execution);
        
        // Keep only last 100 executions
        if (this.executionHistory.length > 100) {
            this.executionHistory.shift();
        }
        
        this.logger.info(`Tool execution recorded: ${toolName}`, {
            success: result.success,
            executionTime: executionTime
        });
        
        return execution;
    }
    
    /**
     * Get execution statistics
     */
    getExecutionStats() {
        const tools = Array.from(this.tools.values());
        const totalCalls = tools.reduce((sum, tool) => sum + tool.callCount, 0);
        
        return {
            totalTools: this.tools.size,
            totalExecutions: totalCalls,
            recentExecutions: this.executionHistory.slice(-10),
            toolUsage: tools.map(tool => ({
                name: tool.name,
                callCount: tool.callCount,
                lastCalled: tool.lastCalled
            })).sort((a, b) => b.callCount - a.callCount),
            timestamp: new Date().toISOString(),
            agent: 'mike'
        };
    }
    
    /**
     * Get tool discovery information for MCP clients
     */
    getToolDiscoveryInfo() {
        return {
            protocol: 'MCP',
            version: '1.0.0',
            server: 'hello-world-mcp-server',
            agent: 'mike',
            toolCount: this.tools.size,
            tools: this.listTools(),
            capabilities: [
                'tool_registry',
                'tool_discovery',
                'tool_validation',
                'execution_tracking',
                'websocket_extension_integration'
            ],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = MCPToolRegistry;