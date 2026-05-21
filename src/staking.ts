/**
 * AploStaking - Client for APLO staking contract interactions
 */

import type { Provider, Address, Hex } from './types.js';
import { validateAddress } from './utils.js';

/**
 * Staking contract address
 */
export const STAKING_CONTRACT_ADDRESS: Address = '0x0000000000000000000000000000000000001235';

/**
 * Minimum stake required for mining (1000 APLO in wei)
 */
export const MIN_STAKE_WEI = BigInt('1000000000000000000000');

/**
 * Function selectors for staking contract
 */
const SELECTORS = {
  stake: '0xa694fc3a', // stake(uint256)
  unstake: '0x2e17de78', // unstake()
  getStake: '0x7a766460', // getStake(address)
  getMultiplier: '0x8e15f473', // getMultiplier(address)
} as const;

/**
 * Encode address parameter for contract call
 */
function encodeAddress(address: Address): Hex {
  const addr = address.slice(2); // remove 0x
  return `0x${addr.padStart(64, '0')}` as Hex;
}

/**
 * Encode uint256 parameter for contract call
 */
function encodeUint256(value: bigint): Hex {
  const hex = value.toString(16);
  return `0x${hex.padStart(64, '0')}` as Hex;
}

/**
 * AploStaking client for interacting with APLO staking contract
 */
export class AploStaking {
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  /**
   * Get staked amount for an address
   * @param address - Address to check
   * @returns Staked amount in wei
   */
  async getStake(address: string): Promise<bigint> {
    const validAddress = validateAddress(address);
    const data = (SELECTORS.getStake + encodeAddress(validAddress).slice(2)) as Hex;

    const result = await this.provider.request<string>('eth_call', [
      {
        to: STAKING_CONTRACT_ADDRESS,
        data,
      },
      'latest',
    ]);

    return BigInt(result);
  }

  /**
   * Get multiplier for an address (scaled by 10, e.g., 15 = 1.5x)
   * @param address - Address to check
   * @returns Multiplier value (scaled by 10)
   */
  async getMultiplier(address: string): Promise<bigint> {
    const validAddress = validateAddress(address);
    const data = (SELECTORS.getMultiplier + encodeAddress(validAddress).slice(2)) as Hex;

    const result = await this.provider.request<string>('eth_call', [
      {
        to: STAKING_CONTRACT_ADDRESS,
        data,
      },
      'latest',
    ]);

    return BigInt(result);
  }

  /**
   * Check if address has minimum stake required for mining
   * @param address - Address to check
   * @returns true if stake >= 1000 APLO
   */
  async canMine(address: string): Promise<boolean> {
    const stake = await this.getStake(address);
    return stake >= MIN_STAKE_WEI;
  }

  /**
   * Encode stake transaction data
   * @param amount - Amount to stake in wei
   * @returns Encoded transaction data
   */
  encodeStake(amount: bigint): Hex {
    return (SELECTORS.stake + encodeUint256(amount).slice(2)) as Hex;
  }

  /**
   * Encode unstake transaction data
   * @returns Encoded transaction data
   */
  encodeUnstake(): Hex {
    return SELECTORS.unstake as Hex;
  }
}
