#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { loadConfig, createDefaultConfig } from './utils/config.js';
import type { ServerConfig } from './types/config.js';
import { SSHConnectionPool } from './utils/ssh.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

// Parse command line arguments using yargs
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const parseArgs = async () => {
  return yargs(hideBin(process.argv))
    .option('config', {
      alias: 'c',
      type: 'string',
      description: 'Path to config file'
    })
    .option('init-config', {
      type: 'string',
      description: 'Create a default config file at the specified path'
    })
    .help()
    .parse();
};

class SSHServer {
  private server: Server;
  private config: ServerConfig;
  private sshPool: SSHConnectionPool;

  constructor(config: ServerConfig) {
    this.config = config;
    this.server = new Server({
      name: "mcp-ssh",
      version: packageJson.version,
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.sshPool = new SSHConnectionPool();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "ssh_execute",
          description: `Execute a command on a remote system via SSH

Example usage:
\`\`\`json
{
  "connectionId": "my-server",
  "command": "ls -la"
}
\`\`\`

Returns command output as text, or error message if execution fails`,
          inputSchema: {
            type: "object",
            properties: {
              connectionId: {
                type: "string",
                description: "ID of the SSH connection to use"
              },
              command: {
                type: "string",
                description: "Command to execute"
              }
            },
            required: ["connectionId", "command"]
          }
        },
        {
          name: "ssh_disconnect",
          description: `Disconnect from an SSH server

Example usage:
\`\`\`json
{
  "connectionId": "my-server"
}
\`\`\`

Returns confirmation message`,
          inputSchema: {
            type: "object",
            properties: {
              connectionId: {
                type: "string",
                description: "ID of the SSH connection to disconnect"
              }
            },
            required: ["connectionId"]
          }
        }
      ]
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "ssh_execute": {
            if (!this.config.ssh.enabled) {
              throw new McpError(
                ErrorCode.InvalidRequest,
                "SSH support is disabled in configuration"
              );
            }

            const args = z.object({
              connectionId: z.string(),
              command: z.string()
            }).parse(request.params.arguments);

            const connectionConfig = this.config.ssh.connections[args.connectionId];
            if (!connectionConfig) {
              throw new McpError(
                ErrorCode.InvalidRequest,
                `Unknown SSH connection ID: ${args.connectionId}`
              );
            }

            try {
              const connection = await this.sshPool.getConnection(args.connectionId, connectionConfig);
              const { output, exitCode } = await connection.executeCommand(args.command);

              return {
                content: [{
                  type: "text",
                  text: output || 'Command completed successfully (no output)'
                }],
                isError: exitCode !== 0,
                metadata: {
                  exitCode,
                  connectionId: args.connectionId
                }
              };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              throw new McpError(
                ErrorCode.InternalError,
                `SSH error: ${errorMessage}`
              );
            }
          }

          case "ssh_disconnect": {
            if (!this.config.ssh.enabled) {
              throw new McpError(
                ErrorCode.InvalidRequest,
                "SSH support is disabled in configuration"
              );
            }

            const args = z.object({
              connectionId: z.string()
            }).parse(request.params.arguments);

            await this.sshPool.closeConnection(args.connectionId);
            return {
              content: [{
                type: "text",
                text: `Disconnected from ${args.connectionId}`
              }]
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid arguments: ${error.errors.map(e => e.message).join(', ')}`
          );
        }
        throw error;
      }
    });
  }

  private async cleanup(): Promise<void> {
    this.sshPool.closeAll();
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    
    // Set up cleanup handler
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
    
    await this.server.connect(transport);
    console.error("MCP SSH Server running on stdio");
  }
}

// Start server
const main = async () => {
  try {
    const args = await parseArgs();
    
    // Handle --init-config flag
    if (args['init-config']) {
      try {
        createDefaultConfig(args['init-config'] as string);
        console.error(`Created default config at: ${args['init-config']}`);
        process.exit(0);
      } catch (error) {
        console.error('Failed to create config file:', error);
        process.exit(1);
      }
    }

    // Load configuration
    const config = loadConfig(args.config);
    
    const server = new SSHServer(config);
    await server.run();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
};

main();