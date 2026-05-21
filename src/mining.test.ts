import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AploMining, MINING_CONTRACT_ADDRESS } from './mining.js';
import type { Provider } from './types.js';

describe('AploMining', () => {
  let mockProvider: Provider;
  let mining: AploMining;

  beforeEach(() => {
    mockProvider = {
      request: vi.fn(),
    } as Provider;
    mining = new AploMining(mockProvider);
  });

  describe('constants', () => {
    it('should export MINING_CONTRACT_ADDRESS', () => {
      expect(MINING_CONTRACT_ADDRESS).toBe('0x0000000000000000000000000000000000001234');
    });
  });

  describe('getMinerParams', () => {
    it('should fetch miner parameters for an address', async () => {
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const mockParams = [
        '0x64', // lastBlock = 100
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // difficulty
        '0x5', // totalMined = 5
        '0x123abc', // prevHash
      ];

      vi.mocked(mockProvider.request).mockResolvedValueOnce(mockParams);

      const result = await mining.getMinerParams(mockAddress);

      expect(mockProvider.request).toHaveBeenCalledWith('eth_call', [
        {
          to: MINING_CONTRACT_ADDRESS,
          data: expect.stringContaining('0x'), // miner_params(address) selector + encoded address
        },
        'latest',
      ]);

      expect(result).toEqual({
        lastBlock: 100n,
        currentDifficulty: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        totalMined: 5n,
        prevHash: BigInt('0x123abc'),
      });
    });

    it('should use DEFAULT_DIFFICULTY when difficulty is 0', async () => {
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const mockParams = [
        '0x0', // lastBlock = 0
        '0x0', // difficulty = 0 (should use default)
        '0x0', // totalMined = 0
        '0x0', // prevHash = 0
      ];

      vi.mocked(mockProvider.request).mockResolvedValueOnce(mockParams);

      const result = await mining.getMinerParams(mockAddress);

      expect(result.currentDifficulty).toBe(
        BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      );
    });
  });

  describe('computeHash', () => {
    it('should compute hash from nonce and mining parameters', () => {
      const nonce = BigInt('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const difficulty = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      const prevHash = BigInt('0x123abc');
      const totalMined = 5n;

      const hash = mining.computeHash(nonce, address, difficulty, prevHash, totalMined);

      expect(typeof hash).toBe('bigint');
      expect(hash).toBeGreaterThan(0n);
    });

    it('should produce different hashes for different nonces', () => {
      const nonce1 = BigInt('0x1111111111111111111111111111111111111111111111111111111111111111');
      const nonce2 = BigInt('0x2222222222222222222222222222222222222222222222222222222222222222');
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const difficulty = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      const prevHash = BigInt('0x123abc');
      const totalMined = 5n;

      const hash1 = mining.computeHash(nonce1, address, difficulty, prevHash, totalMined);
      const hash2 = mining.computeHash(nonce2, address, difficulty, prevHash, totalMined);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('findValidNonce', () => {
    it('should find a nonce that satisfies difficulty', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      // Very high difficulty (easy to satisfy)
      const difficulty = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      const prevHash = BigInt('0x123abc');
      const totalMined = 5n;

      const result = await mining.findValidNonce(
        address,
        difficulty,
        prevHash,
        totalMined,
        { maxAttempts: 1000 }
      );

      expect(result).toBeDefined();
      expect(result!.nonce).toBeGreaterThan(0n);
      expect(result!.hash).toBeLessThan(difficulty);
      expect(result!.attempts).toBeGreaterThan(0);
    });

    it('should return undefined when maxAttempts is reached', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      // Impossible difficulty
      const difficulty = BigInt('0x1');
      const prevHash = BigInt('0x123abc');
      const totalMined = 5n;

      const result = await mining.findValidNonce(
        address,
        difficulty,
        prevHash,
        totalMined,
        { maxAttempts: 10 }
      );

      expect(result).toBeUndefined();
    });

    it('should call onProgress callback during search', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      // Use a very low difficulty (hard to find) to ensure multiple attempts
      const difficulty = BigInt('0x1');
      const prevHash = BigInt('0x123abc');
      const totalMined = 5n;
      const onProgress = vi.fn();

      // Will not find a valid nonce, but will call onProgress
      await mining.findValidNonce(
        address,
        difficulty,
        prevHash,
        totalMined,
        { maxAttempts: 100, onProgress }
      );

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress.mock.calls[0][0]).toMatchObject({
        attempts: expect.any(Number),
        currentNonce: expect.any(BigInt),
      });
    });

    it('should respect cancellation signal', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const difficulty = BigInt('0x1'); // Impossible
      const prevHash = BigInt('0x123abc');
      const totalMined = 5n;
      const abortController = new AbortController();

      // Cancel after 50ms
      setTimeout(() => abortController.abort(), 50);

      const result = await mining.findValidNonce(
        address,
        difficulty,
        prevHash,
        totalMined,
        { maxAttempts: 1000000, signal: abortController.signal }
      );

      expect(result).toBeUndefined();
    });
  });

  describe('encodeMineTransaction', () => {
    it('should encode mine transaction data', () => {
      const nonce = BigInt('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

      const data = mining.encodeMineTransaction(nonce);

      expect(data).toMatch(/^0x[0-9a-f]+$/);
      // Should start with mine(bytes32) selector
      expect(data.slice(0, 10)).toBe('0x4c03f1e8'); // mine(bytes32) selector
      // Should be 74 chars: 0x (2) + selector (8) + padded nonce (64)
      expect(data.length).toBe(74);
    });
  });

  describe('submitMineTransaction', () => {
    it('should submit mine transaction with valid nonce', async () => {
      const nonce = BigInt('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fromAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      // Mock gas estimation
      vi.mocked(mockProvider.request)
        .mockResolvedValueOnce('0x5208') // eth_estimateGas
        .mockResolvedValueOnce('0x3b9aca00') // eth_gasPrice
        .mockResolvedValueOnce('0x1') // eth_getTransactionCount
        .mockResolvedValueOnce('0xabcdef1234567890'); // eth_sendRawTransaction

      const txHash = await mining.submitMineTransaction(nonce, privateKey, fromAddress);

      expect(txHash).toBe('0xabcdef1234567890');
      expect(mockProvider.request).toHaveBeenCalledWith(
        'eth_estimateGas',
        expect.any(Array)
      );
      expect(mockProvider.request).toHaveBeenCalledWith(
        'eth_sendRawTransaction',
        expect.any(Array)
      );
    });
  });

  describe('canMine', () => {
    it('should check if address can mine based on stake', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const minStakeWei = BigInt('1000000000000000000000'); // 1000 APLO

      // Mock getStake call returning sufficient stake
      vi.mocked(mockProvider.request).mockResolvedValueOnce(
        '0x' + minStakeWei.toString(16)
      );

      const result = await mining.canMine(address);

      expect(result).toBe(true);
    });

    it('should return false when stake is insufficient', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const insufficientStake = BigInt('500000000000000000000'); // 500 APLO

      vi.mocked(mockProvider.request).mockResolvedValueOnce(
        '0x' + insufficientStake.toString(16)
      );

      const result = await mining.canMine(address);

      expect(result).toBe(false);
    });
  });

  describe('mineOnce', () => {
    it('should mine once and submit transaction when valid nonce found', async () => {
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fromAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      // Mock getMinerParams
      const mockParams = [
        '0x64', // lastBlock = 100
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // difficulty
        '0x5', // totalMined = 5
        '0x123abc', // prevHash
      ];
      vi.mocked(mockProvider.request)
        .mockResolvedValueOnce(mockParams) // getMinerParams
        .mockResolvedValueOnce('0x5208') // eth_estimateGas
        .mockResolvedValueOnce('0x3b9aca00') // eth_gasPrice
        .mockResolvedValueOnce('0x1') // eth_getTransactionCount
        .mockResolvedValueOnce('0xabcdef1234567890'); // eth_sendRawTransaction

      const result = await mining.mineOnce(privateKey, fromAddress, {
        maxAttempts: 1000,
      });

      expect(result).toBeDefined();
      expect(result!.txHash).toBe('0xabcdef1234567890');
      expect(result!.nonce).toBeGreaterThan(0n);
      expect(result!.attempts).toBeGreaterThan(0);
    });

    it('should return undefined when no valid nonce found', async () => {
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fromAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      // Mock getMinerParams with impossible difficulty
      const mockParams = [
        '0x64',
        '0x1', // Impossible difficulty
        '0x5',
        '0x123abc',
      ];
      vi.mocked(mockProvider.request).mockResolvedValueOnce(mockParams);

      const result = await mining.mineOnce(privateKey, fromAddress, {
        maxAttempts: 10,
      });

      expect(result).toBeUndefined();
    });

    it('should throw error when stake is insufficient', async () => {
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fromAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

      // Mock canMine (getStake) returning insufficient stake
      vi.mocked(mockProvider.request).mockResolvedValueOnce('0x0'); // getStake returns 0

      await expect(
        mining.mineOnce(privateKey, fromAddress, { checkStake: true })
      ).rejects.toThrow('Insufficient stake');
    });
  });

  describe('mineLoop', () => {
    it('should mine continuously until stopped', async () => {
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fromAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const abortController = new AbortController();
      const onSuccess = vi.fn();

      // Mock successful mining
      const mockParams = ['0x64', '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '0x5', '0x123abc'];
      vi.mocked(mockProvider.request)
        .mockResolvedValueOnce(mockParams) // getMinerParams
        .mockResolvedValueOnce('0x5208') // eth_estimateGas
        .mockResolvedValueOnce('0x3b9aca00') // eth_gasPrice
        .mockResolvedValueOnce('0x1') // eth_getTransactionCount
        .mockResolvedValueOnce('0xabcdef1234567890'); // eth_sendRawTransaction

      // Stop after first success
      onSuccess.mockImplementation(() => {
        abortController.abort();
      });

      await mining.mineLoop(privateKey, fromAddress, {
        signal: abortController.signal,
        onSuccess,
        maxAttempts: 1000,
        blockDelay: 0, // No delay for test
      });

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          txHash: expect.any(String),
          nonce: expect.any(BigInt),
        })
      );
    });

    it('should handle errors and continue mining', async () => {
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fromAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const abortController = new AbortController();
      const onError = vi.fn();
      let callCount = 0;

      vi.mocked(mockProvider.request).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Network error');
        }
        abortController.abort();
        return Promise.resolve(['0x64', '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', '0x5', '0x123abc']);
      });

      await mining.mineLoop(privateKey, fromAddress, {
        signal: abortController.signal,
        onError,
        retryDelay: 100,
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
