/**
 * AploNpm - TypeScript library for AploCoin blockchain interaction
 * @packageDocumentation
 */

import { HttpProvider } from './provider.js';
import { AploClient } from './client.js';

export const VERSION = '0.1.0';

// Export types
export type {
  Address,
  Hex,
  TransactionHash,
  NetworkConfig,
  ProviderConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  TransactionRequest,
  TransactionReceipt,
  Provider,
} from './types.js';

// Export errors
export {
  AploError,
  ProviderError,
  InvalidAddressError,
  InvalidHexError,
  TransactionError,
  TimeoutError,
} from './errors.js';

// Export utilities
export {
  isAddress,
  validateAddress,
  isHex,
  validateHex,
  fromWei,
  toWei,
  formatPrivateKey,
  padHex,
} from './utils.js';

// Export provider
export { HttpProvider } from './provider.js';

// Export client
export { AploClient } from './client.js';
export type { BlockTag } from './client.js';

// Default RPC endpoints
export const DEFAULT_RPC_ENDPOINTS = {
  pub1: 'https://pub1.aplocoin.com',
  pub2: 'https://pub2.aplocoin.com',
} as const;

/**
 * Create AploClient with HTTP provider
 * 
 * @example
 * ```typescript
 * import { createAploClient } from '@aplocoin/aplonpm';
 * 
 * const client = createAploClient({
 *   url: 'https://pub1.aplocoin.com',
 *   timeout: 30000,
 * });
 * 
 * const balance = await client.getBalance('0x...');
 * ```
 */
export function createAploClient(config: {
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
}) {
  const provider = new HttpProvider(config);
  return new AploClient(provider);
}

export default AploClient;
