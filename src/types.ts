/**
 * Core types for AploNpm library
 */

/**
 * Ethereum-compatible address (0x-prefixed hex string)
 */
export type Address = `0x${string}`;

/**
 * Hex string (0x-prefixed)
 */
export type Hex = `0x${string}`;

/**
 * Transaction hash
 */
export type TransactionHash = Hex;

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: number;
  name: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * JSON-RPC request
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown[];
}

/**
 * JSON-RPC response
 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Transaction request
 */
export interface TransactionRequest {
  from: Address;
  to?: Address;
  data?: Hex;
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  nonce?: number;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  transactionHash: TransactionHash;
  blockNumber: bigint;
  blockHash: Hex;
  from: Address;
  to?: Address;
  gasUsed: bigint;
  status: bigint;
  logs: Array<{
    address: Address;
    topics: Hex[];
    data: Hex;
  }>;
}

/**
 * Provider interface for JSON-RPC communication
 */
export interface Provider {
  request<T = unknown>(_method: string, _params?: unknown[]): Promise<T>;
}
