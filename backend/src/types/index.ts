/**
 * Typedefs TypeScript pour le Backend SFI Monitoring
 */

export interface EsConfig {
  node: string;
  requestTimeout: number;
  auth?: {
    username?: string;
    password?: string;
  };
  tls?: {
    ca?: Buffer;
    rejectUnauthorized: boolean;
  };
}

export interface UserAttributes {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: string;
}

export interface SessionAttributes {
  id?: number;
  userId: number;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  revoked?: boolean;
  expiresAt: Date;
}

export interface SecurityEventQuery {
  from: string;
  to: string;
}

export interface TopBandwidthQuery {
  from: string;
  to: string;
  size?: number;
  type?: 'source' | 'destination';
}
