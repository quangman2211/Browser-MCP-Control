// David's E2E Tests - Chrome Extension (Sarah's Component)
// Tests Sarah's extension using Puppeteer

const puppeteer = require('puppeteer');
const path = require('path');

describe('Chrome Extension E2E Tests - Sarah\\'s Component', () => {
    let browser;
    let extensionPage;
    let extensionId;
    
    beforeAll(async () => {
        // Launch browser with extension loaded
        const extensionPath = global.TEST_CONFIG.EXTENSION_PATH;
        
        browser = await puppeteer.launch({
            headless: false, // Extensions require non-headless mode
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            defaultViewport: null
        });
        
        // Wait for extension to load
        await global.TestUtils.delay(2000);
        
        // Find extension ID
        const targets = await browser.targets();
        const extensionTarget = targets.find(target => 
            target.type() === 'background_page' || target.type() === 'service_worker'
        );
        
        if (extensionTarget) {
            const url = extensionTarget.url();
            extensionId = url.split('/')[2];
        }
        
        expect(extensionId).toBeTruthy();
    });
    
    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });
    
    beforeEach(async () => {
        // Open extension popup for each test
        if (extensionId) {
            extensionPage = await browser.newPage();
            await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
            
            // Wait for popup to load
            await extensionPage.waitForSelector('body[data-popup-loaded=\"true\"]', { timeout: 10000 });
        }
    });
    
    afterEach(async () => {
        if (extensionPage) {
            await extensionPage.close();
        }
    });
    
    describe('Extension Loading', () => {
        test('should load extension successfully', () => {
            expect(extensionId).toBeTruthy();
            expect(extensionId).toHaveLength(32); // Chrome extension IDs are 32 characters
        });
        
        test('should open popup successfully', async () => {
            expect(extensionPage.url()).toContain(`chrome-extension://${extensionId}/popup.html`);
            
            // Check if popup is loaded
            const isLoaded = await extensionPage.$eval('body', el => 
                el.getAttribute('data-popup-loaded') === 'true'
            );
            expect(isLoaded).toBe(true);
        });
    });
    
    describe('UI Components', () => {
        test('should display correct title', async () => {
            const title = await extensionPage.$eval('#title', el => el.textContent);
            expect(title).toBe('🎯 Hello World');
        });
        
        test('should have all required form elements', async () => {
            const elements = await Promise.all([
                extensionPage.$('#nameInput'),
                extensionPage.$('#greetBtn'),
                extensionPage.$('#connectBtn'),
                extensionPage.$('#connectionStatus'),
                extensionPage.$('#responseArea'),
                extensionPage.$('#messageCount'),
                extensionPage.$('#responseTime')
            ]);
            
            elements.forEach(element => {
                expect(element).toBeTruthy();
            });
        });
        
        test('should display welcome message initially', async () => {
            const welcomeMessage = await extensionPage.$('.welcome-message');
            expect(welcomeMessage).toBeTruthy();
            
            const welcomeText = await extensionPage.$eval('.welcome-message h3', el => el.textContent);
            expect(welcomeText).toContain('Welcome');
        });
        
        test('should show agent signatures', async () => {
            const signature = await extensionPage.$eval('.agent-signature', el => el.textContent);
            expect(signature).toContain('Sarah 💻');
            expect(signature).toContain('David 🧪');
        });
    });
    
    describe('User Interactions', () => {
        test('should handle name input', async () => {
            const testName = 'Test User';
            
            await extensionPage.type('#nameInput', testName);
            
            const inputValue = await extensionPage.$eval('#nameInput', el => el.value);
            expect(inputValue).toBe(testName);
        });
        
        test('should validate empty name input', async () => {
            // Try to send greeting without name
            await extensionPage.click('#greetBtn');
            
            // Should show error message
            await global.TestUtils.delay(500);
            
            const outputText = await extensionPage.$eval('#responseArea', el => el.textContent);
            expect(outputText).toContain('Please enter your name first');
        });
        
        test('should handle Enter key in name input', async () => {
            await extensionPage.type('#nameInput', 'Enter Test');
            await extensionPage.keyboard.press('Enter');
            
            // Should trigger same action as clicking button
            await global.TestUtils.delay(500);
            
            // Check if some action was triggered (would normally require server)
            const outputText = await extensionPage.$eval('#responseArea', el => el.textContent);
            expect(outputText).toContain('Not connected to server'); // Expected without server
        });
    });
    
    describe('Connection Status', () => {
        test('should show disconnected status initially', async () => {
            const statusText = await extensionPage.$eval('#connectionStatus', el => el.textContent);
            expect(statusText).toBe('Disconnected');
            
            const statusClass = await extensionPage.$eval('#connectionStatus', el => el.className);
            expect(statusClass).toContain('status-disconnected');
        });
        
        test('should handle connection attempt', async () => {
            // Click connect button
            await extensionPage.click('#connectBtn');
            
            // Wait for connection attempt
            await global.TestUtils.delay(1000);
            
            // Should show connecting or failed state
            const statusText = await extensionPage.$eval('#connectionStatus', el => el.textContent);
            expect(statusText).toMatch(/Connecting|Disconnected/);
        });
    });
    
    describe('Statistics Display', () => {
        test('should show initial message count', async () => {
            const messageCount = await extensionPage.$eval('#messageCount', el => el.textContent);
            expect(messageCount).toBe('0');
        });
        
        test('should show initial response time', async () => {
            const responseTime = await extensionPage.$eval('#responseTime', el => el.textContent);
            expect(responseTime).toBe('-');
        });
    });
    
    describe('Loading States', () => {
        test('should have loading overlay hidden initially', async () => {
            const overlay = await extensionPage.$('#loadingOverlay');
            const isHidden = await extensionPage.evaluate(el => 
                el.classList.contains('hidden'), overlay
            );
            expect(isHidden).toBe(true);
        });
        
        test('should show loading overlay during connection', async () => {
            // Start connection
            await extensionPage.click('#connectBtn');
            
            // Check if loading overlay appears
            const overlay = await extensionPage.$('#loadingOverlay');
            const isVisible = await extensionPage.evaluate(el => 
                !el.classList.contains('hidden'), overlay
            );
            
            expect(isVisible).toBe(true);
        });
    });
    
    describe('Error Handling', () => {
        test('should handle server connection failure gracefully', async () => {
            // Try to connect (should fail without server)
            await extensionPage.click('#connectBtn');
            
            // Wait for connection attempt to complete
            await global.TestUtils.delay(3000);
            
            // Should show error message
            const outputText = await extensionPage.$eval('#responseArea', el => el.textContent);
            expect(outputText).toContain('Failed to connect');
        });
        
        test('should handle greeting without connection', async () => {
            await extensionPage.type('#nameInput', 'Test User');
            await extensionPage.click('#greetBtn');
            
            await global.TestUtils.delay(500);
            
            const outputText = await extensionPage.$eval('#responseArea', el => el.textContent);
            expect(outputText).toContain('Not connected to server');
        });
    });
    
    describe('Responsive Design', () => {
        test('should handle window resize', async () => {
            // Test different viewport sizes
            await extensionPage.setViewport({ width: 300, height: 400 });
            await global.TestUtils.delay(500);
            
            // Elements should still be visible và functional
            const nameInput = await extensionPage.$('#nameInput');
            const greetBtn = await extensionPage.$('#greetBtn');
            
            expect(nameInput).toBeTruthy();
            expect(greetBtn).toBeTruthy();
            
            // Should be able to interact with elements
            await extensionPage.type('#nameInput', 'Resize Test');
            const inputValue = await extensionPage.$eval('#nameInput', el => el.value);
            expect(inputValue).toBe('Resize Test');
        });
    });
    
    describe('Console Execution (MCP Integration)', () => {
        let testPage;
        
        beforeEach(async () => {
            // Create a test page to execute console commands on
            testPage = await browser.newPage();
            await testPage.goto('data:text/html,<html><head><title>Test Page</title></head><body><h1>Console Test Page</h1></body></html>');
        });
        
        afterEach(async () => {
            if (testPage) {
                await testPage.close();
            }
        });
        
        test('should handle console_hello message via content script', async () => {
            // Set up console log capture on the test page
            const consoleLogs = [];
            testPage.on('console', msg => {
                if (msg.type() === 'log') {
                    consoleLogs.push(msg.text());
                }
            });
            
            // Inject and execute console_hello via content script message
            const result = await testPage.evaluate(() => {
                return new Promise((resolve) => {
                    // Simulate the message that would come from background script
                    const message = {
                        type: 'execute_console_hello',
                        data: {
                            message: 'Hello World from MCP Test',
                            timestamp: Date.now()
                        }
                    };
                    
                    // Find the content script instance
                    if (window.helloWorldContent) {
                        window.helloWorldContent.handleMessage(message, null, resolve);
                    } else {
                        resolve({ success: false, error: 'Content script not found' });
                    }
                });
            });
            
            // Verify console.log was executed
            expect(consoleLogs).toContain('Hello World from MCP Test');
            
            // Verify response structure
            expect(result.success).toBe(true);
            expect(result.message).toBe('Hello World from MCP Test');
            expect(result.page_url).toContain('data:text/html');
            expect(result.console_method).toBe('console.log');
        });
        
        test('should show visual confirmation of console execution', async () => {
            // Execute console command and check for visual confirmation
            await testPage.evaluate(() => {
                if (window.helloWorldContent) {
                    window.helloWorldContent.showConsoleExecutionConfirmation('Test Message');
                }
            });
            
            // Wait for confirmation to appear
            await global.TestUtils.delay(100);
            
            // Check if confirmation element exists
            const confirmation = await testPage.$('#console-execution-confirmation');
            expect(confirmation).toBeTruthy();
            
            // Check confirmation content
            const confirmationText = await testPage.$eval('#console-execution-confirmation', el => el.textContent);
            expect(confirmationText).toContain('Console executed: "Test Message"');
            
            // Wait for confirmation to disappear
            await global.TestUtils.delay(2500);
            
            const confirmationAfterDelay = await testPage.$('#console-execution-confirmation');
            expect(confirmationAfterDelay).toBeFalsy();
        });
        
        test('should handle console execution errors gracefully', async () => {
            // Test error handling by passing invalid data
            const result = await testPage.evaluate(() => {
                return new Promise((resolve) => {
                    // Simulate error by passing null data
                    const message = {
                        type: 'execute_console_hello',
                        data: null
                    };
                    
                    if (window.helloWorldContent) {
                        window.helloWorldContent.handleMessage(message, null, resolve);
                    } else {
                        resolve({ success: false, error: 'Content script not found' });
                    }
                });
            });
            
            // Should handle error gracefully
            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
            expect(result.page_url).toBeTruthy();
        });
    });
    
    describe('Accessibility', () => {
        test('should have proper labels for form elements', async () => {
            const nameLabel = await extensionPage.$('label[for=\"nameInput\"]');
            expect(nameLabel).toBeTruthy();
            
            const labelText = await extensionPage.$eval('label[for=\"nameInput\"]', el => el.textContent);
            expect(labelText).toContain('Enter your name');
        });
        
        test('should support keyboard navigation', async () => {
            // Tab through elements
            await extensionPage.keyboard.press('Tab'); // Should focus name input
            const focusedElement1 = await extensionPage.evaluate(() => document.activeElement.id);
            expect(focusedElement1).toBe('nameInput');
            
            await extensionPage.keyboard.press('Tab'); // Should focus greet button
            const focusedElement2 = await extensionPage.evaluate(() => document.activeElement.id);
            expect(focusedElement2).toBe('greetBtn');
        });
    });
});