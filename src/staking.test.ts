/**
 * Tests for AploStaking client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AploStaking } from './staking.js';
import type { Provider } from './types.js';

describe('AploStaking', () => {
  let mockProvider: Provider;
  let staking: AploStaking;

  beforeEach(() => {
    mockProvider = {
      request: vi.fn(),
    };
    staking = new AploStaking(mockProvider);
  });

  describe('constructor', () => {
    it('should create instance with provider', () => {
      expect(staking).toBeInstanceOf(AploStaking);
    });
  });

  describe('getStake', () => {
    it('should return staked amount for address', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const stakedWei = '1500000000000000000000'; // 1500 APLO in wei
      
      vi.mocked(mockProvider.request).mockResolvedValueOnce(stakedWei);

      const result = await staking.getStake(address);

      expect(mockProvider.request).toHaveBeenCalledWith('eth_call', [
        {
          to: '0x0000000000000000000000000000000000001235',
          data: expect.stringMatching(/^0x7a766460/), // getStake(address) selector
        },
        'latest',
      ]);
      expect(result).toBe(BigInt(stakedWei));
    });

    it('should validate address format', async () => {
      await expect(staking.getStake('invalid')).rejects.toThrow('Invalid address');
    });
  });

  describe('getMultiplier', () => {
    it('should return multiplier for address', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const multiplierRaw = '0x000000000000000000000000000000000000000000000000000000000000000f'; // 15 (1.5x scaled by 10)
      
      vi.mocked(mockProvider.request).mockResolvedValueOnce(multiplierRaw);

      const result = await staking.getMultiplier(address);

      expect(mockProvider.request).toHaveBeenCalledWith('eth_call', [
        {
          to: '0x0000000000000000000000000000000000001235',
          data: expect.stringMatching(/^0x/),
        },
        'latest',
      ]);
      expect(result).toBe(15n);
    });
  });

  describe('canMine', () => {
    it('should return true when stake >= 1000 APLO', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const stakedWei = '1000000000000000000000'; // exactly 1000 APLO
      
      vi.mocked(mockProvider.request).mockResolvedValueOnce(stakedWei);

      const result = await staking.canMine(address);

      expect(result).toBe(true);
    });

    it('should return false when stake < 1000 APLO', async () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const stakedWei = '999999999999999999999'; // just under 1000 APLO
      
      vi.mocked(mockProvider.request).mockResolvedValueOnce(stakedWei);

      const result = await staking.canMine(address);

      expect(result).toBe(false);
    });
  });

  describe('encodeStake', () => {
    it('should encode stake transaction data', () => {
      const amount = BigInt('1500000000000000000000'); // 1500 APLO
      const data = staking.encodeStake(amount);

      expect(data).toMatch(/^0xa694fc3a/); // stake(uint256) selector
      expect(data.length).toBe(74); // 0x + 8 chars selector + 64 chars param
    });

    it('should encode minimum stake amount', () => {
      const amount = BigInt('1000000000000000000000'); // 1000 APLO
      const data = staking.encodeStake(amount);

      expect(data).toBe('0xa694fc3a00000000000000000000000000000000000000000000003635c9adc5dea00000');
    });
  });

  describe('encodeUnstake', () => {
    it('should encode unstake transaction data', () => {
      const data = staking.encodeUnstake();

      expect(data).toBe('0x2e17de78'); // unstake() selector
    });
  });
});
