// Mike's MCP Server Implementation - Hello World Multi-Agent Demo
// Handles WebSocket connections, REST API, và coordinates với Sarah's extension và Emma's CLI

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const Joi = require('joi');
const MCPToolRegistry = require('./mcp-tools');
const MCPProtocolHandler = require('./mcp-protocol');

class HelloWorldMCPServer {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.clients = new Map(); // Store connected clients
        this.messageHistory = []; // Store recent messages
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            totalMessages: 0,
            uptime: Date.now()
        };
        
        this.setupLogger();
        this.setupMCPSystem();
        this.setupExpress();
        this.setupWebSocket();
        this.setupAPIRoutes();
        this.setupErrorHandling();
    }
    
    setupLogger() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'hello-world-mcp-server', agent: 'mike' },
            transports: [
                new winston.transports.File({ filename: 'error.log', level: 'error' }),
                new winston.transports.File({ filename: 'combined.log' }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });
        
        this.logger.info('Logger initialized by Mike ⚙️');
    }
    
    setupMCPSystem() {
        // Initialize MCP Tool Registry
        this.mcpToolRegistry = new MCPToolRegistry(this.logger);
        
        // Initialize MCP Protocol Handler
        this.mcpProtocolHandler = new MCPProtocolHandler(this.mcpToolRegistry, this.logger);
        
        this.logger.info('MCP System initialized by Mike ⚙️');
    }
    
    setupExpress() {
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false, // Disable for development
            crossOriginEmbedderPolicy: false
        }));
        
        // CORS for extension communication
        this.app.use(cors({
            origin: ['chrome-extension://*', 'http://localhost:*'],
            credentials: true
        }));
        
        this.app.use(express.json({ limit: '1mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
        
        this.logger.info('Express server configured');
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ 
            server: this.server,
            clientTracking: true
        });
        
        this.wss.on('connection', (ws, req) => {
            this.handleNewConnection(ws, req);
        });
        
        this.logger.info('WebSocket server configured');
    }
    
    handleNewConnection(ws, req) {
        const clientId = uuidv4();
        const clientInfo = {
            id: clientId,
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            connectedAt: new Date().toISOString(),
            messageCount: 0
        };
        
        this.clients.set(ws, clientInfo);
        this.stats.totalConnections++;
        this.stats.activeConnections++;
        
        this.logger.info(`New WebSocket connection: ${clientId}`, clientInfo);
        
        // Send welcome message
        this.sendMessage(ws, {
            type: 'server_info',
            data: {
                message: 'Connected to Hello World MCP Server',
                clientId: clientId,
                agent: 'mike',
                serverTime: new Date().toISOString(),
                serverVersion: '1.0.0'
            }
        });
        
        // Handle incoming messages
        ws.on('message', (data) => {
            this.handleWebSocketMessage(ws, data);
        });
        
        // Handle disconnection
        ws.on('close', (code, reason) => {
            this.handleDisconnection(ws, code, reason);
        });
        
        // Handle errors
        ws.on('error', (error) => {
            this.logger.error('WebSocket error:', error);
        });
        
        // Send ping periodically to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            } else {
                clearInterval(pingInterval);
            }
        }, 30000); // 30 seconds
    }
    
    handleWebSocketMessage(ws, data) {
        try {
            const message = JSON.parse(data.toString());
            const client = this.clients.get(ws);
            
            if (!client) {
                this.logger.warn('Message from unknown client');
                return;
            }
            
            client.messageCount++;
            this.stats.totalMessages++;
            
            this.logger.info(`Message from ${client.id}:`, message);
            
            // Validate message structure
            const validation = this.validateMessage(message);
            if (!validation.isValid) {
                this.sendError(ws, 'Invalid message format', validation.error);
                return;
            }
            
            // Route message based on type
            switch (message.type) {
                case 'hello_request':
                    this.handleHelloRequest(ws, message.data, client);
                    break;
                    
                case 'ping':
                    this.handlePing(ws, message.data, client);
                    break;
                    
                case 'get_stats':
                    this.handleStatsRequest(ws, client);
                    break;
                    
                default:
                    this.sendError(ws, 'Unknown message type', { type: message.type });
            }
            
            // Store message in history (keep last 100)
            this.messageHistory.push({
                clientId: client.id,
                timestamp: new Date().toISOString(),
                type: message.type,
                data: message.data
            });
            
            if (this.messageHistory.length > 100) {
                this.messageHistory.shift();
            }
            
        } catch (error) {
            this.logger.error('Error processing WebSocket message:', error);
            this.sendError(ws, 'Message processing error', error.message);
        }
    }
    
    validateMessage(message) {
        const messageSchema = Joi.object({
            type: Joi.string().required(),
            data: Joi.object().default({})
        });
        
        const { error } = messageSchema.validate(message);
        return {
            isValid: !error,
            error: error?.details[0]?.message
        };
    }
    
    handleHelloRequest(ws, data, client) {
        // Validate hello request data
        const helloSchema = Joi.object({
            name: Joi.string().min(1).max(100).required(),
            timestamp: Joi.string().optional(),
            source: Joi.string().optional(),
            agent: Joi.string().optional()
        });
        
        const { error, value } = helloSchema.validate(data);
        if (error) {
            this.sendError(ws, 'Invalid hello request', error.details[0].message);
            return;
        }
        
        const { name } = value;
        
        // Generate personalized greeting
        const greetings = [
            `Hello ${name}! Welcome to the Multi-Agent Hello World demo! 🎉`,
            `Hi there ${name}! Great to meet you! 👋`,
            `Greetings ${name}! The server is happy to see you! 😊`,
            `Hello ${name}! This message was crafted by Mike's MCP server! ⚙️`,
            `Welcome ${name}! You're connected to our multi-agent system! 🤖`
        ];
        
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        // Send response
        this.sendMessage(ws, {
            type: 'hello_response',
            data: {
                greeting: greeting,
                userName: name,
                server_time: new Date().toISOString(),
                agent: 'mike',
                clientId: client.id,
                messageCount: client.messageCount,
                responseId: uuidv4()
            }
        });
        
        this.logger.info(`Hello request processed for ${name} from client ${client.id}`);
    }
    
    handlePing(ws, data, client) {
        this.sendMessage(ws, {
            type: 'pong',
            data: {
                timestamp: new Date().toISOString(),
                agent: 'mike',
                clientId: client.id
            }
        });
    }
    
    handleStatsRequest(ws, client) {
        const currentStats = {
            ...this.stats,
            uptime: Date.now() - this.stats.uptime,
            clientInfo: {
                id: client.id,
                connectedAt: client.connectedAt,
                messageCount: client.messageCount
            }
        };
        
        this.sendMessage(ws, {
            type: 'stats_response',
            data: currentStats
        });
    }
    
    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    sendError(ws, message, details = null) {
        this.sendMessage(ws, {
            type: 'error',
            data: {
                message: message,
                details: details,
                timestamp: new Date().toISOString(),
                agent: 'mike'
            }
        });
    }
    
    handleDisconnection(ws, code, reason) {
        const client = this.clients.get(ws);
        if (client) {
            this.stats.activeConnections--;
            this.logger.info(`Client disconnected: ${client.id}`, { code, reason: reason.toString() });
            this.clients.delete(ws);
        }
    }
    
    setupAPIRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                agent: 'mike',
                server: 'hello-world-mcp-server',
                version: '1.0.0',
                uptime: Date.now() - this.stats.uptime,
                stats: this.stats
            });
        });
        
        // Hello API endpoint
        this.app.post('/api/hello', (req, res) => {
            const { name } = req.body;
            
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({
                    error: 'Name is required',
                    agent: 'mike'
                });
            }
            
            const cleanName = name.trim().substring(0, 100);
            const greeting = `Hello ${cleanName}! This greeting comes from Mike's REST API endpoint! 🎯`;
            
            res.json({
                greeting: greeting,
                userName: cleanName,
                timestamp: new Date().toISOString(),
                agent: 'mike',
                source: 'rest_api',
                responseId: uuidv4()
            });
            
            this.logger.info(`REST API hello request for: ${cleanName}`);
        });
        
        // Get server statistics
        this.app.get('/api/stats', (req, res) => {
            res.json({
                ...this.stats,
                uptime: Date.now() - this.stats.uptime,
                timestamp: new Date().toISOString(),
                agent: 'mike',
                recentMessages: this.messageHistory.slice(-10) // Last 10 messages
            });
        });
        
        // Get connected clients info
        this.app.get('/api/clients', (req, res) => {
            const clientsInfo = Array.from(this.clients.values()).map(client => ({
                id: client.id,
                connectedAt: client.connectedAt,
                messageCount: client.messageCount,
                ip: client.ip.replace(/^::ffff:/, '') // Clean IPv6 prefix
            }));
            
            res.json({
                activeConnections: this.stats.activeConnections,
                clients: clientsInfo,
                timestamp: new Date().toISOString(),
                agent: 'mike'
            });
        });
        
        // Test endpoint for Emma's CLI
        this.app.get('/api/test', (req, res) => {
            res.json({
                message: 'MCP Server is working correctly!',
                agent: 'mike',
                timestamp: new Date().toISOString(),
                requestFrom: req.ip,
                testPassed: true
            });
        });
        
        // MCP Tool Discovery endpoint
        this.app.get('/api/tools', (req, res) => {
            try {
                const discoveryInfo = this.mcpToolRegistry.getToolDiscoveryInfo();
                res.json(discoveryInfo);
            } catch (error) {
                this.logger.error('Error in tool discovery endpoint:', error);
                res.status(500).json({
                    error: 'Failed to retrieve tool information',
                    agent: 'mike',
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // MCP Tool Execution endpoint
        this.app.post('/api/tools/:toolName/call', async (req, res) => {
            try {
                const { toolName } = req.params;
                const parameters = req.body || {};
                
                // Add request metadata
                const requestInfo = {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                };
                
                this.logger.info(`MCP tool call received: ${toolName}`, {
                    parameters,
                    requestInfo
                });
                
                // Execute tool via MCP protocol handler
                const result = await this.mcpProtocolHandler.executeTool(
                    toolName,
                    parameters,
                    requestInfo
                );
                
                res.json({
                    ...result,
                    agent: 'mike',
                    toolName
                });
                
            } catch (error) {
                this.logger.error('MCP tool execution error:', error);
                
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({
                    error: error.message,
                    agent: 'mike',
                    executionId: error.executionId,
                    timestamp: new Date().toISOString(),
                    details: error.details
                });
            }
        });
        
        // MCP Execution Status endpoint
        this.app.get('/api/tools/status', (req, res) => {
            try {
                const status = this.mcpProtocolHandler.getExecutionStatus();
                const stats = this.mcpToolRegistry.getExecutionStats();
                
                res.json({
                    protocolStatus: status,
                    executionStats: stats,
                    protocolHealth: this.mcpProtocolHandler.getProtocolHealth(),
                    timestamp: new Date().toISOString(),
                    agent: 'mike'
                });
            } catch (error) {
                this.logger.error('Error in MCP status endpoint:', error);
                res.status(500).json({
                    error: 'Failed to retrieve MCP status',
                    agent: 'mike',
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        this.logger.info('API routes configured');
    }
    
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                agent: 'mike',
                availableEndpoints: [
                    'GET /health',
                    'POST /api/hello',
                    'GET /api/stats',
                    'GET /api/clients',
                    'GET /api/test',
                    'GET /api/tools',
                    'POST /api/tools/:toolName/call',
                    'GET /api/tools/status'
                ]
            });
        });
        
        // Global error handler
        this.app.use((error, req, res, next) => {
            this.logger.error('Express error:', error);
            
            res.status(500).json({
                error: 'Internal server error',
                agent: 'mike',
                timestamp: new Date().toISOString()
            });
        });
        
        // Handle server shutdown gracefully
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGINT', () => this.shutdown('SIGINT'));
        
        this.logger.info('Error handling configured');
    }
    
    start() {
        this.server.listen(this.port, () => {
            this.logger.info(`🚀 Hello World MCP Server started by Mike ⚙️`);
            this.logger.info(`📡 HTTP Server: http://localhost:${this.port}`);
            this.logger.info(`🔗 WebSocket Server: ws://localhost:${this.port}`);
            this.logger.info(`💻 Ready for Sarah's extension và Emma's CLI!`);
            
            console.log('\\n=== Server Endpoints ===');
            console.log(`Health Check: http://localhost:${this.port}/health`);
            console.log(`Hello API: http://localhost:${this.port}/api/hello`);
            console.log(`Statistics: http://localhost:${this.port}/api/stats`);
            console.log(`WebSocket: ws://localhost:${this.port}`);
            console.log('\\n=== MCP Tool Endpoints ===');
            console.log(`Tool Discovery: http://localhost:${this.port}/api/tools`);
            console.log(`Tool Execution: http://localhost:${this.port}/api/tools/:toolName/call`);
            console.log(`MCP Status: http://localhost:${this.port}/api/tools/status`);
            console.log('========================\\n');
        });
    }
    
    shutdown(signal) {
        this.logger.info(`Received ${signal}, shutting down gracefully`);
        
        // Close WebSocket connections
        this.wss.clients.forEach(ws => {
            ws.close(1000, 'Server shutting down');
        });
        
        // Close HTTP server
        this.server.close(() => {
            this.logger.info('Server shut down successfully');
            process.exit(0);
        });
        
        // Force exit after 10 seconds
        setTimeout(() => {
            this.logger.error('Forced server shutdown');
            process.exit(1);
        }, 10000);
    }
}

// Start the server
if (require.main === module) {
    const server = new HelloWorldMCPServer();
    server.start();
}

module.exports = HelloWorldMCPServer;