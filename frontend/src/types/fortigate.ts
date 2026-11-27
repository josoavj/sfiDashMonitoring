/**
 * TypeScript Interfaces pour les logs Fortigate & Elasticsearch
 */

export interface FortigateSource {
  ip?: string;
  port?: number;
  bytes?: number;
  packets?: number;
}

export interface FortigateDestination {
  ip?: string;
  port?: number;
  bytes?: number;
  packets?: number;
}

export interface FortigateNetwork {
  bytes?: number;
  packets?: number;
  protocol?: string;
  application?: string;
  transport?: string;
}

export interface FortigateEvent {
  action?: string;
  severity?: number;
  category?: string;
  type?: string;
}

export interface FortigateLogDoc {
  _id: string;
  _index: string;
  _score?: number;
  _source: {
    '@timestamp': string;
    source?: FortigateSource;
    destination?: FortigateDestination;
    network?: FortigateNetwork;
    event?: FortigateEvent;
    host?: {
      ip?: string[];
      name?: string;
    };
    rule?: {
      name?: string;
    };
    fortinet?: {
      firewall?: {
        dstinetsvc?: string;
        action?: string;
      };
    };
    message?: string;
  };
}

export interface BandwidthDelta {
  timestamp: string;
  totalBytes: number;
  sentBytes: number;
  receivedBytes: number;
  intervalMs: number;
}

export interface TopConsumer {
  ip: string;
  bytes: number;
  count: number;
}

export interface TopProtocol {
  protocol: string;
  bytes: number;
  count: number;
}

export interface TopApplication {
  name: string;
  bytes: number;
  count: number;
}

export interface TopBandwidthEvent {
  timestamp: string;
  intervalMs: number;
  top: TopConsumer[];
  topProtocols: TopProtocol[];
  topApplications: TopApplication[];
}
