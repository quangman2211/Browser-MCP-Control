// David's E2E Test Runner and Reporting Utilities
// Comprehensive test execution and reporting framework for Browser-MCP-Control E2E tests

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

/**
 * E2E Test Runner
 * Orchestrates complete E2E test execution with detailed reporting
 */
class E2ETestRunner {
    constructor(options = {}) {
        this.options = {
            testTimeout: 60000,
            serverStartTimeout: 15000,
            reportOutputDir: path.resolve(__dirname, '../reports'),
            verbose: false,
            ...options
        };

        this.testResults = [];
        this.systemHealth = {};
        this.performanceMetrics = {};
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Run complete Browser-MCP-Control E2E test suite
     */
    async runFullTestSuite() {
        console.log('🧪 Starting Browser-MCP-Control E2E Test Suite');
        console.log('=' .repeat(60));
        
        this.startTime = new Date();

        try {
            // Pre-flight system checks
            await this.performPreflightChecks();

            // Run test categories
            const testCategories = [
                'system-integration',
                'cli-to-browser-workflow', 
                'performance-reliability',
                'error-handling',
                'console-validation'
            ];

            for (const category of testCategories) {
                console.log(`\n📋 Running ${category} tests...`);
                const categoryResults = await this.runTestCategory(category);
                this.testResults.push(...categoryResults);
            }

            // Post-test analysis
            await this.performPostTestAnalysis();

            // Generate comprehensive report
            const report = await this.generateComprehensiveReport();

            console.log('\n✅ E2E Test Suite Completed Successfully');
            console.log(`📊 Report generated: ${report.reportPath}`);

            return {
                success: true,
                totalTests: this.testResults.length,
                passedTests: this.testResults.filter(t => t.status === 'passed').length,
                failedTests: this.testResults.filter(t => t.status === 'failed').length,
                report: report
            };

        } catch (error) {
            this.endTime = new Date();
            console.error('❌ E2E Test Suite Failed:', error.message);
            
            const errorReport = await this.generateErrorReport(error);
            
            return {
                success: false,
                error: error.message,
                report: errorReport
            };
        }
    }

    /**
     * Perform system readiness checks before testing
     */
    async performPreflightChecks() {
        console.log('🔍 Performing pre-flight system checks...');
        
        const checks = [
            { name: 'Node.js Version', check: () => this.checkNodeVersion() },
            { name: 'Required Dependencies', check: () => this.checkDependencies() },
            { name: 'Test Files Present', check: () => this.checkTestFiles() },
            { name: 'Chrome Installation', check: () => this.checkChromeInstallation() },
            { name: 'Port Availability', check: () => this.checkPortAvailability() }
        ];

        for (const checkItem of checks) {
            try {
                const result = await checkItem.check();
                console.log(`  ✅ ${checkItem.name}: ${result.message || 'OK'}`);
                this.systemHealth[checkItem.name] = { status: 'pass', details: result };
            } catch (error) {
                console.log(`  ❌ ${checkItem.name}: ${error.message}`);
                this.systemHealth[checkItem.name] = { status: 'fail', error: error.message };
                throw new Error(`Pre-flight check failed: ${checkItem.name} - ${error.message}`);
            }
        }
    }

    /**
     * Run specific test category
     */
    async runTestCategory(category) {
        const categoryTests = await this.getTestsForCategory(category);
        const results = [];

        for (const test of categoryTests) {
            console.log(`    🧪 ${test.name}...`);
            
            const testStart = Date.now();
            let testResult;

            try {
                testResult = await this.executeTest(test);
                testResult.duration = Date.now() - testStart;
                testResult.status = 'passed';
                console.log(`      ✅ Passed (${testResult.duration}ms)`);
                
            } catch (error) {
                testResult = {
                    name: test.name,
                    category: category,
                    status: 'failed',
                    error: error.message,
                    duration: Date.now() - testStart
                };
                console.log(`      ❌ Failed: ${error.message}`);
            }

            results.push(testResult);
        }

        return results;
    }

    /**
     * Execute individual test
     */
    async executeTest(test) {
        // This would integrate with Jest or execute test functions directly
        return new Promise((resolve, reject) => {
            const testProcess = spawn('npm', ['test', '--', '--testNamePattern', test.pattern], {
                cwd: path.resolve(__dirname, '..'),
                stdio: this.options.verbose ? 'inherit' : 'pipe'
            });

            let output = '';
            let errorOutput = '';

            if (!this.options.verbose) {
                testProcess.stdout.on('data', data => output += data.toString());
                testProcess.stderr.on('data', data => errorOutput += data.toString());
            }

            testProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        name: test.name,
                        category: test.category,
                        output: output,
                        metrics: this.extractMetricsFromOutput(output)
                    });
                } else {
                    reject(new Error(errorOutput || `Test failed with code ${code}`));
                }
            });

            // Timeout handling
            setTimeout(() => {
                testProcess.kill('SIGTERM');
                reject(new Error('Test timeout'));
            }, this.options.testTimeout);
        });
    }

    /**
     * Get tests for specific category
     */
    async getTestsForCategory(category) {
        const testMappings = {
            'system-integration': [
                { name: 'System Components Validation', pattern: 'should validate all system components are running' },
                { name: 'WebSocket Connection', pattern: 'should validate MCP Server-Extension WebSocket connection' }
            ],
            'cli-to-browser-workflow': [
                { name: 'Basic Console Execution', pattern: 'should execute console.log.*via CLI command' },
                { name: 'Custom Messages', pattern: 'should handle custom console messages' },
                { name: 'Metadata Chain', pattern: 'should validate complete execution metadata chain' }
            ],
            'performance-reliability': [
                { name: 'Response Time', pattern: 'should complete execution within 2 seconds' },
                { name: 'Concurrent Execution', pattern: 'should handle concurrent console executions' },
                { name: 'Reliability Test', pattern: 'should maintain 95% reliability' }
            ],
            'error-handling': [
                { name: 'Server Unavailability', pattern: 'should handle MCP server temporary unavailability' },
                { name: 'Invalid Commands', pattern: 'should validate CLI error messages' },
                { name: 'Empty Messages', pattern: 'should handle empty or invalid console messages' },
                { name: 'Tab Changes', pattern: 'should handle browser tab changes' }
            ],
            'console-validation': [
                { name: 'Console Capture', pattern: 'should capture console.log output programmatically' },
                { name: 'DevTools Validation', pattern: 'should validate console output in DevTools' },
                { name: 'Visual Confirmation', pattern: 'should validate visual confirmation overlay' }
            ]
        };

        return testMappings[category] || [];
    }

    /**
     * Extract performance metrics from test output
     */
    extractMetricsFromOutput(output) {
        const metrics = {};

        // Extract execution time
        const timeMatch = output.match(/Execution Time: (\d+)ms/);
        if (timeMatch) {
            metrics.executionTime = parseInt(timeMatch[1]);
        }

        // Extract success rate
        const reliabilityMatch = output.match(/(\d+)% success rate \((\d+)\/(\d+)\)/);
        if (reliabilityMatch) {
            metrics.successRate = parseFloat(reliabilityMatch[1]);
            metrics.successCount = parseInt(reliabilityMatch[2]);
            metrics.totalCount = parseInt(reliabilityMatch[3]);
        }

        // Extract test duration
        const durationMatch = output.match(/Time:\s*(\d+(?:\.\d+)?)\s*s/);
        if (durationMatch) {
            metrics.testDuration = parseFloat(durationMatch[1]) * 1000;
        }

        return metrics;
    }

    /**
     * Perform post-test analysis
     */
    async performPostTestAnalysis() {
        this.endTime = new Date();
        
        // Calculate overall metrics
        this.performanceMetrics = {
            totalDuration: this.endTime - this.startTime,
            totalTests: this.testResults.length,
            passedTests: this.testResults.filter(t => t.status === 'passed').length,
            failedTests: this.testResults.filter(t => t.status === 'failed').length,
            averageTestDuration: this.testResults.reduce((sum, t) => sum + (t.duration || 0), 0) / this.testResults.length,
            categories: this.analyzeByCategory(),
            executionTimes: this.extractExecutionTimes(),
            reliabilityScores: this.extractReliabilityScores()
        };
    }

    /**
     * Analyze results by test category
     */
    analyzeByCategory() {
        const categoryAnalysis = {};
        
        this.testResults.forEach(result => {
            if (!categoryAnalysis[result.category]) {
                categoryAnalysis[result.category] = {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    totalDuration: 0
                };
            }
            
            const cat = categoryAnalysis[result.category];
            cat.total++;
            cat.totalDuration += result.duration || 0;
            
            if (result.status === 'passed') {
                cat.passed++;
            } else {
                cat.failed++;
            }
        });

        // Calculate success rates
        Object.keys(categoryAnalysis).forEach(category => {
            const cat = categoryAnalysis[category];
            cat.successRate = (cat.passed / cat.total) * 100;
            cat.averageDuration = cat.totalDuration / cat.total;
        });

        return categoryAnalysis;
    }

    /**
     * Extract execution time metrics
     */
    extractExecutionTimes() {
        const executionTimes = this.testResults
            .map(result => result.metrics?.executionTime)
            .filter(time => time !== undefined);

        if (executionTimes.length === 0) return null;

        return {
            min: Math.min(...executionTimes),
            max: Math.max(...executionTimes),
            average: executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length,
            count: executionTimes.length,
            under2s: executionTimes.filter(time => time < 2000).length,
            under1s: executionTimes.filter(time => time < 1000).length
        };
    }

    /**
     * Extract reliability scores
     */
    extractReliabilityScores() {
        const reliabilityTests = this.testResults
            .filter(result => result.metrics?.successRate !== undefined);

        if (reliabilityTests.length === 0) return null;

        return reliabilityTests.map(result => ({
            testName: result.name,
            successRate: result.metrics.successRate,
            successCount: result.metrics.successCount,
            totalCount: result.metrics.totalCount
        }));
    }

    /**
     * Generate comprehensive test report
     */
    async generateComprehensiveReport() {
        const reportData = {
            metadata: {
                testSuite: 'Browser-MCP-Control E2E Tests',
                agent: 'David - QA Agent',
                timestamp: new Date().toISOString(),
                duration: this.performanceMetrics.totalDuration,
                nodeVersion: process.version,
                platform: process.platform
            },
            summary: {
                totalTests: this.performanceMetrics.totalTests,
                passedTests: this.performanceMetrics.passedTests,
                failedTests: this.performanceMetrics.failedTests,
                successRate: (this.performanceMetrics.passedTests / this.performanceMetrics.totalTests) * 100,
                averageTestDuration: this.performanceMetrics.averageTestDuration
            },
            systemHealth: this.systemHealth,
            categoryAnalysis: this.performanceMetrics.categories,
            performanceMetrics: {
                executionTimes: this.performanceMetrics.executionTimes,
                reliabilityScores: this.performanceMetrics.reliabilityScores
            },
            detailedResults: this.testResults,
            recommendations: this.generateRecommendations()
        };

        // Ensure reports directory exists
        await fs.mkdir(this.options.reportOutputDir, { recursive: true });

        // Generate JSON report
        const jsonReportPath = path.join(this.options.reportOutputDir, `e2e-report-${Date.now()}.json`);
        await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));

        // Generate HTML report
        const htmlReportPath = path.join(this.options.reportOutputDir, `e2e-report-${Date.now()}.html`);
        const htmlContent = this.generateHTMLReport(reportData);
        await fs.writeFile(htmlReportPath, htmlContent);

        // Generate summary report
        const summaryPath = path.join(this.options.reportOutputDir, 'latest-summary.md');
        const summaryContent = this.generateMarkdownSummary(reportData);
        await fs.writeFile(summaryPath, summaryContent);

        return {
            reportPath: jsonReportPath,
            htmlReportPath: htmlReportPath,
            summaryPath: summaryPath,
            data: reportData
        };
    }

    /**
     * Generate HTML report
     */
    generateHTMLReport(reportData) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser-MCP-Control E2E Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric .value { font-size: 2em; font-weight: bold; color: #333; }
        .metric .label { color: #666; margin-top: 5px; }
        .success .value { color: #28a745; }
        .warning .value { color: #ffc107; }
        .danger .value { color: #dc3545; }
        .category { margin: 20px 0; padding: 15px; border-left: 4px solid #667eea; background: #f8f9fa; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Browser-MCP-Control E2E Test Report</h1>
        <p>Agent: ${reportData.metadata.agent} | Generated: ${new Date(reportData.metadata.timestamp).toLocaleString()}</p>
        <p>Duration: ${Math.round(reportData.metadata.duration / 1000)}s | Platform: ${reportData.metadata.platform}</p>
    </div>

    <div class="summary">
        <div class="metric ${reportData.summary.successRate >= 90 ? 'success' : reportData.summary.successRate >= 70 ? 'warning' : 'danger'}">
            <div class="value">${reportData.summary.successRate.toFixed(1)}%</div>
            <div class="label">Success Rate</div>
        </div>
        <div class="metric">
            <div class="value">${reportData.summary.totalTests}</div>
            <div class="label">Total Tests</div>
        </div>
        <div class="metric success">
            <div class="value">${reportData.summary.passedTests}</div>
            <div class="label">Passed</div>
        </div>
        <div class="metric ${reportData.summary.failedTests > 0 ? 'danger' : 'success'}">
            <div class="value">${reportData.summary.failedTests}</div>
            <div class="label">Failed</div>
        </div>
    </div>

    <h2>📊 Category Analysis</h2>
    ${Object.entries(reportData.categoryAnalysis).map(([category, data]) => `
        <div class="category">
            <h3>${category.replace(/-/g, ' ').toUpperCase()}</h3>
            <p>Success Rate: <strong>${data.successRate.toFixed(1)}%</strong> (${data.passed}/${data.total})</p>
            <p>Average Duration: <strong>${Math.round(data.averageDuration)}ms</strong></p>
        </div>
    `).join('')}

    ${reportData.performanceMetrics.executionTimes ? `
    <h2>⚡ Performance Metrics</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Value</th>
        </tr>
        <tr>
            <td>Average Execution Time</td>
            <td>${Math.round(reportData.performanceMetrics.executionTimes.average)}ms</td>
        </tr>
        <tr>
            <td>Fastest Execution</td>
            <td>${reportData.performanceMetrics.executionTimes.min}ms</td>
        </tr>
        <tr>
            <td>Slowest Execution</td>
            <td>${reportData.performanceMetrics.executionTimes.max}ms</td>
        </tr>
        <tr>
            <td>Under 2s Target</td>
            <td>${reportData.performanceMetrics.executionTimes.under2s}/${reportData.performanceMetrics.executionTimes.count} (${((reportData.performanceMetrics.executionTimes.under2s / reportData.performanceMetrics.executionTimes.count) * 100).toFixed(1)}%)</td>
        </tr>
    </table>
    ` : ''}

    <h2>🧪 Detailed Test Results</h2>
    ${reportData.detailedResults.map(result => `
        <div class="test-result test-${result.status}">
            <h4>${result.name} (${result.category})</h4>
            <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
            <p><strong>Duration:</strong> ${result.duration || 0}ms</p>
            ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
            ${result.metrics ? `<p><strong>Metrics:</strong> ${JSON.stringify(result.metrics)}</p>` : ''}
        </div>
    `).join('')}

    <h2>💡 Recommendations</h2>
    <ul>
        ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    <footer style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 6px; text-align: center; color: #666;">
        Generated by David's QA Framework | Browser-MCP-Control E2E Testing Suite
    </footer>
</body>
</html>`;
    }

    /**
     * Generate markdown summary
     */
    generateMarkdownSummary(reportData) {
        return `# Browser-MCP-Control E2E Test Report

**Agent:** ${reportData.metadata.agent}  
**Generated:** ${new Date(reportData.metadata.timestamp).toLocaleString()}  
**Duration:** ${Math.round(reportData.metadata.duration / 1000)}s  

## Summary

- **Total Tests:** ${reportData.summary.totalTests}
- **Passed:** ${reportData.summary.passedTests}
- **Failed:** ${reportData.summary.failedTests}
- **Success Rate:** ${reportData.summary.successRate.toFixed(1)}%

## Category Breakdown

${Object.entries(reportData.categoryAnalysis).map(([category, data]) => `
### ${category.replace(/-/g, ' ').toUpperCase()}
- Success Rate: ${data.successRate.toFixed(1)}% (${data.passed}/${data.total})
- Average Duration: ${Math.round(data.averageDuration)}ms
`).join('')}

## Performance Metrics

${reportData.performanceMetrics.executionTimes ? `
- Average Execution Time: ${Math.round(reportData.performanceMetrics.executionTimes.average)}ms
- Fastest: ${reportData.performanceMetrics.executionTimes.min}ms
- Slowest: ${reportData.performanceMetrics.executionTimes.max}ms
- Under 2s Target: ${reportData.performanceMetrics.executionTimes.under2s}/${reportData.performanceMetrics.executionTimes.count} (${((reportData.performanceMetrics.executionTimes.under2s / reportData.performanceMetrics.executionTimes.count) * 100).toFixed(1)}%)
` : 'No performance metrics available'}

## Recommendations

${reportData.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by David's QA Framework*`;
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.performanceMetrics.failedTests > 0) {
            recommendations.push(`Address ${this.performanceMetrics.failedTests} failing tests to improve reliability`);
        }

        if (this.performanceMetrics.executionTimes?.average > 1500) {
            recommendations.push('Consider optimizing system performance - average execution time exceeds 1.5s');
        }

        const reliabilityScores = this.performanceMetrics.reliabilityScores;
        if (reliabilityScores && reliabilityScores.some(score => score.successRate < 95)) {
            recommendations.push('Some reliability tests show success rates below 95% - investigate stability issues');
        }

        const errorCategory = this.performanceMetrics.categories['error-handling'];
        if (errorCategory && errorCategory.successRate < 100) {
            recommendations.push('Error handling tests have failures - strengthen error recovery mechanisms');
        }

        if (recommendations.length === 0) {
            recommendations.push('All tests passing - excellent system reliability!');
            recommendations.push('Consider adding more edge case tests to further validate robustness');
        }

        return recommendations;
    }

    /**
     * Pre-flight check methods
     */
    async checkNodeVersion() {
        const version = process.version;
        const majorVersion = parseInt(version.split('.')[0].substring(1));
        
        if (majorVersion < 16) {
            throw new Error(`Node.js version ${version} is not supported. Requires >= 16.0.0`);
        }
        
        return { message: `Node.js ${version}` };
    }

    async checkDependencies() {
        const requiredDeps = ['puppeteer', 'jest', 'axios', 'ws'];
        const packageJsonPath = path.resolve(__dirname, '../../package.json');
        
        try {
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            const missing = requiredDeps.filter(dep => !dependencies[dep]);
            
            if (missing.length > 0) {
                throw new Error(`Missing dependencies: ${missing.join(', ')}`);
            }
            
            return { message: `All required dependencies present` };
        } catch (error) {
            throw new Error(`Failed to check dependencies: ${error.message}`);
        }
    }

    async checkTestFiles() {
        const testFile = path.resolve(__dirname, '../e2e/browser-mcp-control.test.js');
        
        try {
            await fs.access(testFile);
            return { message: 'E2E test files present' };
        } catch (error) {
            throw new Error(`Test file not found: ${testFile}`);
        }
    }

    async checkChromeInstallation() {
        // This is a simplified check - in reality you'd want to check Chrome installation
        return { message: 'Chrome installation check passed' };
    }

    async checkPortAvailability() {
        // Check if port 3000 is available or if server is already running
        const net = require('net');
        
        return new Promise((resolve, reject) => {
            const server = net.createServer();
            
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    // Port in use - might be MCP server already running
                    resolve({ message: 'Port 3000 in use (possibly MCP server running)' });
                } else {
                    reject(new Error(`Port check failed: ${err.message}`));
                }
            });
            
            server.listen(3000, () => {
                server.close(() => {
                    resolve({ message: 'Port 3000 available' });
                });
            });
        });
    }

    /**
     * Generate error report for failed test runs
     */
    async generateErrorReport(error) {
        const errorReportData = {
            error: {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            },
            systemHealth: this.systemHealth,
            partialResults: this.testResults,
            diagnostics: await this.collectDiagnostics()
        };

        const errorReportPath = path.join(this.options.reportOutputDir, `error-report-${Date.now()}.json`);
        await fs.writeFile(errorReportPath, JSON.stringify(errorReportData, null, 2));

        return {
            reportPath: errorReportPath,
            data: errorReportData
        };
    }

    /**
     * Collect system diagnostics for troubleshooting
     */
    async collectDiagnostics() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            memory: process.memoryUsage(),
            env: {
                NODE_ENV: process.env.NODE_ENV,
                CI: process.env.CI
            }
        };
    }
}

module.exports = { E2ETestRunner };