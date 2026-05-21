/**
 * Browser helpers tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserProvider, createBrowserClient, getWalletStatus } from './browser-helpers.js';
import { BrowserWalletAdapter } from './browser-adapter.js';
import type { EIP1193Provider } from './browser-adapter.js';

describe('BrowserProvider', () => {
  let mockEIP1193Provider: EIP1193Provider;
  let adapter: BrowserWalletAdapter;
  let provider: BrowserProvider;

  beforeEach(() => {
    mockEIP1193Provider = {
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    adapter = new BrowserWalletAdapter(mockEIP1193Provider);
    provider = new BrowserProvider(adapter);
  });

  it('should implement Provider interface', async () => {
    const mockResult = '0x1234';
    vi.mocked(mockEIP1193Provider.request).mockResolvedValue(mockResult);

    const result = await provider.request('eth_blockNumber', []);

    expect(result).toBe(mockResult);
    expect(mockEIP1193Provider.request).toHaveBeenCalledWith({
      method: 'eth_blockNumber',
      params: [],
    });
  });

  it('should return underlying adapter', () => {
    const returnedAdapter = provider.getAdapter();
    expect(returnedAdapter).toBe(adapter);
  });
});

describe('createBrowserClient', () => {
  beforeEach(() => {
    // Clean up any existing window.ethereum
    // @ts-expect-error - test cleanup
    delete globalThis.window?.ethereum;
  });

  it('should throw error when no provider detected', async () => {
    await expect(createBrowserClient()).rejects.toThrow(
      'No wallet provider detected'
    );
  });

  it('should create client with connected wallet', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockEthereum = {
      request: vi.fn().mockResolvedValue([mockAddress]),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    // @ts-expect-error - adding ethereum to window for test
    globalThis.window = globalThis.window || {};
    // @ts-expect-error - adding ethereum to window for test
    globalThis.window.ethereum = mockEthereum;

    const { client, adapter, address } = await createBrowserClient();

    expect(address).toBe(mockAddress);
    expect(client).toBeDefined();
    expect(adapter).toBeInstanceOf(BrowserWalletAdapter);
    expect(mockEthereum.request).toHaveBeenCalledWith({
      method: 'eth_requestAccounts',
    });

    // Cleanup
    // @ts-expect-error - removing test property
    delete globalThis.window.ethereum;
  });
});

describe('getWalletStatus', () => {
  beforeEach(() => {
    // Clean up any existing window.ethereum
    // @ts-expect-error - test cleanup
    delete globalThis.window?.ethereum;
  });

  it('should return not connected when no provider', async () => {
    const status = await getWalletStatus();

    expect(status).toEqual({
      connected: false,
      hasProvider: false,
    });
  });

  it('should return not connected when no accounts', async () => {
    const mockEthereum = {
      request: vi.fn().mockResolvedValue([]),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    // @ts-expect-error - adding ethereum to window for test
    globalThis.window = globalThis.window || {};
    // @ts-expect-error - adding ethereum to window for test
    globalThis.window.ethereum = mockEthereum;

    const status = await getWalletStatus();

    expect(status).toEqual({
      connected: false,
      hasProvider: true,
    });

    // Cleanup
    // @ts-expect-error - removing test property
    delete globalThis.window.ethereum;
  });

  it('should return connected status with address and chainId', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockEthereum = {
      request: vi.fn()
        .mockResolvedValueOnce([mockAddress]) // eth_accounts
        .mockResolvedValueOnce('0x1'), // eth_chainId
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    // @ts-expect-error - adding ethereum to window for test
    globalThis.window = globalThis.window || {};
    // @ts-expect-error - adding ethereum to window for test
    globalThis.window.ethereum = mockEthereum;

    const status = await getWalletStatus();

    expect(status).toEqual({
      connected: true,
      address: mockAddress,
      chainId: 1,
      hasProvider: true,
    });

    // Cleanup
    // @ts-expect-error - removing test property
    delete globalThis.window.ethereum;
  });

  it('should handle errors gracefully', async () => {
    const mockEthereum = {
      request: vi.fn().mockRejectedValue(new Error('Provider error')),
      on: vi.fn(),
      removeListener: vi.fn(),
    };

    // @ts-expect-error - adding ethereum to window for test
    globalThis.window = globalThis.window || {};
    // @ts-expect-error - adding ethereum to window for test
    globalThis.window.ethereum = mockEthereum;

    const status = await getWalletStatus();

    expect(status).toEqual({
      connected: false,
      hasProvider: true,
    });

    // Cleanup
    // @ts-expect-error - removing test property
    delete globalThis.window.ethereum;
  });
});
