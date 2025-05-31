export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  privateKeyPath?: string;
  password?: string;
  keepaliveInterval?: number;
  keepaliveCountMax?: number;
  readyTimeout?: number;
}

export interface SSHConfig {
  enabled: boolean;
  connections: Record<string, SSHConnectionConfig>;
  defaultTimeout: number;
  maxConcurrentSessions: number;
  keepaliveInterval: number;
  keepaliveCountMax: number;
  readyTimeout: number;
}

export interface ServerConfig {
  ssh: SSHConfig;
}