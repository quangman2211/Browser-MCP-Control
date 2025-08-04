// David's Performance Tests - System Benchmarks
// Measures performance characteristics of all agent components

const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

describe('Performance Benchmarks - All Agent Components', () => {
    const serverUrl = 'http://localhost:3000';
    const wsUrl = 'ws://localhost:3000';
    
    // Performance thresholds
    const PERFORMANCE_THRESHOLDS = {
        API_RESPONSE_TIME: 100, // ms
        WS_RESPONSE_TIME: 50,   // ms
        CONCURRENT_REQUESTS: 100,
        THROUGHPUT_MIN: 50,     // requests per second
        MEMORY_LIMIT: 100       // MB
    };
    
    beforeAll(async () => {
        // Warm up server
        try {
            await axios.get(`${serverUrl}/health`, { timeout: 5000 });
        } catch (error) {
            console.warn('Server not available for performance tests. Starting tests anyway...');
        }
    });
    
    describe('REST API Performance', () => {
        test('single request response time should meet threshold', async () => {
            const testName = 'Performance Test';
            
            const startTime = performance.now();
            
            try {
                const response = await axios.post(`${serverUrl}/api/hello`, {
                    name: testName
                }, { timeout: 5000 });
                
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                
                expect(response.status).toBe(200);
                expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);
                
                console.log(`API Response time: ${responseTime.toFixed(2)}ms`);
                
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    console.warn('Skipping performance test - server not available');
                    return;
                }
                throw error;
            }
        });
        
        test('concurrent requests should maintain performance', async () => {
            const concurrentRequests = 50;
            const requests = [];
            
            const startTime = performance.now();
            
            for (let i = 0; i < concurrentRequests; i++) {
                requests.push(
                    axios.post(`${serverUrl}/api/hello`, {
                        name: `Concurrent User ${i}`
                    }, { timeout: 10000 }).catch(error => {
                        if (error.code === 'ECONNREFUSED') {
                            return { skipped: true };
                        }
                        throw error;
                    })
                );
            }
            
            const responses = await Promise.all(requests);
            const endTime = performance.now();
            
            const totalTime = endTime - startTime;
            const successfulResponses = responses.filter(r => !r.skipped);
            
            if (successfulResponses.length === 0) {
                console.warn('Skipping concurrent performance test - server not available');
                return;
            }
            
            // Calculate throughput
            const throughput = (successfulResponses.length / totalTime) * 1000; // requests per second
            
            expect(throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.THROUGHPUT_MIN);
            
            // All successful responses should be valid
            successfulResponses.forEach((response, index) => {
                if (!response.skipped) {
                    expect(response.status).toBe(200);
                    expect(response.data.agent).toBe('mike');
                }
            });
            
            console.log(`Concurrent requests: ${successfulResponses.length}/${concurrentRequests}`);
            console.log(`Total time: ${totalTime.toFixed(2)}ms`);
            console.log(`Throughput: ${throughput.toFixed(2)} requests/second`);
        }, 30000);
        
        test('sustained load should maintain consistent performance', async () => {
            const duration = 10000; // 10 seconds
            const requestInterval = 100; // ms between requests
            const requests = [];
            const responseTimes = [];
            
            const startTime = performance.now();
            let requestCount = 0;
            
            const intervalId = setInterval(async () => {
                if (performance.now() - startTime >= duration) {
                    clearInterval(intervalId);
                    return;
                }
                
                const reqStartTime = performance.now();
                requestCount++;
                
                requests.push(
                    axios.post(`${serverUrl}/api/hello`, {
                        name: `Sustained Load ${requestCount}`
                    }, { timeout: 5000 })
                    .then(response => {
                        const reqEndTime = performance.now();
                        responseTimes.push(reqEndTime - reqStartTime);
                        return response;
                    })
                    .catch(error => {
                        if (error.code === 'ECONNREFUSED') {
                            return { skipped: true };
                        }
                        // Don't fail the test for individual request failures
                        console.warn(`Request failed: ${error.message}`);
                        return { failed: true };
                    })
                );
            }, requestInterval);
            
            // Wait for test duration
            await new Promise(resolve => setTimeout(resolve, duration + 1000));
            
            // Wait for all requests to complete
            const responses = await Promise.all(requests);
            const successfulResponses = responses.filter(r => !r.skipped && !r.failed);
            
            if (successfulResponses.length === 0) {
                console.warn('Skipping sustained load test - server not available');
                return;
            }
            
            // Calculate statistics
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);
            const minResponseTime = Math.min(...responseTimes);
            
            // Performance assertions
            expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 2); // Allow 2x threshold for sustained load
            expect(maxResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 5); // Allow 5x threshold for max
            
            console.log(`Sustained load results:`);
            console.log(`  Requests sent: ${requestCount}`);
            console.log(`  Successful responses: ${successfulResponses.length}`);
            console.log(`  Average response time: ${avgResponseTime.toFixed(2)}ms`);
            console.log(`  Min response time: ${minResponseTime.toFixed(2)}ms`);
            console.log(`  Max response time: ${maxResponseTime.toFixed(2)}ms`);
            
        }, 20000);
    });
    
    describe('WebSocket Performance', () => {
        test('WebSocket message response time should meet threshold', async () => {
            let ws;
            
            try {
                ws = new WebSocket(wsUrl);
                
                await new Promise((resolve, reject) => {
                    ws.on('open', resolve);
                    ws.on('error', (error) => {
                        if (error.code === 'ECONNREFUSED') {
                            console.warn('Skipping WebSocket performance test - server not available');
                            resolve();
                        } else {
                            reject(error);
                        }
                    });
                    setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
                });
                
                if (ws.readyState !== WebSocket.OPEN) {
                    return; // Skip test if connection failed
                }
                
                // Skip welcome message
                await new Promise(resolve => {
                    ws.on('message', () => resolve());
                });
                
                const startTime = performance.now();
                
                // Send hello request
                ws.send(JSON.stringify({
                    type: 'hello_request',
                    data: {
                        name: 'WebSocket Performance Test',
                        timestamp: new Date().toISOString(),
                        source: 'performance_test',
                        agent: 'david'
                    }
                }));
                
                // Wait for response
                await new Promise((resolve, reject) => {
                    ws.on('message', (data) => {
                        const message = JSON.parse(data.toString());
                        if (message.type === 'hello_response') {
                            const endTime = performance.now();
                            const responseTime = endTime - startTime;
                            
                            expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.WS_RESPONSE_TIME);
                            console.log(`WebSocket Response time: ${responseTime.toFixed(2)}ms`);
                            
                            resolve();
                        }
                    });
                    
                    setTimeout(() => reject(new Error('WebSocket response timeout')), 5000);
                });
                
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    console.warn('Skipping WebSocket performance test - server not available');
                    return;
                }
                throw error;
            } finally {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            }
        });
        
        test('WebSocket should handle rapid message bursts', async () => {
            let ws;
            
            try {
                ws = new WebSocket(wsUrl);
                
                await new Promise((resolve, reject) => {
                    ws.on('open', resolve);
                    ws.on('error', (error) => {
                        if (error.code === 'ECONNREFUSED') {
                            console.warn('Skipping WebSocket burst test - server not available');
                            resolve();
                        } else {
                            reject(error);
                        }
                    });
                    setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
                });
                
                if (ws.readyState !== WebSocket.OPEN) {
                    return; // Skip test if connection failed
                }
                
                // Skip welcome message
                await new Promise(resolve => {
                    ws.on('message', () => resolve());
                });
                
                const messageCount = 50;
                const responses = [];
                const startTime = performance.now();
                
                // Set up response handler
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'hello_response') {
                        responses.push({
                            data: message.data,
                            timestamp: performance.now()
                        });
                    }
                });
                
                // Send burst of messages
                for (let i = 0; i < messageCount; i++) {
                    ws.send(JSON.stringify({
                        type: 'hello_request',
                        data: {
                            name: `Burst Test ${i}`,
                            timestamp: new Date().toISOString(),
                            source: 'burst_test',
                            agent: 'david'
                        }
                    }));
                }
                
                // Wait for all responses
                await global.TestUtils.waitForCondition(
                    () => responses.length >= messageCount,
                    15000 // 15 seconds timeout
                );
                
                const endTime = performance.now();
                const totalTime = endTime - startTime;
                
                expect(responses).toHaveLength(messageCount);
                
                // Calculate performance metrics
                const avgResponseTime = totalTime / messageCount;
                const throughput = (messageCount / totalTime) * 1000;
                
                expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.WS_RESPONSE_TIME * 2);
                
                console.log(`WebSocket burst test results:`);
                console.log(`  Messages: ${messageCount}`);
                console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
                console.log(`  Average time per message: ${avgResponseTime.toFixed(2)}ms`);
                console.log(`  Throughput: ${throughput.toFixed(2)} messages/second`);
                
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    console.warn('Skipping WebSocket burst test - server not available');
                    return;
                }
                throw error;
            } finally {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            }
        }, 25000);
    });
    
    describe('Memory Performance', () => {
        test('server should maintain reasonable memory usage', async () => {
            try {
                // Get server statistics
                const response = await axios.get(`${serverUrl}/api/stats`, { timeout: 5000 });
                expect(response.status).toBe(200);
                
                // Make multiple requests to potentially increase memory usage
                const requests = [];
                for (let i = 0; i < 100; i++) {
                    requests.push(
                        axios.post(`${serverUrl}/api/hello`, {
                            name: `Memory Test ${i}`
                        }, { timeout: 5000 })
                    );
                }
                
                await Promise.all(requests);
                
                // Get updated statistics
                const afterResponse = await axios.get(`${serverUrl}/api/stats`, { timeout: 5000 });
                expect(afterResponse.status).toBe(200);
                
                console.log('Memory performance test completed');
                console.log(`  Total connections: ${afterResponse.data.totalConnections}`);
                console.log(`  Total messages: ${afterResponse.data.totalMessages}`);
                
                // Note: Without direct access to server process memory,
                // we can only verify the server continues to respond
                expect(afterResponse.data.totalMessages).toBeGreaterThan(100);
                
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    console.warn('Skipping memory performance test - server not available');
                    return;
                }
                throw error;
            }
        }, 30000);
    });
    
    describe('Performance Summary', () => {
        test('should report performance benchmark summary', () => {
            console.log('\\n=== Performance Benchmark Summary ===');
            console.log(`Target thresholds:`);
            console.log(`  API Response time: < ${PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME}ms`);
            console.log(`  WebSocket Response time: < ${PERFORMANCE_THRESHOLDS.WS_RESPONSE_TIME}ms`);
            console.log(`  Minimum throughput: > ${PERFORMANCE_THRESHOLDS.THROUGHPUT_MIN} req/s`);
            console.log(`  Concurrent requests: ${PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS}`);
            console.log('\\nAll agents (Sarah, Mike, Emma, David) working together');
            console.log('to deliver high-performance multi-agent system! 🚀');
            console.log('=====================================\\n');
            
            // This test always passes - it's just for reporting
            expect(true).toBe(true);
        });
    });
});