// Emma's CLI Implementation - Hello World Multi-Agent Demo
// Provides command-line interface to interact với Mike's MCP server

const { Command } = require('commander');
const WebSocket = require('ws');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const figlet = require('figlet');
const Conf = require('conf');
const packageInfo = require('./package.json');
const { MCPClient } = require('./mcp-client');

class HelloWorldCLI {
    constructor() {
        this.program = new Command();
        this.config = new Conf({
            projectName: 'hello-cli',
            defaults: {
                serverUrl: 'ws://localhost:3000',
                httpUrl: 'http://localhost:3000',
                defaultName: process.env.USER || 'Anonymous',
                timeout: 5000,
                retries: 3
            }
        });
        
        this.websocket = null;
        this.isConnected = false;
        
        // Initialize MCP client for browser control
        this.mcpClient = new MCPClient(this.config.get('httpUrl'), {
            timeout: this.config.get('timeout'),
            retries: this.config.get('retries'),
            debug: false
        });
        
        this.setupCommands();
    }
    
    setupCommands() {
        this.program
            .name('hello-cli')
            .description('CLI tool for Hello World Multi-Agent Demo với MCP Browser Control - Built by Emma 🔧')
            .version(packageInfo.version);
        
        // Greet command - Main functionality
        this.program
            .command('greet [name]')
            .description('Send a greeting to the MCP server')
            .option('-w, --websocket', 'Use WebSocket connection (default)')
            .option('-r, --rest', 'Use REST API instead of WebSocket')
            .option('-i, --interactive', 'Interactive mode với prompts')
            .action(async (name, options) => {
                await this.handleGreetCommand(name, options);
            });
        
        // Server status command
        this.program
            .command('status')
            .description('Check MCP server status và statistics')
            .option('-v, --verbose', 'Show detailed information')
            .action(async (options) => {
                await this.handleStatusCommand(options);
            });
        
        // Interactive mode command
        this.program
            .command('interactive')
            .alias('i')
            .description('Start interactive session với the server')
            .action(async () => {
                await this.handleInteractiveCommand();
            });
        
        // Configuration commands
        this.program
            .command('config')
            .description('Manage CLI configuration')
            .option('-s, --set <key=value>', 'Set configuration value')
            .option('-g, --get <key>', 'Get configuration value')
            .option('-l, --list', 'List all configuration')
            .option('-r, --reset', 'Reset to default configuration')
            .action(async (options) => {
                await this.handleConfigCommand(options);
            });
        
        // Test command
        this.program
            .command('test')
            .description('Test connection và functionality')
            .option('-a, --all', 'Run all tests')
            .action(async (options) => {
                await this.handleTestCommand(options);
            });
        
        // MCP Browser Control Commands
        const mcpCommand = this.program
            .command('mcp-browser')
            .description('Browser control via MCP Server integration')
            .alias('mcp');
        
        // Console Hello subcommand
        mcpCommand
            .command('console-hello [message]')
            .description('Execute console.log in browser via MCP Server')
            .option('-r, --retry <number>', 'Number of retry attempts', '3')
            .action(async (message, options) => {
                await this.handleMCPConsoleHello(message, options);
            });
        
        // Tool discovery subcommand
        mcpCommand
            .command('tools')
            .description('List available MCP tools')
            .option('-v, --verbose', 'Show detailed tool information')
            .action(async (options) => {
                await this.handleMCPToolsCommand(options);
            });
        
        // MCP status subcommand
        mcpCommand
            .command('status')
            .description('Check MCP server status')
            .option('-c, --connection', 'Test connection only')
            .action(async (options) => {
                await this.handleMCPStatusCommand(options);
            });
    }
    
    async run() {
        // Show banner
        this.showBanner();
        
        // Parse command line arguments
        await this.program.parseAsync(process.argv);
    }
    
    showBanner() {
        const banner = figlet.textSync('Hello CLI', {
            font: 'Small',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        });
        
        console.log(chalk.cyan(banner));
        console.log(chalk.gray('Multi-Agent Demo CLI với MCP Browser Control - Built by Emma 🔧\\n'));
    }
    
    async handleGreetCommand(name, options) {
        try {
            const targetName = name || this.config.get('defaultName');
            
            if (options.interactive) {
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'userName',
                        message: 'What\'s your name?',
                        default: targetName
                    },
                    {
                        type: 'list',
                        name: 'method',
                        message: 'How would you like to connect?',
                        choices: [
                            { name: 'WebSocket (Real-time)', value: 'websocket' },
                            { name: 'REST API (HTTP)', value: 'rest' }
                        ],
                        default: 'websocket'
                    }
                ]);
                
                if (answers.method === 'rest') {
                    options.rest = true;
                }
                
                return await this.sendGreeting(answers.userName, options);
            } else {
                return await this.sendGreeting(targetName, options);
            }
            
        } catch (error) {
            console.error(chalk.red('Error in greet command:'), error.message);
            process.exit(1);
        }
    }
    
    async sendGreeting(name, options = {}) {
        if (options.rest) {
            return await this.sendRestGreeting(name);
        } else {
            return await this.sendWebSocketGreeting(name);
        }
    }
    
    async sendRestGreeting(name) {
        const spinner = ora('Sending greeting via REST API...').start();
        
        try {
            const httpUrl = this.config.get('httpUrl');
            const response = await axios.post(`${httpUrl}/api/hello`, 
                { name: name },
                { timeout: this.config.get('timeout') }
            );
            
            spinner.succeed('Greeting sent successfully!');
            
            console.log('\\n' + chalk.green('📡 Server Response (REST API):'));
            console.log(chalk.yellow(`  ${response.data.greeting}`));
            console.log(chalk.gray(`  Agent: ${response.data.agent}`));
            console.log(chalk.gray(`  Time: ${new Date(response.data.timestamp).toLocaleString()}`));
            console.log(chalk.gray(`  Response ID: ${response.data.responseId}`));
            
        } catch (error) {
            spinner.fail('Failed to send greeting');
            
            if (error.code === 'ECONNREFUSED') {
                console.error(chalk.red('❌ Cannot connect to server. Make sure Mike\'s MCP server is running on'), chalk.yellow(this.config.get('httpUrl')));
            } else {
                console.error(chalk.red('Error:'), error.message);
            }
            
            throw error;
        }
    }
    
    async sendWebSocketGreeting(name) {
        const spinner = ora('Connecting to WebSocket server...').start();
        
        try {
            await this.connectWebSocket();
            spinner.text = 'Sending greeting via WebSocket...';
            
            const response = await this.sendWebSocketMessage({
                type: 'hello_request',
                data: {
                    name: name,
                    timestamp: new Date().toISOString(),
                    source: 'cli_tool',
                    agent: 'emma'
                }
            });
            
            spinner.succeed('Greeting sent successfully!');
            
            console.log('\\n' + chalk.green('🔗 Server Response (WebSocket):'));
            console.log(chalk.yellow(`  ${response.greeting}`));
            console.log(chalk.gray(`  Agent: ${response.agent}`));
            console.log(chalk.gray(`  Client ID: ${response.clientId}`));
            console.log(chalk.gray(`  Server Time: ${new Date(response.server_time).toLocaleString()}`));
            console.log(chalk.gray(`  Message Count: ${response.messageCount}`));
            
            await this.disconnectWebSocket();
            
        } catch (error) {
            spinner.fail('Failed to send greeting');
            
            if (error.code === 'ECONNREFUSED') {
                console.error(chalk.red('❌ Cannot connect to WebSocket server. Make sure Mike\'s MCP server is running on'), chalk.yellow(this.config.get('serverUrl')));
            } else {
                console.error(chalk.red('Error:'), error.message);
            }
            
            await this.disconnectWebSocket();
            throw error;
        }
    }
    
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            if (this.isConnected) {
                resolve();
                return;
            }
            
            const serverUrl = this.config.get('serverUrl');
            this.websocket = new WebSocket(serverUrl);
            
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, this.config.get('timeout'));
            
            this.websocket.onopen = () => {
                clearTimeout(timeout);
                this.isConnected = true;
                resolve();
            };
            
            this.websocket.onerror = (error) => {
                clearTimeout(timeout);
                this.isConnected = false;
                reject(error);
            };
            
            this.websocket.onclose = () => {
                this.isConnected = false;
            };
        });
    }
    
    async sendWebSocketMessage(message) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('WebSocket not connected'));
                return;
            }
            
            const timeout = setTimeout(() => {
                reject(new Error('Message response timeout'));
            }, this.config.get('timeout'));
            
            const messageHandler = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    
                    if (response.type === 'hello_response') {
                        clearTimeout(timeout);
                        this.websocket.removeEventListener('message', messageHandler);
                        resolve(response.data);
                    } else if (response.type === 'error') {
                        clearTimeout(timeout);
                        this.websocket.removeEventListener('message', messageHandler);
                        reject(new Error(response.data.message));
                    }
                    
                } catch (error) {
                    clearTimeout(timeout);
                    this.websocket.removeEventListener('message', messageHandler);
                    reject(error);
                }
            };
            
            this.websocket.addEventListener('message', messageHandler);
            this.websocket.send(JSON.stringify(message));
        });
    }
    
    async disconnectWebSocket() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            this.isConnected = false;
        }
    }
    
    async handleStatusCommand(options) {
        const spinner = ora('Checking server status...').start();
        
        try {
            const httpUrl = this.config.get('httpUrl');
            const [healthResponse, statsResponse] = await Promise.all([
                axios.get(`${httpUrl}/health`, { timeout: this.config.get('timeout') }),
                axios.get(`${httpUrl}/api/stats`, { timeout: this.config.get('timeout') })
            ]);
            
            spinner.succeed('Server status retrieved');
            
            console.log('\\n' + chalk.green('🏥 Server Health:'));
            console.log(chalk.yellow(`  Status: ${healthResponse.data.status}`));
            console.log(chalk.gray(`  Agent: ${healthResponse.data.agent}`));
            console.log(chalk.gray(`  Version: ${healthResponse.data.version}`));
            console.log(chalk.gray(`  Uptime: ${Math.round(healthResponse.data.uptime / 1000)}s`));
            
            console.log('\\n' + chalk.green('📊 Server Statistics:'));
            console.log(chalk.yellow(`  Total Connections: ${statsResponse.data.totalConnections}`));
            console.log(chalk.yellow(`  Active Connections: ${statsResponse.data.activeConnections}`));
            console.log(chalk.yellow(`  Total Messages: ${statsResponse.data.totalMessages}`));
            
            if (options.verbose && statsResponse.data.recentMessages) {
                console.log('\\n' + chalk.green('📝 Recent Messages:'));
                statsResponse.data.recentMessages.forEach((msg, index) => {
                    console.log(chalk.gray(`  ${index + 1}. ${msg.type} from ${msg.clientId} at ${new Date(msg.timestamp).toLocaleString()}`));
                });
            }
            
        } catch (error) {
            spinner.fail('Failed to get server status');
            
            if (error.code === 'ECONNREFUSED') {
                console.error(chalk.red('❌ Server is not running. Please start Mike\'s MCP server first.'));
            } else {
                console.error(chalk.red('Error:'), error.message);
            }
        }
    }
    
    async handleInteractiveCommand() {
        console.log(chalk.green('🔗 Starting interactive session...\\n'));
        
        try {
            const spinner = ora('Connecting to server...').start();
            await this.connectWebSocket();
            spinner.succeed('Connected to server!');
            
            console.log(chalk.yellow('Type messages to send to the server. Type "exit" to quit.\\n'));
            
            while (true) {
                const answer = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'message',
                        message: chalk.cyan('Enter your name (or "exit"):')
                    }
                ]);
                
                if (answer.message.toLowerCase() === 'exit') {
                    break;
                }
                
                if (answer.message.trim()) {
                    try {
                        const response = await this.sendWebSocketMessage({
                            type: 'hello_request',
                            data: {
                                name: answer.message.trim(),
                                timestamp: new Date().toISOString(),
                                source: 'cli_interactive',
                                agent: 'emma'
                            }
                        });
                        
                        console.log(chalk.green(`\\n  Server: ${response.greeting}\\n`));
                        
                    } catch (error) {
                        console.log(chalk.red(`\\n  Error: ${error.message}\\n`));
                    }
                }
            }
            
            await this.disconnectWebSocket();
            console.log(chalk.yellow('\\nInteractive session ended. Goodbye! 👋'));
            
        } catch (error) {
            console.error(chalk.red('Interactive session failed:'), error.message);
        }
    }
    
    async handleConfigCommand(options) {
        if (options.set) {
            const [key, value] = options.set.split('=');
            if (!key || value === undefined) {
                console.error(chalk.red('Invalid format. Use: --set key=value'));
                return;
            }
            
            this.config.set(key, value);
            console.log(chalk.green(`✅ Set ${key} = ${value}`));
            
        } else if (options.get) {
            const value = this.config.get(options.get);
            console.log(chalk.yellow(`${options.get} = ${value}`));
            
        } else if (options.list) {
            console.log(chalk.green('📋 Current Configuration:'));
            const allConfig = this.config.store;
            Object.entries(allConfig).forEach(([key, value]) => {
                console.log(chalk.yellow(`  ${key} = ${value}`));
            });
            
        } else if (options.reset) {
            const confirm = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'reset',
                    message: 'Are you sure you want to reset all configuration?',
                    default: false
                }
            ]);
            
            if (confirm.reset) {
                this.config.clear();
                console.log(chalk.green('✅ Configuration reset to defaults'));
            }
            
        } else {
            console.log(chalk.yellow('Use --help to see configuration options'));
        }
    }
    
    async handleTestCommand(options) {
        console.log(chalk.green('🧪 Running CLI tests...\\n'));
        
        const tests = [
            { name: 'Server Health Check', test: () => this.testServerHealth() },
            { name: 'REST API Test', test: () => this.testRestAPI() },
            { name: 'WebSocket Connection', test: () => this.testWebSocket() },
            { name: 'MCP Server Connection', test: () => this.testMCPConnection() },
            { name: 'MCP Tools Discovery', test: () => this.testMCPToolsDiscovery() },
        ];
        
        if (options.all) {
            tests.push({ name: 'MCP Console Hello Tool', test: () => this.testMCPConsoleHello() });
        }
        
        for (const testCase of tests) {
            const spinner = ora(`Testing: ${testCase.name}`).start();
            
            try {
                await testCase.test();
                spinner.succeed(`✅ ${testCase.name}`);
            } catch (error) {
                spinner.fail(`❌ ${testCase.name}: ${error.message}`);
            }
        }
        
        console.log(chalk.green('\\n🎉 Test suite completed!'));
    }
    
    async testServerHealth() {
        const httpUrl = this.config.get('httpUrl');
        const response = await axios.get(`${httpUrl}/health`, { timeout: 3000 });
        
        if (response.data.status !== 'healthy') {
            throw new Error('Server not healthy');
        }
    }
    
    async testRestAPI() {
        const httpUrl = this.config.get('httpUrl');
        const response = await axios.post(`${httpUrl}/api/hello`, 
            { name: 'CLI Test' },
            { timeout: 3000 }
        );
        
        if (!response.data.greeting || !response.data.agent) {
            throw new Error('Invalid API response');
        }
    }
    
    async testWebSocket() {
        await this.connectWebSocket();
        
        const response = await this.sendWebSocketMessage({
            type: 'hello_request',
            data: {
                name: 'WebSocket Test',
                timestamp: new Date().toISOString(),
                source: 'cli_test',
                agent: 'emma'
            }
        });
        
        if (!response.greeting || !response.agent) {
            throw new Error('Invalid WebSocket response');
        }
        
        await this.disconnectWebSocket();
    }
    
    async testMCPConnection() {
        const isConnected = await this.mcpClient.testConnection();
        
        if (!isConnected) {
            throw new Error('MCP Server connection failed');
        }
    }
    
    async testMCPToolsDiscovery() {
        const toolsData = await this.mcpClient.discoverTools();
        
        if (!toolsData || !toolsData.tools) {
            throw new Error('Invalid tools discovery response');
        }
        
        // Check if console_hello tool exists
        const consoleHelloTool = toolsData.tools.find(t => t.name === 'mcp:tool.console_hello');
        if (!consoleHelloTool) {
            throw new Error('console_hello tool not found in registry');
        }
    }
    
    async testMCPConsoleHello() {
        // This is a more complete test that actually executes the tool
        const testMessage = 'CLI Test Message via MCP';
        
        const result = await this.mcpClient.executeTool(
            'mcp:tool.console_hello',
            { message: testMessage }
        );
        
        const formattedResult = this.mcpClient.formatResult(result);
        
        if (!formattedResult.success) {
            throw new Error(`Console Hello execution failed: ${formattedResult.message}`);
        }
    }
    
    // MCP Browser Control Command Handlers
    
    async handleMCPConsoleHello(message, options) {
        const spinner = ora('Executing console.log in browser via MCP Server...').start();
        
        try {
            const customMessage = message || 'Hello from Emma\'s CLI via MCP Browser Control!';
            const retries = parseInt(options.retry) || 3;
            
            // Test connection first
            const isConnected = await this.mcpClient.testConnection();
            if (!isConnected) {
                throw new Error('Cannot connect to MCP Server. Make sure Mike\'s MCP server is running.');
            }
            
            spinner.text = 'Validating console_hello tool...';
            
            // Validate tool exists
            await this.mcpClient.validateTool('mcp:tool.console_hello');
            
            spinner.text = 'Executing console.log in browser...';
            
            // Execute the tool with retry logic
            const result = await this.mcpClient.executeToolWithRetry(
                'mcp:tool.console_hello',
                { message: customMessage },
                retries
            );
            
            const formattedResult = this.mcpClient.formatResult(result);
            
            if (formattedResult.success) {
                spinner.succeed('Console.log executed successfully in browser!');
                
                console.log('\n' + chalk.green('🌐 MCP Browser Execution Result:'));
                console.log(chalk.yellow(`  Message: "${customMessage}"`));
                console.log(chalk.gray(`  Tool: ${formattedResult.toolName}`));
                console.log(chalk.gray(`  Timestamp: ${new Date(formattedResult.timestamp).toLocaleString()}`));
                
                if (formattedResult.executionTime) {
                    console.log(chalk.gray(`  Execution Time: ${formattedResult.executionTime}ms`));
                }
                
                if (formattedResult.data && formattedResult.data.browserInfo) {
                    console.log(chalk.cyan('  Browser Info:'));
                    console.log(chalk.gray(`    Tab: ${formattedResult.data.browserInfo.title || 'Unknown'}`));
                    console.log(chalk.gray(`    URL: ${formattedResult.data.browserInfo.url || 'Unknown'}`));
                }
                
            } else {
                spinner.fail('Console.log execution failed');
                console.log(chalk.red(`Error: ${formattedResult.message}`));
            }
            
        } catch (error) {
            spinner.fail('MCP browser command failed');
            
            console.error(chalk.red('❌ Error details:'));
            console.error(chalk.red(`  ${error.message}`));
            
            if (error.message.includes('not running')) {
                console.log(chalk.yellow('\n💡 Troubleshooting:'));
                console.log(chalk.gray('  1. Start Mike\'s MCP server: npm run start:server'));
                console.log(chalk.gray('  2. Ensure Chrome Extension is loaded'));
                console.log(chalk.gray('  3. Check server logs for errors'));
            }
        }
    }
    
    async handleMCPToolsCommand(options) {
        const spinner = ora('Discovering available MCP tools...').start();
        
        try {
            const toolsData = await this.mcpClient.discoverTools();
            spinner.succeed('MCP tools discovered');
            
            console.log('\n' + chalk.green('🔧 Available MCP Tools:'));
            
            if (!toolsData.tools || toolsData.tools.length === 0) {
                console.log(chalk.yellow('  No tools found in registry'));
                return;
            }
            
            toolsData.tools.forEach((tool, index) => {
                console.log(chalk.cyan(`\n  ${index + 1}. ${tool.name}`));
                console.log(chalk.gray(`     Description: ${tool.description || 'No description'}`));
                
                if (options.verbose) {
                    if (tool.parameters && tool.parameters.properties) {
                        console.log(chalk.gray('     Parameters:'));
                        Object.entries(tool.parameters.properties).forEach(([param, config]) => {
                            const required = tool.parameters.required?.includes(param) ? ' (required)' : '';
                            console.log(chalk.gray(`       - ${param}: ${config.type}${required}`));
                            if (config.description) {
                                console.log(chalk.gray(`         ${config.description}`));
                            }
                        });
                    }
                    
                    if (tool.examples && tool.examples.length > 0) {
                        console.log(chalk.gray('     Examples:'));
                        tool.examples.forEach(example => {
                            console.log(chalk.gray(`       ${example}`));
                        });
                    }
                }
            });
            
            console.log(chalk.green(`\n📊 Total tools: ${toolsData.tools.length}`));
            
            if (toolsData.version) {
                console.log(chalk.gray(`Registry version: ${toolsData.version}`));
            }
            
        } catch (error) {
            spinner.fail('Failed to discover MCP tools');
            console.error(chalk.red('Error:'), error.message);
        }
    }
    
    async handleMCPStatusCommand(options) {
        const spinner = ora('Checking MCP server status...').start();
        
        try {
            if (options.connection) {
                // Just test connection
                const isConnected = await this.mcpClient.testConnection();
                
                if (isConnected) {
                    spinner.succeed('MCP Server connection successful');
                    console.log(chalk.green('✅ MCP Server is reachable'));
                } else {
                    spinner.fail('MCP Server connection failed');
                    console.log(chalk.red('❌ MCP Server is not reachable'));
                }
                return;
            }
            
            // Get full status
            const statusData = await this.mcpClient.getStatus();
            spinner.succeed('MCP server status retrieved');
            
            console.log('\n' + chalk.green('🏥 MCP Server Status:'));
            console.log(chalk.yellow(`  Status: ${statusData.status || 'Unknown'}`));
            console.log(chalk.gray(`  Server Type: ${statusData.serverType || 'MCP Server'}`));
            
            if (statusData.uptime) {
                const uptimeSeconds = Math.round(statusData.uptime / 1000);
                console.log(chalk.gray(`  Uptime: ${uptimeSeconds}s`));
            }
            
            if (statusData.version) {
                console.log(chalk.gray(`  Version: ${statusData.version}`));
            }
            
            if (statusData.connections !== undefined) {
                console.log(chalk.yellow(`  Active Connections: ${statusData.connections}`));
            }
            
            if (statusData.toolsRegistered !== undefined) {
                console.log(chalk.yellow(`  Tools Registered: ${statusData.toolsRegistered}`));
            }
            
            if (statusData.lastActivity) {
                console.log(chalk.gray(`  Last Activity: ${new Date(statusData.lastActivity).toLocaleString()}`));
            }
            
            // Browser extension status
            if (statusData.extensionStatus) {
                console.log('\n' + chalk.green('🌐 Browser Extension Status:'));
                console.log(chalk.yellow(`  Connected: ${statusData.extensionStatus.connected ? 'Yes' : 'No'}`));
                
                if (statusData.extensionStatus.tabCount !== undefined) {
                    console.log(chalk.gray(`  Active Tabs: ${statusData.extensionStatus.tabCount}`));
                }
            }
            
        } catch (error) {
            spinner.fail('Failed to get MCP server status');
            console.error(chalk.red('Error:'), error.message);
            
            if (error.message.includes('not running')) {
                console.log(chalk.yellow('\n💡 Start MCP server with: npm run start:server'));
            }
        }
    }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\\n👋 Shutting down CLI...'));
    process.exit(0);
});

// Initialize and run CLI if this file is run directly
if (require.main === module) {
    const cli = new HelloWorldCLI();
    cli.run().catch(error => {
        console.error(chalk.red('CLI Error:'), error.message);
        process.exit(1);
    });
}

module.exports = { HelloWorldCLI };