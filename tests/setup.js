// David's Test Setup - Hello World Multi-Agent Demo
// Global test configuration và utilities

const path = require('path');

// Global test configuration
global.TEST_CONFIG = {
    SERVER_URL: 'http://localhost:3000',
    WS_URL: 'ws://localhost:3000',
    EXTENSION_PATH: path.resolve(__dirname, '../src/extension'),
    CLI_PATH: path.resolve(__dirname, '../src/cli'),
    SERVER_PATH: path.resolve(__dirname, '../src/server'),
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3
};

// Global test utilities
global.TestUtils = {
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    generateTestName: () => `TestUser_${Date.now()}`,
    
    waitForCondition: async (conditionFn, timeout = 5000, interval = 100) => {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await conditionFn()) {
                return true;
            }
            await global.TestUtils.delay(interval);
        }
        
        throw new Error(`Condition not met within ${timeout}ms`);
    },
    
    retryOperation: async (operation, maxRetries = 3, delay = 1000) => {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await global.TestUtils.delay(delay);
                }
            }
        }
        
        throw lastError;
    }
};

// Jest custom matchers
expect.extend({
    toBeValidGreeting(received) {
        const pass = typeof received === 'string' && 
                    received.length > 0 && 
                    (received.includes('Hello') || received.includes('Hi') || received.includes('Greetings'));
        
        if (pass) {
            return {
                message: () => `Expected ${received} not to be a valid greeting`,
                pass: true
            };
        } else {
            return {
                message: () => `Expected ${received} to be a valid greeting`,
                pass: false
            };
        }
    },
    
    toHaveValidTimestamp(received) {
        const pass = typeof received === 'string' && !isNaN(Date.parse(received));
        
        if (pass) {
            return {
                message: () => `Expected ${received} not to be a valid timestamp`,
                pass: true
            };
        } else {
            return {
                message: () => `Expected ${received} to be a valid timestamp`,
                pass: false
            };
        }
    },
    
    toBeWithinTimeRange(received, expected, toleranceMs = 1000) {
        const receivedTime = new Date(received).getTime();
        const expectedTime = new Date(expected).getTime();
        const diff = Math.abs(receivedTime - expectedTime);
        const pass = diff <= toleranceMs;
        
        if (pass) {
            return {
                message: () => `Expected ${received} not to be within ${toleranceMs}ms of ${expected}`,
                pass: true
            };
        } else {
            return {
                message: () => `Expected ${received} to be within ${toleranceMs}ms of ${expected}, but was ${diff}ms away`,
                pass: false
            };
        }
    }
});

// Global test hooks
beforeAll(async () => {
    console.log('🧪 Test Suite Started - David\'s QA Framework');
    console.log('Multi-Agent Hello World Testing Environment');
});

afterAll(async () => {
    console.log('✅ Test Suite Completed - All agents validated!');
});

// Console logging control for tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS) {
    console.log = () => {};
    console.warn = () => {};
    // Keep error logging for debugging
}

// Restore console logging after tests
afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});