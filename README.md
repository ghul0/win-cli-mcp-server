# MCP SSH Server

[![smithery badge](https://smithery.ai/badge/mcp-ssh)](https://smithery.ai/server/mcp-ssh)

[MCP server](https://modelcontextprotocol.io/introduction) for secure SSH command execution on remote Linux systems. It allows MCP clients (like [Claude Desktop](https://claude.ai/download)) to execute commands on configured SSH hosts.

>[!IMPORTANT]
> This MCP server provides direct SSH access to remote systems. When enabled, it can execute commands on any configured SSH host.
>
> - Only configure trusted SSH connections
> - Use key-based authentication when possible
> - Review SSH timeout and connection settings
> - Consider security implications of remote access
>
> See [Configuration](#configuration) for more details.

## Features

- **SSH Remote Execution**: Execute commands on remote Linux systems via SSH
- **Connection Management**: Automatic connection pooling and reconnection
- **Authentication Support**: Both password and private key authentication
- **Simple API**: Just two tools - `ssh_execute` and `ssh_disconnect`
- **Configurable**: Define multiple SSH connections with custom settings

## Installation

### Using npx

```bash
npx mcp-ssh
```

### Global Installation

```bash
npm install -g mcp-ssh
```

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ssh": {
      "command": "npx",
      "args": ["-y", "mcp-ssh"]
    }
  }
}
```

For use with a specific config file:

```json
{
  "mcpServers": {
    "ssh": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-ssh",
        "--config",
        "/path/to/your/config.json"
      ]
    }
  }
}
```

## Configuration

The server requires a configuration file to define SSH connections.

### Quick Start

1. Create a configuration file:

```bash
npx mcp-ssh --init-config ~/.mcp-ssh/config.json
```

2. Edit the configuration file to add your SSH connections

3. Update your Claude Desktop configuration to use the config file

### Configuration File Format

```json
{
  "ssh": {
    "enabled": true,
    "defaultTimeout": 30,
    "maxConcurrentSessions": 5,
    "keepaliveInterval": 10000,
    "keepaliveCountMax": 3,
    "readyTimeout": 20000,
    "connections": {
      "my-server": {
        "host": "192.168.1.100",
        "port": 22,
        "username": "myuser",
        "password": "mypassword"
      },
      "production": {
        "host": "prod.example.com",
        "port": 22,
        "username": "deploy",
        "privateKeyPath": "/home/user/.ssh/id_rsa"
      }
    }
  }
}
```

### Configuration Options

#### Global SSH Settings

- `enabled` (boolean): Must be `true` for the server to function
- `defaultTimeout` (number): Default command execution timeout in seconds (default: 30)
- `maxConcurrentSessions` (number): Maximum concurrent SSH sessions (default: 5)
- `keepaliveInterval` (number): Keepalive packet interval in milliseconds (default: 10000)
- `keepaliveCountMax` (number): Maximum keepalive failures before disconnect (default: 3)
- `readyTimeout` (number): Connection establishment timeout in milliseconds (default: 20000)

#### Connection Settings

Each connection in the `connections` object has:

- `host` (string, required): Hostname or IP address
- `port` (number, required): SSH port (default: 22)
- `username` (string, required): SSH username
- `password` (string, optional): Password for authentication
- `privateKeyPath` (string, optional): Path to private key file
- `keepaliveInterval` (number, optional): Override global keepalive interval
- `keepaliveCountMax` (number, optional): Override global keepalive count
- `readyTimeout` (number, optional): Override global ready timeout

**Note**: You must provide either `password` or `privateKeyPath` for authentication.

### Configuration File Locations

The server looks for configuration in these locations (in order):

1. Path specified by `--config` flag
2. `./config.json` in current directory
3. `~/.mcp-ssh/config.json` in user's home directory

## API

### Tools

#### ssh_execute

Execute a command on a remote system via SSH.

**Input:**
- `connectionId` (string): ID of the SSH connection to use
- `command` (string): Command to execute

**Returns:** Command output as text, or error message if execution fails

**Example:**
```json
{
  "connectionId": "my-server",
  "command": "ls -la /var/log"
}
```

#### ssh_disconnect

Disconnect from an SSH server.

**Input:**
- `connectionId` (string): ID of the SSH connection to disconnect

**Returns:** Confirmation message

**Example:**
```json
{
  "connectionId": "my-server"
}
```

## Security Considerations

- **Authentication**: Store private keys securely and use appropriate file permissions (600)
- **Network Security**: Use SSH keys instead of passwords when possible
- **Connection Limits**: Configure appropriate timeouts and connection limits
- **Host Verification**: The server currently does not verify host keys (accepts any host)
- **Command Execution**: All commands are executed with the privileges of the SSH user

## Development

### Building from Source

```bash
git clone https://github.com/your-username/mcp-ssh.git
cd mcp-ssh
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run watch
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.