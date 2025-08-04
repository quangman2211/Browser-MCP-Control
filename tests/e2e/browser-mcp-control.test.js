// David's E2E Tests - Complete Browser-MCP-Control Workflow
// Tests the full CLI → MCP Server → Chrome Extension → Browser Console workflow
// Validates console.log("Hello World") execution from CLI to Browser

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const axios = require('axios');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

describe('Browser-MCP-Control E2E Tests - Complete Workflow', () => {
    let browser;
    let testPage;
    let extensionId;
    let mcpServer;
    let serverProcess;
    let consoleLogs = [];
    
    // Test configuration
    const TEST_CONFIG = {
        SERVER_URL: 'http://localhost:3000',
        WS_URL: 'ws://localhost:3000',
        CLI_PATH: path.resolve(__dirname, '../../src/cli'),
        SERVER_PATH: path.resolve(__dirname, '../../src/server'),
        EXTENSION_PATH: path.resolve(__dirname, '../../src/extension'),
        TEST_TIMEOUT: 30000,
        SERVER_START_TIMEOUT: 10000,
        EXTENSION_LOAD_TIMEOUT: 5000
    };

    beforeAll(async () => {
        console.log('🧪 Starting Browser-MCP-Control E2E Test Suite...');
        
        // Step 1: Start MCP Server
        await startMCPServer();
        
        // Step 2: Launch browser with extension
        await launchBrowserWithExtension();
        
        // Step 3: Wait for all components to be ready
        await waitForSystemReady();
        
        console.log('✅ All components ready for E2E testing');
    }, TEST_CONFIG.TEST_TIMEOUT);

    afterAll(async () => {
        console.log('🧹 Cleaning up E2E test environment...');
        
        if (browser) {
            await browser.close();
        }
        
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            
            // Wait for graceful shutdown
            await new Promise(resolve => {
                serverProcess.on('exit', resolve);
                setTimeout(resolve, 3000); // Force cleanup after 3s
            });
        }
        
        console.log('✅ E2E test cleanup completed');
    });

    beforeEach(async () => {
        // Reset console logs for each test
        consoleLogs = [];
        
        // Create fresh test page
        testPage = await browser.newPage();
        
        // Set up console log capture
        testPage.on('console', msg => {
            if (msg.type() === 'log') {
                consoleLogs.push({
                    text: msg.text(),
                    timestamp: new Date().toISOString(),
                    type: msg.type()
                });
            }
        });
        
        // Navigate to test page
        await testPage.goto('data:text/html,<html><head><title>MCP Console Test</title></head><body><h1>Browser Console Test Page</h1><div id="test-content">Ready for console testing</div></body></html>');
        
        // Wait for page load and content script injection
        await global.TestUtils.delay(1000);
    });

    afterEach(async () => {
        if (testPage) {
            await testPage.close();
        }
    });

    describe('System Integration Validation', () => {
        test('should validate all system components are running', async () => {
            // Test MCP Server health
            const serverHealth = await axios.get(`${TEST_CONFIG.SERVER_URL}/health`);
            expect(serverHealth.status).toBe(200);
            expect(serverHealth.data.status).toBe('healthy');
            expect(serverHealth.data.agent).toBe('mike');

            // Test MCP Tools endpoint
            const toolsResponse = await axios.get(`${TEST_CONFIG.SERVER_URL}/api/tools`);
            expect(toolsResponse.status).toBe(200);
            expect(toolsResponse.data.tools).toBeDefined();
            
            // Verify console_hello tool exists
            const consoleHelloTool = toolsResponse.data.tools.find(
                tool => tool.name === 'mcp:tool.console_hello'
            );
            expect(consoleHelloTool).toBeDefined();
            expect(consoleHelloTool.description).toContain('console.log');

            // Test Chrome Extension is loaded
            expect(extensionId).toBeTruthy();
            expect(extensionId).toHaveLength(32);

            // Test browser page is ready
            expect(testPage).toBeTruthy();
            const pageTitle = await testPage.title();
            expect(pageTitle).toBe('MCP Console Test');
        });

        test('should validate MCP Server-Extension WebSocket connection', async () => {
            // Create WebSocket connection to verify extension connectivity
            const ws = new WebSocket(TEST_CONFIG.WS_URL);
            
            const connectionPromise = new Promise((resolve, reject) => {
                ws.on('open', () => resolve(true));
                ws.on('error', reject);
                setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            });

            const isConnected = await connectionPromise;
            expect(isConnected).toBe(true);
            
            ws.close();
        });
    });

    describe('Complete CLI-to-Browser Workflow', () => {
        test('should execute console.log("Hello World") via CLI command', async () => {
            const testMessage = 'Hello World from CLI E2E Test';
            
            // Execute CLI command
            const cliResult = await executeCLICommand('mcp-browser', 'console-hello', testMessage);
            
            // Validate CLI execution success
            expect(cliResult.success).toBe(true);
            expect(cliResult.output).toContain('Console.log executed successfully in browser');
            expect(cliResult.output).toContain(testMessage);

            // Wait for console execution to complete
            await global.TestUtils.delay(2000);

            // Validate console.log appeared in browser
            expect(consoleLogs).toHaveLength(1);
            expect(consoleLogs[0].text).toBe(testMessage);
            expect(consoleLogs[0].type).toBe('log');
            
            // Validate visual confirmation appeared on page
            const confirmation = await testPage.$('#console-execution-confirmation');
            if (confirmation) {
                const confirmationText = await testPage.$eval('#console-execution-confirmation', el => el.textContent);
                expect(confirmationText).toContain('Console executed');
                expect(confirmationText).toContain(testMessage);
            }
        });

        test('should handle custom console messages via CLI', async () => {
            const customMessages = [
                'Custom Message 1 - E2E Test',
                'Another test message with special chars: !@#$%',
                'Multi-word message with spaces and numbers: 12345'
            ];

            for (const message of customMessages) {
                // Reset console logs
                consoleLogs = [];
                
                // Execute CLI command
                const cliResult = await executeCLICommand('mcp-browser', 'console-hello', message);
                
                // Validate CLI success
                expect(cliResult.success).toBe(true);
                expect(cliResult.output).toContain('Console.log executed successfully');

                // Wait for execution
                await global.TestUtils.delay(1500);

                // Validate console output
                expect(consoleLogs).toHaveLength(1);
                expect(consoleLogs[0].text).toBe(message);
            }
        });

        test('should validate complete execution metadata chain', async () => {
            const testMessage = 'Metadata Validation Test';
            
            // Execute CLI command and capture detailed output
            const cliResult = await executeCLICommand('mcp-browser', 'console-hello', testMessage, ['--verbose']);
            
            expect(cliResult.success).toBe(true);
            
            // Validate execution chain metadata
            expect(cliResult.output).toContain('MCP Browser Execution Result');
            expect(cliResult.output).toContain('Tool: mcp:tool.console_hello');
            expect(cliResult.output).toContain('Execution Time:');
            
            // Wait for browser execution
            await global.TestUtils.delay(2000);

            // Validate browser console received the message
            expect(consoleLogs[0].text).toBe(testMessage);

            // Validate page metadata
            const pageUrl = await testPage.url();
            const pageTitle = await testPage.title();
            
            expect(pageUrl).toContain('data:text/html');
            expect(pageTitle).toBe('MCP Console Test');
        });
    });

    describe('Performance and Reliability Testing', () => {
        test('should complete execution within 2 seconds', async () => {
            const testMessage = 'Performance Test Message';
            const startTime = Date.now();
            
            const cliResult = await executeCLICommand('mcp-browser', 'console-hello', testMessage);
            
            const executionTime = Date.now() - startTime;
            
            expect(cliResult.success).toBe(true);
            expect(executionTime).toBeLessThan(2000);
            
            // Validate performance metadata in CLI output
            expect(cliResult.output).toMatch(/Execution Time: \d+ms/);
            
            // Extract execution time from output
            const executionTimeMatch = cliResult.output.match(/Execution Time: (\d+)ms/);
            if (executionTimeMatch) {
                const reportedTime = parseInt(executionTimeMatch[1]);
                expect(reportedTime).toBeLessThan(2000);
            }
        });

        test('should handle concurrent console executions', async () => {
            const messages = [
                'Concurrent Test 1',
                'Concurrent Test 2', 
                'Concurrent Test 3'
            ];

            // Execute multiple commands concurrently
            const promises = messages.map(message => 
                executeCLICommand('mcp-browser', 'console-hello', message)
            );

            const results = await Promise.all(promises);

            // Validate all executions succeeded
            results.forEach((result, index) => {
                expect(result.success).toBe(true);
                expect(result.output).toContain(messages[index]);
            });

            // Wait for all console executions
            await global.TestUtils.delay(3000);

            // Should have received all messages (order may vary)
            expect(consoleLogs.length).toBe(3);
            const receivedMessages = consoleLogs.map(log => log.text);
            
            messages.forEach(message => {
                expect(receivedMessages).toContain(message);
            });
        });

        test('should maintain 95% reliability over multiple executions', async () => {
            const testCount = 10;
            const testMessage = 'Reliability Test';
            const results = [];

            // Execute multiple tests
            for (let i = 0; i < testCount; i++) {
                try {
                    consoleLogs = []; // Reset for each test
                    
                    const cliResult = await executeCLICommand('mcp-browser', 'console-hello', `${testMessage} ${i + 1}`);
                    
                    await global.TestUtils.delay(1000);
                    
                    const success = cliResult.success && consoleLogs.length === 1;
                    results.push(success);
                    
                } catch (error) {
                    results.push(false);
                }
            }

            // Calculate success rate
            const successCount = results.filter(Boolean).length;
            const successRate = (successCount / testCount) * 100;

            expect(successRate).toBeGreaterThanOrEqual(95);
            console.log(`Reliability test: ${successRate}% success rate (${successCount}/${testCount})`);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle MCP server temporary unavailability', async () => {
            // Temporarily stop server
            if (serverProcess) {
                serverProcess.kill('SIGTERM');
                await global.TestUtils.delay(2000);
            }

            // Try to execute command
            const cliResult = await executeCLICommand('mcp-browser', 'console-hello', 'Error Test');

            // Should fail gracefully
            expect(cliResult.success).toBe(false);
            expect(cliResult.output).toContain('Cannot connect to MCP Server');

            // Restart server for remaining tests
            await startMCPServer();
            await global.TestUtils.delay(3000);
        });

        test('should validate CLI error messages for invalid commands', async () => {
            // Test invalid tool name
            const invalidResult = await executeCLICommand('mcp-browser', 'invalid-tool', 'test');
            
            expect(invalidResult.success).toBe(false);
            expect(invalidResult.output).toContain('Error');
        });

        test('should handle empty or invalid console messages', async () => {
            // Test empty message (should use default)
            const emptyResult = await executeCLICommand('mcp-browser', 'console-hello', '');
            
            // Should still succeed with default message
            expect(emptyResult.success).toBe(true);
            
            await global.TestUtils.delay(1500);
            
            // Should have logged default message
            expect(consoleLogs).toHaveLength(1);
            expect(consoleLogs[0].text).toBeTruthy();
        });

        test('should handle browser tab changes during execution', async () => {
            // Create additional tab
            const newTab = await browser.newPage();
            await newTab.goto('https://example.com');
            
            // Execute console command (should still work on original active tab)
            const testMessage = 'Tab Change Test';
            const cliResult = await executeCLICommand('mcp-browser', 'console-hello', testMessage);
            
            expect(cliResult.success).toBe(true);
            
            await global.TestUtils.delay(2000);
            
            // Should have executed on test page (not the new tab)
            expect(consoleLogs).toHaveLength(1);
            expect(consoleLogs[0].text).toBe(testMessage);
            
            await newTab.close();
        });
    });

    describe('Browser Console Validation', () => {
        test('should capture console.log output programmatically', async () => {
            const testMessage = 'Console Capture Test';
            
            // Execute via CLI
            await executeCLICommand('mcp-browser', 'console-hello', testMessage);
            await global.TestUtils.delay(1500);

            // Validate console capture
            expect(consoleLogs).toHaveLength(1);
            expect(consoleLogs[0]).toMatchObject({
                text: testMessage,
                type: 'log',
                timestamp: expect.any(String)
            });

            // Validate timestamp is recent
            const logTime = new Date(consoleLogs[0].timestamp);
            const timeDiff = Date.now() - logTime.getTime();
            expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
        });

        test('should validate console output in DevTools Console', async () => {
            const testMessage = 'DevTools Validation Test';
            
            // Enable runtime domain for console API
            const client = await testPage.target().createCDPSession();
            await client.send('Runtime.enable');
            
            const consoleMessages = [];
            client.on('Runtime.consoleAPICalled', event => {
                if (event.type === 'log') {
                    consoleMessages.push(event.args[0].value);
                }
            });

            // Execute console command
            await executeCLICommand('mcp-browser', 'console-hello', testMessage);
            await global.TestUtils.delay(2000);

            // Validate message appeared in both captures
            expect(consoleLogs[0].text).toBe(testMessage);
            expect(consoleMessages).toContain(testMessage);
            
            await client.detach();
        });

        test('should validate visual confirmation overlay', async () => {
            const testMessage = 'Visual Confirmation Test';
            
            // Execute console command
            await executeCLICommand('mcp-browser', 'console-hello', testMessage);
            
            // Wait for execution and visual confirmation
            await global.TestUtils.delay(1000);

            // Check for confirmation element
            const confirmation = await testPage.$('#console-execution-confirmation');
            expect(confirmation).toBeTruthy();

            // Validate confirmation content
            const confirmationText = await testPage.$eval('#console-execution-confirmation', el => el.textContent);
            expect(confirmationText).toContain('Console executed');
            expect(confirmationText).toContain(testMessage);

            // Validate confirmation styling
            const confirmationStyle = await testPage.$eval('#console-execution-confirmation', el => {
                const styles = window.getComputedStyle(el);
                return {
                    position: styles.position,
                    zIndex: styles.zIndex,
                    backgroundColor: styles.backgroundColor
                };
            });

            expect(confirmationStyle.position).toBe('fixed');
            expect(parseInt(confirmationStyle.zIndex)).toBeGreaterThan(10000);

            // Wait for confirmation to fade out
            await global.TestUtils.delay(2500);
            
            const confirmationAfterDelay = await testPage.$('#console-execution-confirmation');
            expect(confirmationAfterDelay).toBeFalsy();
        });
    });

    // Helper Functions

    async function startMCPServer() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Starting MCP Server...');
            
            const serverPath = path.join(TEST_CONFIG.SERVER_PATH, 'server.js');
            
            serverProcess = spawn('node', [serverPath], {
                cwd: TEST_CONFIG.SERVER_PATH,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let serverOutput = '';
            
            serverProcess.stdout.on('data', (data) => {
                serverOutput += data.toString();
                if (serverOutput.includes('Ready for Sarah\'s extension')) {
                    resolve();
                }
            });

            serverProcess.stderr.on('data', (data) => {
                console.error('Server Error:', data.toString());
            });

            serverProcess.on('error', reject);

            // Timeout fallback
            setTimeout(() => {
                if (serverProcess && !serverProcess.killed) {
                    resolve(); // Assume success if no error after timeout
                }
            }, TEST_CONFIG.SERVER_START_TIMEOUT);
        });
    }

    async function launchBrowserWithExtension() {
        console.log('🌐 Launching browser with Chrome Extension...');
        
        browser = await puppeteer.launch({
            headless: false, // Extensions require non-headless mode
            args: [
                `--disable-extensions-except=${TEST_CONFIG.EXTENSION_PATH}`,
                `--load-extension=${TEST_CONFIG.EXTENSION_PATH}`,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ],
            defaultViewport: null
        });

        // Wait for extension to load
        await global.TestUtils.delay(TEST_CONFIG.EXTENSION_LOAD_TIMEOUT);

        // Find extension ID
        const targets = await browser.targets();
        const extensionTarget = targets.find(target => 
            target.type() === 'background_page' || target.type() === 'service_worker'
        );

        if (extensionTarget) {
            const url = extensionTarget.url();
            extensionId = url.split('/')[2];
        }

        if (!extensionId) {
            throw new Error('Chrome Extension failed to load');
        }

        console.log(`✅ Chrome Extension loaded with ID: ${extensionId}`);
    }

    async function waitForSystemReady() {
        console.log('⏳ Waiting for all system components to be ready...');
        
        // Wait for MCP Server to be responsive
        await global.TestUtils.retryOperation(async () => {
            const response = await axios.get(`${TEST_CONFIG.SERVER_URL}/health`);
            if (response.status !== 200) {
                throw new Error('Server not ready');
            }
        }, 5, 2000);

        // Wait for MCP Tools to be registered
        await global.TestUtils.retryOperation(async () => {
            const response = await axios.get(`${TEST_CONFIG.SERVER_URL}/api/tools`);
            const consoleHelloTool = response.data.tools.find(
                tool => tool.name === 'mcp:tool.console_hello'
            );
            if (!consoleHelloTool) {
                throw new Error('Console hello tool not registered');
            }
        }, 5, 1000);

        // Additional stabilization delay
        await global.TestUtils.delay(2000);
    }

    async function executeCLICommand(command, subcommand, message, additionalArgs = []) {
        return new Promise((resolve) => {
            const cliPath = path.join(TEST_CONFIG.CLI_PATH, 'index.js');
            const args = [cliPath, command, subcommand];
            
            if (message) {
                args.push(message);
            }
            
            args.push(...additionalArgs);

            const cliProcess = spawn('node', args, {
                cwd: TEST_CONFIG.CLI_PATH,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let errorOutput = '';

            cliProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            cliProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            cliProcess.on('close', (code) => {
                resolve({
                    success: code === 0,
                    output: output,
                    error: errorOutput,
                    exitCode: code
                });
            });

            // Timeout fallback
            setTimeout(() => {
                cliProcess.kill('SIGTERM');
                resolve({
                    success: false,
                    output: output,
                    error: 'CLI command timeout',
                    exitCode: -1
                });
            }, 15000);
        });
    }
});