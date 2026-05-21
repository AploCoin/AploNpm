/**
 * Browser wallet adapter for EIP-1193 providers
 * Compatible with MetaMask, Rainbow, WalletConnect, and other injected wallets
 */

import type { Address, Hex, TransactionHash } from './types.js';
import { ProviderError } from './errors.js';

/**
 * EIP-1193 Provider interface
 * @see https://eips.ethereum.org/EIPS/eip-1193
 */
export interface EIP1193Provider {
  request(_args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(_event: string, _handler: (..._args: unknown[]) => void): void;
  once?(_event: string, _handler: (..._args: unknown[]) => void): void;
  removeListener?(_event: string, _handler: (..._args: unknown[]) => void): void;
}

/**
 * EIP-1193 request arguments for transactions
 */
export interface EIP1193TransactionRequest {
  from: Address;
  to?: Address;
  value?: Hex;
  data?: Hex;
  gas?: Hex;
  gasPrice?: Hex;
  nonce?: Hex;
}

/**
 * Browser wallet adapter events
 */
export type BrowserWalletEvent = 'accountsChanged' | 'chainChanged' | 'connect' | 'disconnect';

/**
 * Browser wallet adapter for EIP-1193 compatible providers
 * 
 * @example
 * ```typescript
 * // With injected provider (MetaMask, Rainbow, etc.)
 * const adapter = new BrowserWalletAdapter(window.ethereum);
 * const address = await adapter.connect();
 * 
 * // Send transaction
 * const hash = await adapter.sendTransaction({
 *   from: address,
 *   to: '0x...',
 *   value: '0x0',
 * });
 * ```
 */
export class BrowserWalletAdapter {
  private provider: EIP1193Provider;

  constructor(provider: EIP1193Provider) {
    this.provider = provider;
  }

  /**
   * Connect to wallet and request account access
   * @returns First connected account address
   * @throws {ProviderError} If user rejects or no accounts available
   */
  async connect(): Promise<Address> {
    try {
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new ProviderError('No accounts available');
      }

      return accounts[0] as Address;
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new ProviderError(
        `Failed to connect: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get currently connected accounts
   * @returns Array of account addresses
   */
  async getAccounts(): Promise<Address[]> {
    const accounts = await this.provider.request({
      method: 'eth_accounts',
    }) as string[];

    return accounts as Address[];
  }

  /**
   * Get current chain ID
   * @returns Chain ID as number
   */
  async getChainId(): Promise<number> {
    const chainId = await this.provider.request({
      method: 'eth_chainId',
    }) as string | number;

    if (typeof chainId === 'number') {
      return chainId;
    }

    return parseInt(chainId, 16);
  }

  /**
   * Request chain switch
   * @param chainId Target chain ID
   * @throws {ProviderError} If chain not added (error code 4902)
   */
  async switchChain(chainId: number): Promise<void> {
    const hexChainId = `0x${chainId.toString(16)}`;

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (error) {
      // Re-throw with original error
      throw error;
    }
  }

  /**
   * Send transaction through wallet
   * @param tx Transaction request
   * @returns Transaction hash
   */
  async sendTransaction(tx: EIP1193TransactionRequest): Promise<TransactionHash> {
    const hash = await this.provider.request({
      method: 'eth_sendTransaction',
      params: [tx],
    }) as string;

    return hash as TransactionHash;
  }

  /**
   * Make arbitrary JSON-RPC request
   * @param method RPC method name
   * @param params RPC parameters
   * @returns RPC result
   */
  async request<T = unknown>(method: string, params?: unknown[]): Promise<T> {
    return await this.provider.request({
      method,
      params,
    }) as T;
  }

  /**
   * Register event listener
   * @param event Event name
   * @param handler Event handler
   */
  on(event: BrowserWalletEvent, handler: (..._args: unknown[]) => void): void {
    if (this.provider.on) {
      this.provider.on(event, handler);
    }
  }

  /**
   * Remove event listener
   * @param event Event name
   * @param handler Event handler
   */
  removeListener(event: BrowserWalletEvent, handler: (..._args: unknown[]) => void): void {
    if (this.provider.removeListener) {
      this.provider.removeListener(event, handler);
    }
  }
}

/**
 * Detect and return injected EIP-1193 provider
 * SSR-safe: returns null if window is not available
 * 
 * @example
 * ```typescript
 * const provider = detectInjectedProvider();
 * if (provider) {
 *   const adapter = new BrowserWalletAdapter(provider);
 *   await adapter.connect();
 * }
 * ```
 */
export function detectInjectedProvider(): EIP1193Provider | null {
  // SSR-safe: check if window exists
  const globalWindow = (globalThis as any).window;
  if (typeof globalWindow === 'undefined') {
    return null;
  }

  // Check for ethereum provider (MetaMask, Rainbow, etc.)
  if (globalWindow.ethereum) {
    return globalWindow.ethereum as EIP1193Provider;
  }

  return null;
}
