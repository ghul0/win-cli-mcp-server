# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm install` - Install dependencies
- `npm run build` - Build TypeScript to dist/
- `npm run watch` - Watch mode for development
- `npm start` - Run the built server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

## Architecture Overview

This is an MCP (Model Context Protocol) server that provides SSH remote command execution capabilities for Linux systems.

### Core Components

1. **SSHServer (index.ts)**: Main MCP server implementation that exposes 2 tools for SSH operations. Handles SSH connection management and command execution.

2. **SSH Management (utils/ssh.ts)**: Manages SSH connections with:
   - Connection pooling and automatic reconnection
   - Support for both password and key-based authentication
   - Keepalive and timeout management

3. **Configuration System (utils/config.ts)**: Simple configuration loading from:
   - CLI arguments (highest priority)
   - Local ./config.json
   - Home directory ~/.mcp-ssh/config.json
   - Built-in defaults

### MCP Integration

The server communicates via stdio with MCP clients (like Claude Desktop):
- Tools: ssh_execute, ssh_disconnect
- No resources exposed (simplified design)

## Important Notes

- This is an ES module project - use `"type": "module"` imports
- TypeScript target is ES2020 with NodeNext module resolution
- Minimum Node.js version is 18.0.0
- Designed for Linux environments only
- SSH connections are defined in configuration file