import fs from 'fs';
import path from 'path';
import os from 'os';
import { ServerConfig } from '../types/config.js';

export const DEFAULT_CONFIG: ServerConfig = {
  ssh: {
    enabled: true,
    defaultTimeout: 30,
    maxConcurrentSessions: 5,
    keepaliveInterval: 10000,
    keepaliveCountMax: 3,
    readyTimeout: 20000,
    connections: {}
  }
};

export function loadConfig(configPath?: string): ServerConfig {
  // If no config path provided, look in default locations
  const configLocations = [
    configPath,
    path.join(process.cwd(), 'config.json'),
    path.join(os.homedir(), '.mcp-ssh', 'config.json')
  ].filter(Boolean);

  let loadedConfig: Partial<ServerConfig> = {};

  for (const location of configLocations) {
    if (!location) continue;
    
    try {
      if (fs.existsSync(location)) {
        const fileContent = fs.readFileSync(location, 'utf8');
        loadedConfig = JSON.parse(fileContent);
        console.error(`Loaded config from ${location}`);
        break;
      }
    } catch (error) {
      console.error(`Error loading config from ${location}:`, error);
    }
  }

  // Use defaults only if no config was loaded
  const mergedConfig = Object.keys(loadedConfig).length > 0 
    ? mergeConfigs(DEFAULT_CONFIG, loadedConfig)
    : DEFAULT_CONFIG;

  // Validate the merged config
  validateConfig(mergedConfig);

  return mergedConfig;
}

function mergeConfigs(defaultConfig: ServerConfig, userConfig: Partial<ServerConfig>): ServerConfig {
  return {
    ssh: {
      ...defaultConfig.ssh,
      ...(userConfig.ssh || {}),
      connections: {
        ...defaultConfig.ssh.connections,
        ...(userConfig.ssh?.connections || {})
      }
    }
  };
}

function validateConfig(config: ServerConfig): void {
  // Validate SSH configuration
  if (!config.ssh.enabled) {
    throw new Error('SSH must be enabled for this server to function');
  }
  
  if (config.ssh.defaultTimeout < 1) {
    throw new Error('SSH defaultTimeout must be at least 1 second');
  }
  if (config.ssh.maxConcurrentSessions < 1) {
    throw new Error('SSH maxConcurrentSessions must be at least 1');
  }
  if (config.ssh.keepaliveInterval < 1000) {
    throw new Error('SSH keepaliveInterval must be at least 1000ms');
  }
  if (config.ssh.readyTimeout < 1000) {
    throw new Error('SSH readyTimeout must be at least 1000ms');
  }

  // Validate individual connections
  for (const [connId, conn] of Object.entries(config.ssh.connections)) {
    if (!conn.host || !conn.username || (!conn.password && !conn.privateKeyPath)) {
      throw new Error(`Invalid SSH connection config for '${connId}': missing required fields`);
    }
    if (conn.port && (conn.port < 1 || conn.port > 65535)) {
      throw new Error(`Invalid SSH port for '${connId}': must be between 1 and 65535`);
    }
  }
}

// Helper function to create a default config file
export function createDefaultConfig(configPath: string): void {
  const dirPath = path.dirname(configPath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const sampleConfig = {
    ssh: {
      enabled: true,
      defaultTimeout: 30,
      maxConcurrentSessions: 5,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
      readyTimeout: 20000,
      connections: {
        "example-server": {
          "host": "example.com",
          "port": 22,
          "username": "your-username",
          "password": "your-password"
        }
      }
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(sampleConfig, null, 2));
}