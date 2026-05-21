/**
 * Browser wallet integration helpers
 * High-level functions for common wallet operations
 */

import { BrowserWalletAdapter, detectInjectedProvider } from './browser-adapter.js';
import { AploClient } from './client.js';
import { AploStaking, STAKING_CONTRACT_ADDRESS } from './staking.js';
import { AploMining } from './mining.js';
import type { Provider, Address, Hex } from './types.js';
import { ProviderError } from './errors.js';

/**
 * Browser provider that wraps EIP-1193 adapter
 * Implements the Provider interface for use with AploClient
 */
export class BrowserProvider implements Provider {
  private adapter: BrowserWalletAdapter;

  constructor(adapter: BrowserWalletAdapter) {
    this.adapter = adapter;
  }

  async request<T = unknown>(method: string, params?: unknown[]): Promise<T> {
    return await this.adapter.request<T>(method, params);
  }

  /**
   * Get the underlying wallet adapter
   */
  getAdapter(): BrowserWalletAdapter {
    return this.adapter;
  }
}

/**
 * Create AploClient with browser wallet
 * 
 * @example
 * ```typescript
 * const client = await createBrowserClient();
 * const balance = await client.getBalance(address);
 * ```
 */
export async function createBrowserClient(): Promise<{
  client: AploClient;
  adapter: BrowserWalletAdapter;
  address: Address;
}> {
  const injectedProvider = detectInjectedProvider();
  if (!injectedProvider) {
    throw new ProviderError('No wallet provider detected. Please install MetaMask or another Web3 wallet.');
  }

  const adapter = new BrowserWalletAdapter(injectedProvider);
  const address = await adapter.connect();
  
  const provider = new BrowserProvider(adapter);
  const client = new AploClient(provider);

  return { client, adapter, address };
}

/**
 * Create AploStaking with browser wallet
 * 
 * @example
 * ```typescript
 * const { staking, address } = await createBrowserStaking();
 * const stake = await staking.getStake(address);
 * const canMine = await staking.canMine(address);
 * ```
 */
export async function createBrowserStaking(): Promise<{
  staking: AploStaking;
  adapter: BrowserWalletAdapter;
  address: Address;
}> {
  const injectedProvider = detectInjectedProvider();
  if (!injectedProvider) {
    throw new ProviderError('No wallet provider detected. Please install MetaMask or another Web3 wallet.');
  }

  const adapter = new BrowserWalletAdapter(injectedProvider);
  const address = await adapter.connect();
  
  const provider = new BrowserProvider(adapter);
  const staking = new AploStaking(provider);

  return { staking, adapter, address };
}

/**
 * Create AploMining with browser wallet
 * 
 * @example
 * ```typescript
 * const { mining, address } = await createBrowserMining();
 * 
 * // Check if can mine
 * const canMine = await mining.canMine(address);
 * if (!canMine) {
 *   console.log('Need to stake at least 1000 APLO first');
 * }
 * ```
 */
export async function createBrowserMining(): Promise<{
  mining: AploMining;
  adapter: BrowserWalletAdapter;
  address: Address;
}> {
  const injectedProvider = detectInjectedProvider();
  if (!injectedProvider) {
    throw new ProviderError('No wallet provider detected. Please install MetaMask or another Web3 wallet.');
  }

  const adapter = new BrowserWalletAdapter(injectedProvider);
  const address = await adapter.connect();
  
  const provider = new BrowserProvider(adapter);
  const mining = new AploMining(provider);

  return { mining, adapter, address };
}

/**
 * Send APLO tokens using browser wallet
 * 
 * @example
 * ```typescript
 * const hash = await sendAplo({
 *   to: '0x...',
 *   amount: '100', // in APLO
 * });
 * console.log('Transaction sent:', hash);
 * ```
 */
export async function sendAplo(params: {
  to: Address;
  amount: string;
}): Promise<Hex> {
  const { adapter, address } = await createBrowserClient();

  // Convert APLO to wei (18 decimals)
  const amountWei = BigInt(params.amount) * BigInt(10 ** 18);
  const valueHex = `0x${amountWei.toString(16)}` as Hex;

  const hash = await adapter.sendTransaction({
    from: address,
    to: params.to,
    value: valueHex,
  });

  return hash;
}

/**
 * Stake APLO tokens using browser wallet
 * 
 * @example
 * ```typescript
 * const hash = await stakeAplo('1000'); // Stake 1000 APLO
 * console.log('Staking transaction:', hash);
 * ```
 */
export async function stakeAplo(amount: string): Promise<Hex> {
  const { staking, adapter, address } = await createBrowserStaking();

  // Convert APLO to wei (18 decimals)
  const amountWei = BigInt(amount) * BigInt(10 ** 18);
  const stakeData = staking.encodeStake(amountWei);

  const hash = await adapter.sendTransaction({
    from: address,
    to: STAKING_CONTRACT_ADDRESS,
    data: stakeData,
    value: '0x0',
  });

  return hash;
}

/**
 * Unstake APLO tokens using browser wallet
 * 
 * @example
 * ```typescript
 * const hash = await unstakeAplo();
 * console.log('Unstaking transaction:', hash);
 * ```
 */
export async function unstakeAplo(): Promise<Hex> {
  const { staking, adapter, address } = await createBrowserStaking();

  const unstakeData = staking.encodeUnstake();

  const hash = await adapter.sendTransaction({
    from: address,
    to: STAKING_CONTRACT_ADDRESS,
    data: unstakeData,
    value: '0x0',
  });

  return hash;
}

/**
 * Get wallet connection status
 * 
 * @example
 * ```typescript
 * const status = await getWalletStatus();
 * if (status.connected) {
 *   console.log('Connected:', status.address);
 *   console.log('Chain:', status.chainId);
 * }
 * ```
 */
export async function getWalletStatus(): Promise<{
  connected: boolean;
  address?: Address;
  chainId?: number;
  hasProvider: boolean;
}> {
  const injectedProvider = detectInjectedProvider();
  
  if (!injectedProvider) {
    return { connected: false, hasProvider: false };
  }

  const adapter = new BrowserWalletAdapter(injectedProvider);
  
  try {
    const accounts = await adapter.getAccounts();
    if (accounts.length === 0) {
      return { connected: false, hasProvider: true };
    }

    const chainId = await adapter.getChainId();

    return {
      connected: true,
      address: accounts[0],
      chainId,
      hasProvider: true,
    };
  } catch (error) {
    return { connected: false, hasProvider: true };
  }
}
