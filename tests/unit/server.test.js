// David's Unit Tests - MCP Server (Mike's Component)
// Tests Mike's server implementation independently

const request = require('supertest');
const WebSocket = require('ws');
const HelloWorldMCPServer = require('../../src/server/server.js');

describe('MCP Server Unit Tests - Mike\'s Component', () => {
    let server;
    let app;
    
    beforeAll(async () => {
        // Start server for testing
        server = new HelloWorldMCPServer();
        app = server.app;
        
        // Wait for server to be ready
        await new Promise(resolve => {
            server.server.listen(0, () => {
                const port = server.server.address().port;
                process.env.TEST_PORT = port;
                resolve();
            });
        });
    });
    
    afterAll(async () => {
        if (server && server.server) {
            await new Promise(resolve => {
                server.server.close(resolve);
            });
        }
    });
    
    describe('Health Check Endpoint', () => {
        test('should return healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('agent', 'mike');
            expect(response.body).toHaveProperty('server', 'hello-world-mcp-server');
            expect(response.body).toHaveProperty('version', '1.0.0');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('stats');
            expect(response.body.timestamp).toHaveValidTimestamp();
        });
        
        test('should include server statistics', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body.stats).toHaveProperty('totalConnections');
            expect(response.body.stats).toHaveProperty('activeConnections');
            expect(response.body.stats).toHaveProperty('totalMessages');
            expect(response.body.stats).toHaveProperty('uptime');
            
            expect(typeof response.body.stats.totalConnections).toBe('number');
            expect(typeof response.body.stats.activeConnections).toBe('number');
            expect(typeof response.body.stats.totalMessages).toBe('number');
        });
    });
    
    describe('Hello API Endpoint', () => {
        test('should return greeting for valid name', async () => {
            const testName = 'David';
            
            const response = await request(app)
                .post('/api/hello')
                .send({ name: testName })
                .expect(200);
            
            expect(response.body).toHaveProperty('greeting');
            expect(response.body).toHaveProperty('userName', testName);
            expect(response.body).toHaveProperty('agent', 'mike');
            expect(response.body).toHaveProperty('source', 'rest_api');
            expect(response.body).toHaveProperty('responseId');
            expect(response.body.timestamp).toHaveValidTimestamp();
            expect(response.body.greeting).toBeValidGreeting();
            expect(response.body.greeting).toContain(testName);
        });
        
        test('should handle empty name', async () => {
            const response = await request(app)
                .post('/api/hello')
                .send({ name: '' })
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Name is required');
            expect(response.body).toHaveProperty('agent', 'mike');
        });
        
        test('should handle missing name', async () => {
            const response = await request(app)
                .post('/api/hello')
                .send({})
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Name is required');
            expect(response.body).toHaveProperty('agent', 'mike');
        });
        
        test('should handle long names', async () => {
            const longName = 'A'.repeat(200);
            
            const response = await request(app)
                .post('/api/hello')
                .send({ name: longName })
                .expect(200);
            
            // Name should be truncated to 100 characters
            expect(response.body.userName).toHaveLength(100);
            expect(response.body.greeting).toContain('A'.repeat(100));
        });
        
        test('should handle special characters in name', async () => {
            const specialName = 'João & María-José';
            
            const response = await request(app)
                .post('/api/hello')
                .send({ name: specialName })
                .expect(200);
            
            expect(response.body.userName).toBe(specialName);
            expect(response.body.greeting).toContain(specialName);
        });
    });
    
    describe('Statistics Endpoint', () => {
        test('should return server statistics', async () => {
            const response = await request(app)
                .get('/api/stats')
                .expect(200);
            
            expect(response.body).toHaveProperty('totalConnections');
            expect(response.body).toHaveProperty('activeConnections');
            expect(response.body).toHaveProperty('totalMessages');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('agent', 'mike');
            expect(response.body).toHaveProperty('recentMessages');
            expect(response.body.timestamp).toHaveValidTimestamp();
            
            expect(Array.isArray(response.body.recentMessages)).toBe(true);
        });
    });
    
    describe('Test Endpoint', () => {
        test('should return test success response', async () => {
            const response = await request(app)
                .get('/api/test')
                .expect(200);
            
            expect(response.body).toHaveProperty('message', 'MCP Server is working correctly!');
            expect(response.body).toHaveProperty('agent', 'mike');
            expect(response.body).toHaveProperty('testPassed', true);
            expect(response.body.timestamp).toHaveValidTimestamp();
        });
    });
    
    describe('Error Handling', () => {
        test('should return 404 for unknown endpoints', async () => {
            const response = await request(app)
                .get('/api/unknown')
                .expect(404);
            
            expect(response.body).toHaveProperty('error', 'Endpoint not found');
            expect(response.body).toHaveProperty('agent', 'mike');
            expect(response.body).toHaveProperty('availableEndpoints');
            expect(Array.isArray(response.body.availableEndpoints)).toBe(true);
        });
        
        test('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/api/hello')
                .send('invalid json')
                .set('Content-Type', 'application/json')
                .expect(400);
        });
    });
    
    describe('WebSocket Server', () => {
        test('should accept WebSocket connections', async () => {
            const port = process.env.TEST_PORT;
            const ws = new WebSocket(`ws://localhost:${port}`);
            
            await new Promise((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);
                
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });
            
            // Should receive welcome message
            const welcomeMessage = await new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    resolve(JSON.parse(data.toString()));
                });
                
                setTimeout(() => reject(new Error('No welcome message')), 2000);
            });
            
            expect(welcomeMessage.type).toBe('server_info');
            expect(welcomeMessage.data.agent).toBe('mike');
            expect(welcomeMessage.data.message).toContain('Connected to Hello World MCP Server');
            
            ws.close();
        });
        
        test('should handle hello requests via WebSocket', async () => {
            const port = process.env.TEST_PORT;
            const ws = new WebSocket(`ws://localhost:${port}`);
            
            await new Promise((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);
                setTimeout(() => reject(new Error('Connection timeout')), 5000);
            });
            
            // Skip welcome message
            await new Promise(resolve => {
                ws.on('message', () => resolve());
            });
            
            // Send hello request
            const testName = 'WebSocket Test';
            ws.send(JSON.stringify({
                type: 'hello_request',
                data: {
                    name: testName,
                    timestamp: new Date().toISOString(),
                    source: 'unit_test',
                    agent: 'david'
                }
            }));
            
            // Wait for response
            const response = await new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'hello_response') {
                        resolve(message);
                    }
                });
                
                setTimeout(() => reject(new Error('No response received')), 5000);
            });
            
            expect(response.type).toBe('hello_response');
            expect(response.data.agent).toBe('mike');
            expect(response.data.userName).toBe(testName);
            expect(response.data.greeting).toBeValidGreeting();
            expect(response.data.greeting).toContain(testName);
            
            ws.close();
        });
        
        test('should handle invalid WebSocket messages', async () => {
            const port = process.env.TEST_PORT;
            const ws = new WebSocket(`ws://localhost:${port}`);
            
            await new Promise(resolve => {
                ws.on('open', resolve);
            });
            
            // Skip welcome message
            await new Promise(resolve => {
                ws.on('message', () => resolve());
            });
            
            // Send invalid message
            ws.send('invalid json');
            
            // Should receive error response
            const errorResponse = await new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'error') {
                        resolve(message);
                    }
                });
                
                setTimeout(() => reject(new Error('No error response')), 3000);
            });
            
            expect(errorResponse.type).toBe('error');
            expect(errorResponse.data.agent).toBe('mike');
            expect(errorResponse.data.message).toContain('processing error');
            
            ws.close();
        });
    });
});