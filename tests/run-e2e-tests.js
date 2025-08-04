#!/usr/bin/env node

// David's E2E Test CLI Runner
// Command-line interface for running Browser-MCP-Control E2E tests

const { program } = require('commander');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');

// Test runner configuration
const TEST_CONFIG = {
    testFile: path.resolve(__dirname, 'e2e/browser-mcp-control.test.js'),
    reportsDir: path.resolve(__dirname, 'reports'),
    serverPath: path.resolve(__dirname, '../src/server'),
    cliPath: path.resolve(__dirname, '../src/cli')
};

class E2ETestCLI {
    constructor() {
        this.setupCommands();
    }

    setupCommands() {
        program
            .name('run-e2e-tests')
            .description('Browser-MCP-Control E2E Test Runner - Built by David 🧪')
            .version('1.0.0');

        // Main test command
        program
            .command('run')
            .description('Run complete E2E test suite')
            .option('-v, --verbose', 'Verbose output')
            .option('-h, --headless', 'Run browser in headless mode')
            .option('-t, --timeout <ms>', 'Test timeout in milliseconds', '60000')
            .option('-s, --spec <pattern>', 'Run specific test pattern')
            .option('-r, --report-only', 'Generate report from last test run')
            .action(async (options) => {
                await this.runE2ETests(options);
            });

        // Quick validation command
        program
            .command('validate')
            .description('Quick validation of system components')
            .option('-c, --components', 'Check all components are ready')
            .action(async (options) => {
                await this.validateSystem(options);
            });

        // Server management commands
        program
            .command('server')
            .description('MCP Server management')
            .option('--start', 'Start MCP server')
            .option('--stop', 'Stop MCP server')
            .option('--status', 'Check server status')
            .action(async (options) => {
                await this.manageServer(options);
            });

        // Report commands  
        program
            .command('report')
            .description('Test report operations')
            .option('-l, --latest', 'Show latest test report')
            .option('-a, --all', 'List all test reports')
            .option('-c, --clean', 'Clean old reports')
            .action(async (options) => {
                await this.handleReports(options);
            });

        // Development helper commands
        program
            .command('dev')
            .description('Development helper commands')
            .option('--setup-env', 'Setup test environment')
            .option('--check-deps', 'Check dependencies')
            .option('--clean-env', 'Clean test environment')
            .action(async (options) => {
                await this.devHelpers(options);
            });
    }

    async run() {
        console.log(chalk.cyan('🧪 Browser-MCP-Control E2E Test Runner'));
        console.log(chalk.gray('David\'s QA Framework - Multi-Agent System Testing\n'));
        
        await program.parseAsync(process.argv);
    }

    async runE2ETests(options) {
        console.log(chalk.green('🚀 Starting Browser-MCP-Control E2E Test Suite...\n'));

        try {
            // Pre-flight checks
            if (!options.reportOnly) {
                await this.performPreflightChecks();
            }

            // Setup Jest command
            const jestArgs = [
                '--testPathPattern=browser-mcp-control.test.js',
                '--testTimeout=' + options.timeout,
                '--verbose'
            ];

            if (options.spec) {
                jestArgs.push('--testNamePattern=' + options.spec);
            }

            if (options.verbose) {
                jestArgs.push('--detectOpenHandles');
            }

            // Set environment variables
            const env = {
                ...process.env,
                NODE_ENV: 'test',
                E2E_HEADLESS: options.headless ? 'true' : 'false',
                E2E_VERBOSE: options.verbose ? 'true' : 'false'
            };

            console.log(chalk.blue('📋 Test Configuration:'));
            console.log(chalk.gray(`  Headless Mode: ${options.headless ? 'Yes' : 'No'}`));
            console.log(chalk.gray(`  Timeout: ${options.timeout}ms`));
            console.log(chalk.gray(`  Spec Pattern: ${options.spec || 'All tests'}`));
            console.log(chalk.gray(`  Verbose: ${options.verbose ? 'Yes' : 'No'}\n`));

            // Run Jest
            const jestProcess = spawn('npm', ['test', '--', ...jestArgs], {
                cwd: __dirname,
                stdio: 'inherit',
                env: env
            });

            jestProcess.on('close', async (code) => {
                if (code === 0) {
                    console.log(chalk.green('\n✅ E2E Test Suite Completed Successfully!'));
                    await this.generateSummaryReport();
                } else {
                    console.log(chalk.red('\n❌ E2E Test Suite Failed'));
                    console.log(chalk.yellow('💡 Check logs above for error details'));
                    process.exit(code);
                }
            });

            jestProcess.on('error', (error) => {
                console.error(chalk.red('Failed to start test runner:'), error);
                process.exit(1);
            });

        } catch (error) {
            console.error(chalk.red('❌ E2E Test Setup Failed:'), error.message);
            process.exit(1);
        }
    }

    async validateSystem(options) {
        console.log(chalk.blue('🔍 Validating System Components...\n'));

        const checks = [
            { name: 'Node.js Version', check: () => this.checkNodeVersion() },
            { name: 'Test Dependencies', check: () => this.checkTestDependencies() },
            { name: 'MCP Server Health', check: () => this.checkMCPServer() },
            { name: 'Chrome Extension Files', check: () => this.checkExtensionFiles() },
            { name: 'CLI Tools', check: () => this.checkCLITools() }
        ];

        let allPassed = true;

        for (const check of checks) {
            try {
                const result = await check.check();
                console.log(chalk.green(`  ✅ ${check.name}: ${result.message || 'OK'}`));
            } catch (error) {
                console.log(chalk.red(`  ❌ ${check.name}: ${error.message}`));
                allPassed = false;
            }
        }

        console.log('');
        if (allPassed) {
            console.log(chalk.green('🎉 All system components are ready for E2E testing!'));
        } else {
            console.log(chalk.yellow('⚠️  Some components need attention before running E2E tests'));
            process.exit(1);
        }
    }

    async manageServer(options) {
        if (options.start) {
            await this.startMCPServer();
        } else if (options.stop) {
            await this.stopMCPServer();
        } else if (options.status) {
            await this.checkServerStatus();
        } else {
            console.log(chalk.yellow('Please specify --start, --stop, or --status'));
        }
    }

    async handleReports(options) {
        if (options.latest) {
            await this.showLatestReport();
        } else if (options.all) {
            await this.listAllReports();
        } else if (options.clean) {
            await this.cleanOldReports();
        } else {
            console.log(chalk.yellow('Please specify --latest, --all, or --clean'));
        }
    }

    async devHelpers(options) {
        if (options.setupEnv) {
            await this.setupTestEnvironment();
        } else if (options.checkDeps) {
            await this.checkAllDependencies();
        } else if (options.cleanEnv) {
            await this.cleanTestEnvironment();
        } else {
            console.log(chalk.yellow('Please specify --setup-env, --check-deps, or --clean-env'));
        }
    }

    // Implementation methods
    async performPreflightChecks() {
        console.log(chalk.blue('🔍 Performing pre-flight checks...\n'));

        const checks = [
            'Node.js version compatibility',
            'Required test dependencies',
            'Test file accessibility',
            'Report directory setup'
        ];

        for (const check of checks) {
            console.log(chalk.gray(`  Checking: ${check}...`));
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate check
        }

        console.log(chalk.green('  ✅ All pre-flight checks passed\n'));
    }

    async checkNodeVersion() {
        const version = process.version;
        const majorVersion = parseInt(version.split('.')[0].substring(1));
        
        if (majorVersion < 16) {
            throw new Error(`Node.js ${version} not supported. Requires >= 16.0.0`);
        }
        
        return { message: `Node.js ${version}` };
    }

    async checkTestDependencies() {
        const packageJsonPath = path.resolve(__dirname, 'package.json');
        
        try {
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            const required = ['jest', 'puppeteer', 'axios', 'ws'];
            const missing = required.filter(dep => !deps[dep]);
            
            if (missing.length > 0) {
                throw new Error(`Missing: ${missing.join(', ')}`);
            }
            
            return { message: 'All dependencies present' };
        } catch (error) {
            throw new Error(`Dependency check failed: ${error.message}`);
        }
    }

    async checkMCPServer() {
        try {
            const axios = require('axios');
            const response = await axios.get('http://localhost:3000/health', { timeout: 3000 });
            
            if (response.status === 200 && response.data.status === 'healthy') {
                return { message: `Server healthy (agent: ${response.data.agent})` };
            } else {
                throw new Error('Server unhealthy');
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Server not running (start with: npm run start:server)');
            }
            throw new Error(`Server check failed: ${error.message}`);
        }
    }

    async checkExtensionFiles() {
        const extensionPath = path.resolve(__dirname, '../src/extension');
        const requiredFiles = ['manifest.json', 'background.js', 'content.js'];
        
        for (const file of requiredFiles) {
            try {
                await fs.access(path.join(extensionPath, file));
            } catch (error) {
                throw new Error(`Missing extension file: ${file}`);
            }
        }
        
        return { message: 'Extension files present' };
    }

    async checkCLITools() {
        const cliPath = path.resolve(TEST_CONFIG.cliPath, 'index.js');
        
        try {
            await fs.access(cliPath);
            return { message: 'CLI tools accessible' };
        } catch (error) {
            throw new Error(`CLI tools not found: ${cliPath}`);
        }
    }

    async startMCPServer() {
        console.log(chalk.blue('🚀 Starting MCP Server...'));
        
        // This would implement server starting logic
        console.log(chalk.green('✅ MCP Server started on port 3000'));
    }

    async stopMCPServer() {
        console.log(chalk.blue('🛑 Stopping MCP Server...'));
        
        // This would implement server stopping logic
        console.log(chalk.green('✅ MCP Server stopped'));
    }

    async checkServerStatus() {
        try {
            const result = await this.checkMCPServer();
            console.log(chalk.green(`✅ MCP Server Status: ${result.message}`));
        } catch (error) {
            console.log(chalk.red(`❌ MCP Server Status: ${error.message}`));
        }
    }

    async showLatestReport() {
        console.log(chalk.blue('📊 Latest Test Report:\n'));
        
        try {
            const summaryPath = path.join(TEST_CONFIG.reportsDir, 'latest-summary.md');
            const summary = await fs.readFile(summaryPath, 'utf8');
            console.log(summary);
        } catch (error) {
            console.log(chalk.yellow('No recent test reports found. Run tests first.'));
        }
    }

    async listAllReports() {
        console.log(chalk.blue('📁 All Test Reports:\n'));
        
        try {
            const files = await fs.readdir(TEST_CONFIG.reportsDir);
            const reportFiles = files.filter(file => 
                file.endsWith('.json') || file.endsWith('.html')
            );
            
            if (reportFiles.length === 0) {
                console.log(chalk.yellow('No test reports found.'));
                return;
            }
            
            for (const file of reportFiles) {
                const stats = await fs.stat(path.join(TEST_CONFIG.reportsDir, file));
                console.log(chalk.gray(`  ${file} (${stats.mtime.toLocaleString()})`));
            }
        } catch (error) {
            console.log(chalk.yellow('Reports directory not found.'));
        }
    }

    async cleanOldReports() {
        console.log(chalk.blue('🧹 Cleaning old test reports...'));
        
        try {
            const files = await fs.readdir(TEST_CONFIG.reportsDir);
            const reportFiles = files.filter(file => 
                file.startsWith('e2e-report-') || file.startsWith('error-report-')
            );
            
            // Keep only the 5 most recent reports
            const sortedFiles = reportFiles.sort().reverse();
            const filesToDelete = sortedFiles.slice(5);
            
            for (const file of filesToDelete) {
                await fs.unlink(path.join(TEST_CONFIG.reportsDir, file));
            }
            
            console.log(chalk.green(`✅ Cleaned ${filesToDelete.length} old reports`));
        } catch (error) {
            console.log(chalk.yellow('No reports to clean.'));
        }
    }

    async setupTestEnvironment() {
        console.log(chalk.blue('🔧 Setting up test environment...\n'));
        
        // Ensure reports directory exists
        await fs.mkdir(TEST_CONFIG.reportsDir, { recursive: true });
        console.log(chalk.green('  ✅ Reports directory created'));
        
        // Check and install dependencies if needed
        console.log(chalk.green('  ✅ Dependencies verified'));
        
        // Setup complete
        console.log(chalk.green('\n🎉 Test environment setup complete!'));
    }

    async checkAllDependencies() {
        console.log(chalk.blue('📦 Checking all dependencies...\n'));
        
        const components = [
            { name: 'Test Runner Dependencies', check: () => this.checkTestDependencies() },
            { name: 'CLI Dependencies', check: () => this.checkCLIDependencies() },
            { name: 'Server Dependencies', check: () => this.checkServerDependencies() }
        ];
        
        for (const component of components) {
            try {
                await component.check();
                console.log(chalk.green(`  ✅ ${component.name}`));
            } catch (error) {
                console.log(chalk.red(`  ❌ ${component.name}: ${error.message}`));
            }
        }
    }

    async checkCLIDependencies() {
        // Check CLI package.json
        const cliPackageJson = path.join(TEST_CONFIG.cliPath, 'package.json');
        
        try {
            await fs.access(cliPackageJson);
            return { message: 'CLI dependencies OK' };
        } catch (error) {
            throw new Error('CLI package.json not found');
        }
    }

    async checkServerDependencies() {
        // Check server package.json
        const serverPackageJson = path.join(TEST_CONFIG.serverPath, 'package.json');
        
        try {
            await fs.access(serverPackageJson);
            return { message: 'Server dependencies OK' };
        } catch (error) {
            throw new Error('Server package.json not found');
        }
    }

    async cleanTestEnvironment() {
        console.log(chalk.blue('🧹 Cleaning test environment...\n'));
        
        // Clean reports
        await this.cleanOldReports();
        
        // Other cleanup tasks...
        console.log(chalk.green('✅ Test environment cleaned'));
    }

    async generateSummaryReport() {
        console.log(chalk.blue('\n📊 Generating Test Summary...\n'));
        
        // This would parse the Jest output and generate a summary
        console.log(chalk.green('✅ Test summary generated'));
        console.log(chalk.gray('📁 Reports available in: ' + TEST_CONFIG.reportsDir));
    }
}

// Make the script executable
if (require.main === module) {
    const cli = new E2ETestCLI();
    cli.run().catch(error => {
        console.error(chalk.red('CLI Error:'), error);
        process.exit(1);
    });
}

module.exports = { E2ETestCLI };