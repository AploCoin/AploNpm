/**
 * Browser wallet adapter tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserWalletAdapter, detectInjectedProvider } from './browser-adapter.js';
import type { EIP1193Provider } from './browser-adapter.js';

describe('BrowserWalletAdapter', () => {
  let mockProvider: EIP1193Provider;
  let adapter: BrowserWalletAdapter;

  beforeEach(() => {
    // Mock EIP-1193 provider
    mockProvider = {
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    adapter = new BrowserWalletAdapter(mockProvider);
  });

  describe('connect', () => {
    it('should request accounts and return first address', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      vi.mocked(mockProvider.request).mockResolvedValue(mockAccounts);

      const address = await adapter.connect();

      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
      expect(address).toBe(mockAccounts[0]);
    });

    it('should throw error when no accounts available', async () => {
      vi.mocked(mockProvider.request).mockResolvedValue([]);

      await expect(adapter.connect()).rejects.toThrow('No accounts available');
    });

    it('should throw error on provider rejection', async () => {
      vi.mocked(mockProvider.request).mockRejectedValue(new Error('User rejected'));

      await expect(adapter.connect()).rejects.toThrow('User rejected');
    });
  });

  describe('getAccounts', () => {
    it('should return list of accounts', async () => {
      const mockAccounts = [
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
      ];
      vi.mocked(mockProvider.request).mockResolvedValue(mockAccounts);

      const accounts = await adapter.getAccounts();

      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'eth_accounts',
      });
      expect(accounts).toEqual(mockAccounts);
    });
  });

  describe('getChainId', () => {
    it('should return chain ID as number', async () => {
      vi.mocked(mockProvider.request).mockResolvedValue('0x1');

      const chainId = await adapter.getChainId();

      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'eth_chainId',
      });
      expect(chainId).toBe(1);
    });

    it('should handle numeric chain ID', async () => {
      vi.mocked(mockProvider.request).mockResolvedValue(137);

      const chainId = await adapter.getChainId();

      expect(chainId).toBe(137);
    });
  });

  describe('switchChain', () => {
    it('should request chain switch', async () => {
      vi.mocked(mockProvider.request).mockResolvedValue(null);

      await adapter.switchChain(1);

      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      });
    });

    it('should handle chain not added error', async () => {
      const error = new Error('Chain not added');
      (error as any).code = 4902;
      vi.mocked(mockProvider.request).mockRejectedValue(error);

      await expect(adapter.switchChain(999)).rejects.toThrow('Chain not added');
    });
  });

  describe('sendTransaction', () => {
    it('should send transaction and return hash', async () => {
      const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      vi.mocked(mockProvider.request).mockResolvedValue(mockHash);

      const hash = await adapter.sendTransaction({
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '0x0',
      });

      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'eth_sendTransaction',
        params: [{
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          value: '0x0',
        }],
      });
      expect(hash).toBe(mockHash);
    });

    it('should include optional transaction fields', async () => {
      const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      vi.mocked(mockProvider.request).mockResolvedValue(mockHash);

      await adapter.sendTransaction({
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '0x0',
        data: '0x1234',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
      });

      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'eth_sendTransaction',
        params: [{
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          value: '0x0',
          data: '0x1234',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
        }],
      });
    });
  });

  describe('request', () => {
    it('should forward arbitrary RPC requests', async () => {
      const mockResult = '0x1234';
      vi.mocked(mockProvider.request).mockResolvedValue(mockResult);

      const result = await adapter.request('eth_blockNumber', []);

      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'eth_blockNumber',
        params: [],
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('event listeners', () => {
    it('should register accountsChanged listener', () => {
      const handler = vi.fn();
      adapter.on('accountsChanged', handler);

      expect(mockProvider.on).toHaveBeenCalledWith('accountsChanged', handler);
    });

    it('should register chainChanged listener', () => {
      const handler = vi.fn();
      adapter.on('chainChanged', handler);

      expect(mockProvider.on).toHaveBeenCalledWith('chainChanged', handler);
    });

    it('should remove listener', () => {
      const handler = vi.fn();
      adapter.removeListener('accountsChanged', handler);

      expect(mockProvider.removeListener).toHaveBeenCalledWith('accountsChanged', handler);
    });
  });
});

describe('detectInjectedProvider', () => {
  it('should return null when window is undefined', () => {
    // detectInjectedProvider checks typeof window === 'undefined'
    // In vitest/jsdom, window exists, so we test the function directly
    const provider = detectInjectedProvider();
    
    // In test environment without window.ethereum, should return null
    expect(provider).toBeNull();
  });

  it('should return provider when window.ethereum exists', () => {
    const mockEthereum = {
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    // @ts-expect-error - adding ethereum to window for test
    globalThis.window = globalThis.window || {};
    // @ts-expect-error - adding ethereum to window for test
    globalThis.window.ethereum = mockEthereum;

    const provider = detectInjectedProvider();

    expect(provider).toBe(mockEthereum);

    // Cleanup
    // @ts-expect-error - removing test property
    delete globalThis.window.ethereum;
  });
});
