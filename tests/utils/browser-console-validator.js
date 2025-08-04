// David's Browser Console Validation Utilities
// Helper functions for comprehensive browser console testing in E2E scenarios

const { EventEmitter } = require('events');

/**
 * Browser Console Validator
 * Provides comprehensive console validation capabilities for E2E tests
 */
class BrowserConsoleValidator extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;
        this.consoleLogs = [];
        this.consoleErrors = [];
        this.consoleWarnings = [];
        this.cdpSession = null;
        this.isEnabled = false;
        
        this.setupConsoleCapture();
    }

    /**
     * Setup console message capture from multiple sources
     */
    async setupConsoleCapture() {
        // Method 1: Puppeteer page.on('console') - basic capture
        this.page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                args: msg.args(),
                timestamp: new Date().toISOString(),
                url: msg.location()?.url || this.page.url(),
                lineNumber: msg.location()?.lineNumber,
                columnNumber: msg.location()?.columnNumber
            };

            switch (msg.type()) {
                case 'log':
                    this.consoleLogs.push(logEntry);
                    this.emit('consoleLog', logEntry);
                    break;
                case 'error':
                    this.consoleErrors.push(logEntry);
                    this.emit('consoleError', logEntry);
                    break;
                case 'warning':
                    this.consoleWarnings.push(logEntry);
                    this.emit('consoleWarning', logEntry);
                    break;
            }
        });

        // Method 2: Chrome DevTools Protocol - detailed capture
        try {
            this.cdpSession = await this.page.target().createCDPSession();
            await this.cdpSession.send('Runtime.enable');

            this.cdpSession.on('Runtime.consoleAPICalled', event => {
                const logEntry = {
                    type: event.type,
                    args: event.args,
                    timestamp: new Date(event.timestamp).toISOString(),
                    stackTrace: event.stackTrace,
                    executionContextId: event.executionContextId
                };

                this.emit('cdpConsoleAPI', logEntry);
            });

            this.isEnabled = true;
        } catch (error) {
            console.warn('CDP session setup failed:', error.message);
        }
    }

    /**
     * Wait for specific console log message
     */
    async waitForConsoleLog(expectedMessage, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Console log "${expectedMessage}" not found within ${timeout}ms`));
            }, timeout);

            // Check existing logs first
            const existingLog = this.consoleLogs.find(log => 
                log.text.includes(expectedMessage)
            );
            
            if (existingLog) {
                clearTimeout(timeoutId);
                resolve(existingLog);
                return;
            }

            // Listen for new logs
            const onConsoleLog = (logEntry) => {
                if (logEntry.text.includes(expectedMessage)) {
                    clearTimeout(timeoutId);
                    this.off('consoleLog', onConsoleLog);
                    resolve(logEntry);
                }
            };

            this.on('consoleLog', onConsoleLog);
        });
    }

    /**
     * Wait for multiple console messages in sequence
     */
    async waitForConsoleSequence(expectedMessages, timeout = 10000) {
        const results = [];
        const startTime = Date.now();

        for (const message of expectedMessages) {
            const remainingTime = timeout - (Date.now() - startTime);
            if (remainingTime <= 0) {
                throw new Error('Timeout waiting for console sequence');
            }

            const logEntry = await this.waitForConsoleLog(message, remainingTime);
            results.push(logEntry);
        }

        return results;
    }

    /**
     * Validate console log matches expected pattern
     */
    validateConsoleLog(expectedMessage, options = {}) {
        const {
            exact = false,
            caseInsensitive = false,
            timeout = 5000
        } = options;

        const logs = this.getConsoleLogs();
        
        return logs.some(log => {
            let logText = log.text;
            let expectedText = expectedMessage;

            if (caseInsensitive) {
                logText = logText.toLowerCase();
                expectedText = expectedText.toLowerCase();
            }

            if (exact) {
                return logText === expectedText;
            } else {
                return logText.includes(expectedText);
            }
        });
    }

    /**
     * Get all console logs with optional filtering
     */
    getConsoleLogs(filter = null) {
        let logs = [...this.consoleLogs];

        if (filter) {
            if (typeof filter === 'string') {
                logs = logs.filter(log => log.text.includes(filter));
            } else if (typeof filter === 'function') {
                logs = logs.filter(filter);
            }
        }

        return logs;
    }

    /**
     * Get console logs from specific time range
     */
    getConsoleLogsInRange(startTime, endTime = null) {
        const end = endTime || new Date();
        const start = new Date(startTime);

        return this.consoleLogs.filter(log => {
            const logTime = new Date(log.timestamp);
            return logTime >= start && logTime <= end;
        });
    }

    /**
     * Clear all captured console logs
     */
    clearLogs() {
        this.consoleLogs = [];
        this.consoleErrors = [];
        this.consoleWarnings = [];
        this.emit('logsCleared');
    }

    /**
     * Get console statistics
     */
    getConsoleStats() {
        return {
            totalLogs: this.consoleLogs.length,
            totalErrors: this.consoleErrors.length,
            totalWarnings: this.consoleWarnings.length,
            timeRange: {
                first: this.consoleLogs[0]?.timestamp,
                last: this.consoleLogs[this.consoleLogs.length - 1]?.timestamp
            },
            uniqueMessages: [...new Set(this.consoleLogs.map(log => log.text))].length
        };
    }

    /**
     * Validate console execution confirmation overlay
     */
    async validateConsoleExecutionConfirmation(expectedMessage, options = {}) {
        const {
            timeout = 3000,
            fadeOutDelay = 2000
        } = options;

        // Wait for confirmation element to appear
        const confirmationSelector = '#console-execution-confirmation';
        
        try {
            await this.page.waitForSelector(confirmationSelector, { timeout });
            
            // Validate confirmation content
            const confirmationText = await this.page.$eval(confirmationSelector, el => el.textContent);
            
            const validations = {
                present: true,
                containsMessage: confirmationText.includes(expectedMessage),
                containsPrefix: confirmationText.includes('Console executed'),
                text: confirmationText
            };

            // Validate styling
            const confirmationStyle = await this.page.$eval(confirmationSelector, el => {
                const styles = window.getComputedStyle(el);
                return {
                    position: styles.position,
                    zIndex: parseInt(styles.zIndex),
                    opacity: parseFloat(styles.opacity),
                    backgroundColor: styles.backgroundColor
                };
            });

            validations.styling = {
                isFixed: confirmationStyle.position === 'fixed',
                hasHighZIndex: confirmationStyle.zIndex > 10000,
                isVisible: confirmationStyle.opacity > 0,
                hasBackground: confirmationStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
            };

            // Wait for fade out
            if (fadeOutDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, fadeOutDelay + 500));
                
                const confirmationAfterDelay = await this.page.$(confirmationSelector);
                validations.fadeOut = !confirmationAfterDelay;
            }

            return validations;

        } catch (error) {
            return {
                present: false,
                error: error.message,
                containsMessage: false,
                containsPrefix: false
            };
        }
    }

    /**
     * Execute JavaScript in page and capture console output
     */
    async executeAndCapture(jsCode, timeout = 5000) {
        const beforeCount = this.consoleLogs.length;
        
        // Execute JavaScript
        const result = await this.page.evaluate(jsCode);
        
        // Wait for console output
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newLogs = this.consoleLogs.slice(beforeCount);
        
        return {
            executionResult: result,
            consoleLogs: newLogs,
            consoleCount: newLogs.length
        };
    }

    /**
     * Monitor console for specific duration
     */
    async monitorConsole(duration = 5000) {
        const startTime = Date.now();
        const initialCount = this.consoleLogs.length;
        
        const monitoringPromise = new Promise(resolve => {
            setTimeout(() => {
                const endTime = Date.now();
                const finalCount = this.consoleLogs.length;
                const newLogs = this.consoleLogs.slice(initialCount);
                
                resolve({
                    duration: endTime - startTime,
                    newLogsCount: newLogs.length,
                    newLogs: newLogs,
                    stats: this.getConsoleStats()
                });
            }, duration);
        });

        return monitoringPromise;
    }

    /**
     * Create console test report
     */
    generateTestReport() {
        const stats = this.getConsoleStats();
        
        return {
            summary: {
                ...stats,
                isEnabled: this.isEnabled,
                hasCDPSession: !!this.cdpSession
            },
            logs: this.consoleLogs.map(log => ({
                timestamp: log.timestamp,
                type: log.type,
                message: log.text,
                url: log.url
            })),
            errors: this.consoleErrors.map(error => ({
                timestamp: error.timestamp,
                message: error.text,
                url: error.url,
                line: error.lineNumber
            })),
            warnings: this.consoleWarnings.map(warning => ({
                timestamp: warning.timestamp,
                message: warning.text,
                url: warning.url
            }))
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.cdpSession) {
            try {
                await this.cdpSession.detach();
            } catch (error) {
                console.warn('CDP session cleanup error:', error.message);
            }
        }
        
        this.removeAllListeners();
        this.clearLogs();
    }
}

/**
 * Console Assertion Helper
 * Provides Jest-like assertions for console validation
 */
class ConsoleAssertions {
    constructor(validator) {
        this.validator = validator;
    }

    /**
     * Assert console log exists with specific message
     */
    toHaveConsoleLog(expectedMessage, options = {}) {
        const found = this.validator.validateConsoleLog(expectedMessage, options);
        
        if (!found) {
            const availableLogs = this.validator.getConsoleLogs().map(log => log.text);
            throw new Error(
                `Expected console log "${expectedMessage}" not found.\n` +
                `Available logs: ${JSON.stringify(availableLogs, null, 2)}`
            );
        }
        
        return true;
    }

    /**
     * Assert specific number of console logs
     */
    toHaveConsoleLogCount(expectedCount) {
        const actualCount = this.validator.getConsoleLogs().length;
        
        if (actualCount !== expectedCount) {
            throw new Error(
                `Expected ${expectedCount} console logs, but found ${actualCount}`
            );
        }
        
        return true;
    }

    /**
     * Assert console logs match pattern sequence
     */
    toHaveConsoleSequence(expectedSequence) {
        if (expectedSequence.length === 0) return true;
        
        const logs = this.validator.getConsoleLogs();
        
        if (logs.length < expectedSequence.length) {
            throw new Error(
                `Expected sequence of ${expectedSequence.length} logs, but only found ${logs.length}`
            );
        }

        // Check if sequence exists in logs
        for (let i = 0; i <= logs.length - expectedSequence.length; i++) {
            let sequenceMatch = true;
            
            for (let j = 0; j < expectedSequence.length; j++) {
                if (!logs[i + j].text.includes(expectedSequence[j])) {
                    sequenceMatch = false;
                    break;
                }
            }
            
            if (sequenceMatch) {
                return true;
            }
        }
        
        throw new Error(
            `Expected console sequence ${JSON.stringify(expectedSequence)} not found in logs`
        );
    }

    /**
     * Assert no console errors occurred
     */
    toHaveNoConsoleErrors() {
        const errors = this.validator.consoleErrors;
        
        if (errors.length > 0) {
            const errorMessages = errors.map(error => error.text);
            throw new Error(
                `Expected no console errors, but found ${errors.length}:\n` +
                JSON.stringify(errorMessages, null, 2)
            );
        }
        
        return true;
    }
}

module.exports = {
    BrowserConsoleValidator,
    ConsoleAssertions
};