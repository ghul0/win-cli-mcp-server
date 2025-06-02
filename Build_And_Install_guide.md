# Build and Installation Guide for mcp-ssh

This guide covers building and installing the mcp-ssh MCP server for SSH remote command execution on Linux systems.

## Prerequisites

- Node.js 18.0.0 or higher
- npm (comes with Node.js)
- Git (for cloning the repository)
- Linux operating system

## Building from Source

### 1. Clone the Repository

```bash
git clone https://github.com/ghul0/win-cli-mcp-server.git
cd win-cli-mcp-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

This will compile TypeScript files and create the `dist/` directory with the built JavaScript files.

### 4. Verify the Build

```bash
# Check that the main file exists and is executable
ls -la dist/index.js
```

## Installation Methods

### Method 1: Local Installation (Recommended for Development)

1. **Create SSH Configuration File**

   Copy the example configuration and modify it with your SSH connections:
   ```bash
   cp example-ssh-config.json config.json
   # Edit config.json with your SSH connection details
   ```

2. **Test the Server Locally**
   ```bash
   npm start
   ```

### Method 2: Global Installation via npm

1. **Package the Project**
   ```bash
   npm pack
   # This creates mcp-ssh-0.1.0.tgz
   ```

2. **Install Globally**
   ```bash
   npm install -g ./mcp-ssh-0.1.0.tgz
   ```

3. **Verify Installation**
   ```bash
   which mcp-ssh
   mcp-ssh --version
   ```

### Method 3: Integration with Claude Desktop

1. **Prepare SSH Configuration**

   Create your SSH configuration file in a persistent location:
   ```bash
   mkdir -p ~/.mcp-ssh
   cp example-ssh-config.json ~/.mcp-ssh/config.json
   # Edit ~/.mcp-ssh/config.json with your SSH connections
   ```

2. **Configure Claude Desktop**

   Add the following to your Claude Desktop configuration file:
   
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "mcp-ssh": {
         "command": "node",
         "args": [
           "/path/to/mcp-ssh/dist/index.js"
         ],
         "env": {
           "SSH_CONFIG_PATH": "/path/to/your/ssh/config.json"
         }
       }
     }
   }
   ```

   Or if installed globally via npm:
   ```json
   {
     "mcpServers": {
       "mcp-ssh": {
         "command": "npx",
         "args": [
           "mcp-ssh"
         ],
         "env": {
           "SSH_CONFIG_PATH": "/path/to/your/ssh/config.json"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

   After updating the configuration, restart Claude Desktop for the changes to take effect.

## Configuration

### SSH Configuration Format

The SSH configuration file should follow this structure:

```json
{
  "connections": {
    "connection-name": {
      "host": "hostname-or-ip",
      "port": 22,
      "username": "your-username",
      "auth": {
        "type": "password",
        "password": "your-password"
      }
    },
    "another-connection": {
      "host": "example.com",
      "port": 22,
      "username": "user",
      "auth": {
        "type": "key",
        "privateKeyPath": "/home/user/.ssh/id_rsa",
        "passphrase": "optional-key-passphrase"
      }
    }
  }
}
```

### Configuration File Locations

The server looks for configuration in the following order (first found wins):
1. Path specified via `SSH_CONFIG_PATH` environment variable
2. `./config.json` (current directory)
3. `~/.mcp-ssh/config.json` (home directory)

## Development Commands

- `npm install` - Install dependencies
- `npm run build` - Build the project
- `npm run watch` - Watch mode for development
- `npm start` - Run the built server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Troubleshooting

### Common Issues

1. **"Unknown SSH connection ID" Error**
   - Ensure your SSH configuration file is correctly formatted
   - Check that the `SSH_CONFIG_PATH` environment variable points to the correct file
   - Verify the connection name matches exactly (case-sensitive)

2. **Connection Timeouts**
   - Verify the target host is reachable from your network
   - Check firewall rules allow SSH connections
   - Ensure SSH service is running on the target host

3. **Authentication Failures**
   - Double-check username and password/key path
   - For key-based auth, ensure the private key file has correct permissions (600)
   - Verify the SSH key is authorized on the target server

### Debugging

Enable debug output by setting the `DEBUG` environment variable:
```bash
DEBUG=mcp:* npm start
```

## Security Considerations

- Store SSH configuration files with restricted permissions (600)
- Consider using key-based authentication instead of passwords
- Keep private keys secure and use passphrases
- Regularly update dependencies for security patches

## Support

For issues and feature requests, please visit:
https://github.com/ghul0/win-cli-mcp-server/issues