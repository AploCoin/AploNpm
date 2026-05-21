/**
 * Tests for AploClient
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AploClient } from './client.js';
import type { Provider } from './types.js';
import { InvalidAddressError } from './errors.js';

describe('AploClient', () => {
  let mockProvider: Provider;

  beforeEach(() => {
    mockProvider = {
      request: vi.fn(),
    };
  });

  it('should create client with provider', () => {
    const client = new AploClient(mockProvider);
    expect(client).toBeDefined();
  });

  it('should get balance for address', async () => {
    const mockRequest = vi.fn().mockResolvedValue('0xde0b6b3a7640000'); // 1 APLO in wei
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const balance = await client.getBalance('0x1234567890123456789012345678901234567890');

    expect(balance).toBe(1000000000000000000n);
    expect(mockRequest).toHaveBeenCalledWith('eth_getBalance', [
      '0x1234567890123456789012345678901234567890',
      'latest',
    ]);
  });

  it('should get balance at specific block', async () => {
    const mockRequest = vi.fn().mockResolvedValue('0xde0b6b3a7640000');
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    await client.getBalance('0x1234567890123456789012345678901234567890', 'pending');

    expect(mockRequest).toHaveBeenCalledWith('eth_getBalance', [
      '0x1234567890123456789012345678901234567890',
      'pending',
    ]);
  });

  it('should throw InvalidAddressError for invalid address', async () => {
    const client = new AploClient(mockProvider);
    
    await expect(client.getBalance('invalid')).rejects.toThrow(InvalidAddressError);
    await expect(client.getBalance('0x123')).rejects.toThrow(InvalidAddressError);
  });

  it('should get transaction count (nonce)', async () => {
    const mockRequest = vi.fn().mockResolvedValue('0x5'); // 5 transactions
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const nonce = await client.getTransactionCount('0x1234567890123456789012345678901234567890');

    expect(nonce).toBe(5);
    expect(mockRequest).toHaveBeenCalledWith('eth_getTransactionCount', [
      '0x1234567890123456789012345678901234567890',
      'latest',
    ]);
  });

  it('should get gas price', async () => {
    const mockRequest = vi.fn().mockResolvedValue('0x3b9aca00'); // 1 gwei
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const gasPrice = await client.getGasPrice();

    expect(gasPrice).toBe(1000000000n);
    expect(mockRequest).toHaveBeenCalledWith('eth_gasPrice', []);
  });

  it('should estimate gas for transaction', async () => {
    const mockRequest = vi.fn().mockResolvedValue('0x5208'); // 21000 gas
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const gas = await client.estimateGas({
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      value: 1000000000000000000n,
    });

    expect(gas).toBe(21000n);
    expect(mockRequest).toHaveBeenCalledWith('eth_estimateGas', [
      {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '0xde0b6b3a7640000',
      },
    ]);
  });

  it('should send raw transaction', async () => {
    const mockRequest = vi.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const txHash = await client.sendRawTransaction('0xf86c808504a817c800825208940987654321098765432109876543210987654321880de0b6b3a76400008025a0...');

    expect(txHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    expect(mockRequest).toHaveBeenCalledWith('eth_sendRawTransaction', [
      '0xf86c808504a817c800825208940987654321098765432109876543210987654321880de0b6b3a76400008025a0...',
    ]);
  });

  it('should get transaction receipt', async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      blockNumber: '0x1',
      blockHash: '0xblockhash',
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      gasUsed: '0x5208',
      status: '0x1',
      logs: [],
    });
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const receipt = await client.getTransactionReceipt('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');

    expect(receipt).toBeDefined();
    expect(receipt?.transactionHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    expect(receipt?.blockNumber).toBe(1n);
    expect(receipt?.status).toBe(1n);
  });

  it('should return null for non-existent transaction receipt', async () => {
    const mockRequest = vi.fn().mockResolvedValue(null);
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const receipt = await client.getTransactionReceipt('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');

    expect(receipt).toBeNull();
  });

  it('should get chain ID', async () => {
    const mockRequest = vi.fn().mockResolvedValue('0x1'); // Mainnet
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const chainId = await client.getChainId();

    expect(chainId).toBe(1);
    expect(mockRequest).toHaveBeenCalledWith('eth_chainId', []);
  });

  it('should get block number', async () => {
    const mockRequest = vi.fn().mockResolvedValue('0x64'); // Block 100
    mockProvider.request = mockRequest;

    const client = new AploClient(mockProvider);
    const blockNumber = await client.getBlockNumber();

    expect(blockNumber).toBe(100n);
    expect(mockRequest).toHaveBeenCalledWith('eth_blockNumber', []);
  });
});
