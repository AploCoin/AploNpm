/**
 * AploNpm - TypeScript library for AploCoin blockchain interaction
 * @packageDocumentation
 */

import { HttpProvider } from './provider.js';
import { AploClient } from './client.js';
import { AploStaking } from './staking.js';
import { AploMining } from './mining.js';

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

// Export staking
export { AploStaking, STAKING_CONTRACT_ADDRESS, MIN_STAKE_WEI } from './staking.js';

// Export mining
export { AploMining, MINING_CONTRACT_ADDRESS } from './mining.js';
export type { MiningOptions, MiningResult } from './mining.js';

// Export browser wallet adapters
export {
  BrowserWalletAdapter,
  detectInjectedProvider,
} from './browser-adapter.js';
export type {
  EIP1193Provider,
  EIP1193TransactionRequest,
  BrowserWalletEvent,
} from './browser-adapter.js';

// Export browser helpers
export {
  BrowserProvider,
  createBrowserClient,
  createBrowserStaking,
  createBrowserMining,
  sendAplo,
  stakeAplo,
  unstakeAplo,
  getWalletStatus,
} from './browser-helpers.js';

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

/**
 * Create AploStaking client with HTTP provider
 * 
 * @example
 * ```typescript
 * import { createAploStaking } from '@aplocoin/aplonpm';
 * 
 * const staking = createAploStaking({
 *   url: 'https://pub1.aplocoin.com',
 * });
 * 
 * const stake = await staking.getStake('0x...');
 * const canMine = await staking.canMine('0x...');
 * ```
 */
export function createAploStaking(config: {
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
}) {
  const provider = new HttpProvider(config);
  return new AploStaking(provider);
}

/**
 * Create AploMining client with HTTP provider
 * 
 * @example
 * ```typescript
 * import { createAploMining } from '@aplocoin/aplonpm';
 * 
 * const mining = createAploMining({
 *   url: 'https://pub1.aplocoin.com',
 * });
 * 
 * // Mine once
 * const result = await mining.mineOnce(privateKey, fromAddress);
 * 
 * // Continuous mining
 * const controller = new AbortController();
 * await mining.mineLoop(privateKey, fromAddress, {
 *   signal: controller.signal,
 *   onSuccess: (result) => console.log('Mined!', result),
 * });
 * ```
 */
export function createAploMining(config: {
  url: string;
  timeout?: number;
  headers?: Record<string, string>;
}) {
  const provider = new HttpProvider(config);
  return new AploMining(provider);
}

export default AploClient;
