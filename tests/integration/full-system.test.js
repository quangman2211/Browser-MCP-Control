// David's Integration Tests - Full System Integration
// Tests all components working together: Sarah's Extension, Mike's Server, Emma's CLI

const { spawn } = require('child_process');
const request = require('supertest');
const WebSocket = require('ws');
const axios = require('axios');
const path = require('path');

describe('Full System Integration Tests - All Agents', () => {
    let serverProcess;
    let serverUrl = 'http://localhost:3001'; // Use different port for integration tests
    let wsUrl = 'ws://localhost:3001';
    
    beforeAll(async () => {
        // Start the MCP server for integration testing
        const serverPath = path.join(global.TEST_CONFIG.SERVER_PATH, 'server.js');
        
        serverProcess = spawn('node', [serverPath], {
            env: { ...process.env, PORT: '3001' },
            stdio: 'pipe' // Capture output
        });
        
        // Wait for server to start
        await global.TestUtils.delay(3000);
        
        // Verify server is running
        await global.TestUtils.retryOperation(async () => {
            const response = await axios.get(`${serverUrl}/health`, { timeout: 2000 });
            if (response.data.status !== 'healthy') {
                throw new Error('Server not healthy');
            }
        }, 10, 1000);
        
    }, 30000);
    
    afterAll(async () => {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            
            // Wait for graceful shutdown
            await new Promise(resolve => {
                serverProcess.on('exit', resolve);
                setTimeout(resolve, 5000); // Force exit after 5s
            });
        }
    });
    
    describe('Server Health và Availability', () => {
        test('server should be healthy và responsive', async () => {
            const response = await axios.get(`${serverUrl}/health`);
            
            expect(response.status).toBe(200);
            expect(response.data.status).toBe('healthy');
            expect(response.data.agent).toBe('mike');
        });
        
        test('server should accept WebSocket connections', async () => {
            const ws = new WebSocket(wsUrl);
            
            await new Promise((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);
                setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            });
            
            // Should receive welcome message
            const welcomeMessage = await new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    resolve(JSON.parse(data.toString()));
                });
                setTimeout(() => reject(new Error('No welcome message')), 3000);
            });
            
            expect(welcomeMessage.type).toBe('server_info');
            expect(welcomeMessage.data.agent).toBe('mike');
            
            ws.close();
        });
    });
    
    describe('REST API Integration', () => {
        test('should handle hello requests via REST API', async () => {
            const testName = 'Integration Test User';
            
            const response = await axios.post(`${serverUrl}/api/hello`, {
                name: testName
            });
            
            expect(response.status).toBe(200);
            expect(response.data.greeting).toBeValidGreeting();
            expect(response.data.userName).toBe(testName);
            expect(response.data.agent).toBe('mike');
            expect(response.data.source).toBe('rest_api');
            expect(response.data.responseId).toBeTruthy();
        });
        
        test('should provide server statistics', async () => {
            const response = await axios.get(`${serverUrl}/api/stats`);
            
            expect(response.status).toBe(200);
            expect(response.data.agent).toBe('mike');
            expect(response.data.totalConnections).toBeGreaterThanOrEqual(0);
            expect(response.data.activeConnections).toBeGreaterThanOrEqual(0);
            expect(response.data.totalMessages).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(response.data.recentMessages)).toBe(true);
        });
    });
    
    describe('WebSocket Integration', () => {
        let ws;
        
        beforeEach(async () => {
            ws = new WebSocket(wsUrl);
            await new Promise(resolve => ws.on('open', resolve));
            
            // Skip welcome message
            await new Promise(resolve => {
                ws.on('message', () => resolve());
            });
        });
        
        afterEach(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
        
        test('should handle hello requests via WebSocket', async () => {
            const testName = 'WebSocket Integration Test';
            const startTime = new Date().toISOString();
            
            // Send hello request
            ws.send(JSON.stringify({
                type: 'hello_request',
                data: {
                    name: testName,
                    timestamp: startTime,
                    source: 'integration_test',
                    agent: 'david'
                }
            }));
            
            // Wait for response
            const response = await new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'hello_response') {
                        resolve(message.data);
                    }
                });
                
                setTimeout(() => reject(new Error('No response received')), 5000);
            });
            
            expect(response.greeting).toBeValidGreeting();
            expect(response.userName).toBe(testName);
            expect(response.agent).toBe('mike');
            expect(response.clientId).toBeTruthy();
            expect(response.responseId).toBeTruthy();
            expect(response.server_time).toHaveValidTimestamp();
            expect(response.server_time).toBeWithinTimeRange(startTime, 5000);
        });
        
        test('should handle multiple concurrent WebSocket connections', async () => {
            const connections = [];
            const responses = [];
            
            // Create multiple connections
            for (let i = 0; i < 3; i++) {
                const testWs = new WebSocket(wsUrl);
                connections.push(testWs);
                
                await new Promise(resolve => testWs.on('open', resolve));
                
                // Skip welcome message
                await new Promise(resolve => {
                    testWs.on('message', () => resolve());
                });
            }
            
            // Send messages from all connections
            const promises = connections.map((testWs, index) => {
                return new Promise((resolve, reject) => {
                    testWs.on('message', (data) => {
                        const message = JSON.parse(data.toString());
                        if (message.type === 'hello_response') {
                            resolve(message.data);
                        }
                    });
                    
                    testWs.send(JSON.stringify({
                        type: 'hello_request',
                        data: {
                            name: `Concurrent User ${index + 1}`,
                            timestamp: new Date().toISOString(),
                            source: 'concurrent_test',
                            agent: 'david'
                        }
                    }));
                    
                    setTimeout(() => reject(new Error(`No response from connection ${index}`)), 5000);
                });
            });
            
            const allResponses = await Promise.all(promises);
            
            // Verify all responses
            expect(allResponses).toHaveLength(3);
            allResponses.forEach((response, index) => {
                expect(response.greeting).toBeValidGreeting();
                expect(response.userName).toBe(`Concurrent User ${index + 1}`);
                expect(response.agent).toBe('mike');
            });
            
            // Clean up connections
            connections.forEach(testWs => testWs.close());
        });
    });
    
    describe('CLI Integration', () => {
        const cliPath = path.join(global.TEST_CONFIG.CLI_PATH, 'bin', 'hello-cli.js');
        
        test('CLI should connect to server via REST', async () => {
            const cliProcess = spawn('node', [cliPath, 'greet', 'CLI Test', '--rest'], {
                env: { ...process.env },
                stdio: 'pipe'
            });
            
            const output = await new Promise((resolve, reject) => {
                let stdout = '';
                let stderr = '';
                
                cliProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                cliProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                cliProcess.on('close', (code) => {
                    if (code === 0) {
                        resolve(stdout);
                    } else {
                        reject(new Error(`CLI failed with code ${code}: ${stderr}`));
                    }
                });
                
                setTimeout(() => {
                    cliProcess.kill();
                    reject(new Error('CLI process timeout'));
                }, 10000);
            });
            
            expect(output).toContain('Server Response (REST API)');
            expect(output).toContain('CLI Test');
            expect(output).toContain('Agent: mike');
        }, 15000);
        
        test('CLI should show server status', async () => {
            const cliProcess = spawn('node', [cliPath, 'status'], {
                env: { ...process.env },
                stdio: 'pipe'
            });
            
            const output = await new Promise((resolve, reject) => {
                let stdout = '';
                let stderr = '';
                
                cliProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                cliProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                cliProcess.on('close', (code) => {
                    if (code === 0) {
                        resolve(stdout);
                    } else {
                        reject(new Error(`CLI status failed with code ${code}: ${stderr}`));
                    }
                });
                
                setTimeout(() => {
                    cliProcess.kill();
                    reject(new Error('CLI status timeout'));
                }, 10000);
            });
            
            expect(output).toContain('Server Health');
            expect(output).toContain('Status: healthy');
            expect(output).toContain('Agent: mike');
            expect(output).toContain('Server Statistics');
        }, 15000);
    });
    
    describe('Performance Integration', () => {
        test('should handle rapid sequential requests', async () => {
            const requestCount = 10;
            const requests = [];
            
            for (let i = 0; i < requestCount; i++) {
                requests.push(
                    axios.post(`${serverUrl}/api/hello`, {
                        name: `Performance Test ${i}`
                    })
                );
            }
            
            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const endTime = Date.now();
            
            // All requests should succeed
            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.data.userName).toBe(`Performance Test ${index}`);
                expect(response.data.agent).toBe('mike');
            });
            
            // Should complete within reasonable time (less than 5 seconds)
            const totalTime = endTime - startTime;
            expect(totalTime).toBeLessThan(5000);
            
            // Average response time should be reasonable (less than 100ms per request)
            const avgResponseTime = totalTime / requestCount;
            expect(avgResponseTime).toBeLessThan(100);
        });
        
        test('should maintain WebSocket connection under load', async () => {
            const ws = new WebSocket(wsUrl);
            await new Promise(resolve => ws.on('open', resolve));
            
            // Skip welcome message
            await new Promise(resolve => {
                ws.on('message', () => resolve());
            });
            
            const messageCount = 20;
            const responses = [];
            
            // Set up response handler
            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'hello_response') {
                    responses.push(message.data);
                }
            });
            
            // Send multiple messages rapidly
            const startTime = Date.now();
            for (let i = 0; i < messageCount; i++) {
                ws.send(JSON.stringify({
                    type: 'hello_request',
                    data: {
                        name: `Load Test ${i}`,
                        timestamp: new Date().toISOString(),
                        source: 'load_test',
                        agent: 'david'
                    }
                }));
                
                // Small delay to avoid overwhelming
                await global.TestUtils.delay(10);
            }
            
            // Wait for all responses
            await global.TestUtils.waitForCondition(
                () => responses.length >= messageCount,
                10000 // 10 seconds timeout
            );
            
            const endTime = Date.now();
            
            expect(responses).toHaveLength(messageCount);
            
            // Verify all responses are valid
            responses.forEach((response, index) => {
                expect(response.greeting).toBeValidGreeting();
                expect(response.userName).toBe(`Load Test ${index}`);
                expect(response.agent).toBe('mike');
            });
            
            // Performance should be reasonable
            const totalTime = endTime - startTime;
            expect(totalTime).toBeLessThan(10000); // Less than 10 seconds
            
            ws.close();
        });
    });
    
    describe('Error Handling Integration', () => {
        test('should handle server restart gracefully', async () => {
            // Kill server process
            serverProcess.kill('SIGTERM');
            
            // Wait for shutdown
            await global.TestUtils.delay(2000);
            
            // Try to make request (should fail)
            try {
                await axios.get(`${serverUrl}/health`, { timeout: 1000 });
                fail('Request should have failed');
            } catch (error) {
                expect(error.code).toBe('ECONNREFUSED');
            }
            
            // Restart server
            const serverPath = path.join(global.TEST_CONFIG.SERVER_PATH, 'server.js');
            serverProcess = spawn('node', [serverPath], {
                env: { ...process.env, PORT: '3001' },
                stdio: 'pipe'
            });
            
            // Wait for restart
            await global.TestUtils.delay(3000);
            
            // Verify server is back online
            const response = await axios.get(`${serverUrl}/health`);
            expect(response.status).toBe(200);
            expect(response.data.status).toBe('healthy');
        }, 20000);
    });
});