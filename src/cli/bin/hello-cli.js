#!/usr/bin/env node

// Emma's CLI Entry Point - Hello World Multi-Agent Demo
// Coordinates between Mike's server và provides command-line interface

const path = require('path');
const { HelloWorldCLI } = require('../index.js');

// Initialize và run CLI
const cli = new HelloWorldCLI();
cli.run().catch(error => {
    console.error('CLI Error:', error.message);
    process.exit(1);
});