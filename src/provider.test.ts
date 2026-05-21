/**
 * Tests for HTTP Provider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpProvider } from './provider.js';
import { ProviderError, TimeoutError } from './errors.js';

describe('HttpProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create provider with URL', () => {
    const provider = new HttpProvider({ url: 'https://pub1.aplocoin.com' });
    expect(provider).toBeDefined();
  });

  it('should make JSON-RPC request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234',
      }),
    });
    global.fetch = mockFetch;

    const provider = new HttpProvider({ url: 'https://pub1.aplocoin.com' });
    const result = await provider.request<string>('eth_blockNumber');

    expect(result).toBe('0x1234');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://pub1.aplocoin.com',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('eth_blockNumber'),
      })
    );
  });

  it('should pass params in JSON-RPC request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: '0x0',
      }),
    });
    global.fetch = mockFetch;

    const provider = new HttpProvider({ url: 'https://pub1.aplocoin.com' });
    await provider.request('eth_getBalance', ['0x1234567890123456789012345678901234567890', 'latest']);

    const callBody = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string);
    expect(callBody.params).toEqual(['0x1234567890123456789012345678901234567890', 'latest']);
  });

  it('should throw ProviderError on JSON-RPC error response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Invalid request',
        },
      }),
    });
    global.fetch = mockFetch;

    const provider = new HttpProvider({ url: 'https://pub1.aplocoin.com' });
    
    await expect(provider.request('invalid_method')).rejects.toThrow(ProviderError);
    await expect(provider.request('invalid_method')).rejects.toThrow('Invalid request');
  });

  it('should throw ProviderError on HTTP error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    global.fetch = mockFetch;

    const provider = new HttpProvider({ url: 'https://pub1.aplocoin.com' });
    
    await expect(provider.request('eth_blockNumber')).rejects.toThrow(ProviderError);
  });

  it('should throw TimeoutError on timeout', async () => {
    const mockFetch = vi.fn().mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        }, 200);
      })
    );
    global.fetch = mockFetch;

    const provider = new HttpProvider({ url: 'https://pub1.aplocoin.com', timeout: 100 });
    
    await expect(provider.request('eth_blockNumber')).rejects.toThrow(TimeoutError);
  });

  it('should include custom headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234',
      }),
    });
    global.fetch = mockFetch;

    const provider = new HttpProvider({
      url: 'https://pub1.aplocoin.com',
      headers: { 'X-Custom-Header': 'test-value' },
    });
    await provider.request('eth_blockNumber');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://pub1.aplocoin.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom-Header': 'test-value',
        }),
      })
    );
  });

  it('should increment request ID for each request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234',
      }),
    });
    global.fetch = mockFetch;

    const provider = new HttpProvider({ url: 'https://pub1.aplocoin.com' });
    await provider.request('eth_blockNumber');
    await provider.request('eth_blockNumber');

    const firstCall = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string);
    const secondCall = JSON.parse(mockFetch.mock.calls[1]?.[1]?.body as string);

    expect(firstCall.id).toBe(1);
    expect(secondCall.id).toBe(2);
  });
});
