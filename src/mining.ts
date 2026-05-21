/**
 * AploMining - Mining client for AploCoin
 * Ported from WebMiner with library-friendly API
 */

import type { Provider, Address, TransactionHash } from './types.js';
import { keccak256, encodePacked, padHex } from './utils.js';
import { MIN_STAKE_WEI } from './staking.js';

export const MINING_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000001234' as const;

const DEFAULT_DIFFICULTY = BigInt(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
);

// mine(bytes32) function selector
const MINE_SELECTOR = '0x4c03f1e8';

export interface MinerParams {
  lastBlock: bigint;
  currentDifficulty: bigint;
  totalMined: bigint;
  prevHash: bigint;
}

export interface MiningResult {
  nonce: bigint;
  hash: bigint;
  attempts: number;
}

export interface MiningSuccess {
  txHash: TransactionHash;
  nonce: bigint;
  hash: bigint;
  attempts: number;
}

export interface MiningOptions {
  maxAttempts?: number;
  signal?: AbortSignal;
  onProgress?: (progress: { attempts: number; currentNonce: bigint }) => void;
  checkStake?: boolean;
}

export interface MiningLoopOptions extends MiningOptions {
  onSuccess?: (result: MiningSuccess) => void;
  onError?: (error: Error) => void;
  retryDelay?: number;
  blockDelay?: number;
}

/**
 * AploMining client for mining APLO tokens
 */
export class AploMining {
  constructor(private provider: Provider) {}

  /**
   * Get mining parameters for an address
   */
  async getMinerParams(address: Address): Promise<MinerParams> {
    // miner_params(address) selector: 0x9b8c8b6a
    const selector = '0x9b8c8b6a';
    const encodedAddress = padHex(address.toLowerCase(), 64).slice(2);
    const data = selector + encodedAddress;

    const result = await this.provider.request('eth_call', [
      {
        to: MINING_CONTRACT_ADDRESS,
        data,
      },
      'latest',
    ]);

    // Handle both array and hex string responses
    let lastBlock: bigint;
    let difficulty: bigint;
    let totalMined: bigint;
    let prevHash: bigint;

    if (Array.isArray(result)) {
      // Array format from mock
      lastBlock = BigInt(result[0]);
      difficulty = BigInt(result[1]);
      totalMined = BigInt(result[2]);
      prevHash = BigInt(result[3]);
    } else {
      // Hex string format from real RPC
      const resultHex = result as string;
      lastBlock = BigInt('0x' + resultHex.slice(2, 66));
      difficulty = BigInt('0x' + resultHex.slice(66, 130));
      totalMined = BigInt('0x' + resultHex.slice(130, 194));
      prevHash = BigInt('0x' + resultHex.slice(194, 258));
    }

    return {
      lastBlock,
      currentDifficulty: difficulty === 0n ? DEFAULT_DIFFICULTY : difficulty,
      totalMined,
      prevHash,
    };
  }

  /**
   * Compute hash for a nonce and mining parameters
   * Matches WebMiner's hashNonce implementation
   */
  computeHash(
    nonce: bigint,
    address: Address,
    difficulty: bigint,
    prevHash: bigint,
    totalMined: bigint
  ): bigint {
    const packed = encodePacked(
      { type: 'address', value: address },
      { type: 'bytes32', value: padHex('0x' + nonce.toString(16), 64) },
      { type: 'uint256', value: difficulty.toString() },
      { type: 'uint256', value: prevHash.toString() },
      { type: 'uint256', value: totalMined.toString() }
    );

    const hash = keccak256(packed);
    return BigInt(hash);
  }

  /**
   * Generate a random nonce
   */
  private generateNonce(): bigint {
    const bytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // Node.js fallback
      const nodeCrypto = require('crypto');
      nodeCrypto.randomFillSync(bytes);
    }
    return BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  }

  /**
   * Find a valid nonce that satisfies the difficulty
   */
  async findValidNonce(
    address: Address,
    difficulty: bigint,
    prevHash: bigint,
    totalMined: bigint,
    options: MiningOptions = {}
  ): Promise<MiningResult | undefined> {
    const { maxAttempts = 100000, signal, onProgress } = options;
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (signal?.aborted) {
        return undefined;
      }

      const nonce = this.generateNonce();
      attempts++;

      const hash = this.computeHash(nonce, address, difficulty, prevHash, totalMined);

      if (onProgress && attempts % 10 === 0) {
        onProgress({ attempts, currentNonce: nonce });
      }

      if (hash < difficulty) {
        return { nonce, hash, attempts };
      }

      // Yield to event loop every 100 attempts
      if (attempts % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return undefined;
  }

  /**
   * Encode mine transaction data
   */
  encodeMineTransaction(nonce: bigint): string {
    const nonceHex = nonce.toString(16).padStart(64, '0');
    return MINE_SELECTOR + nonceHex;
  }

  /**
   * Submit mine transaction
   */
  async submitMineTransaction(
    nonce: bigint,
    privateKey: string,
    fromAddress: Address
  ): Promise<TransactionHash> {
    const data = this.encodeMineTransaction(nonce);

    // Estimate gas
    const gasEstimate = await this.provider.request('eth_estimateGas', [
      {
        from: fromAddress,
        to: MINING_CONTRACT_ADDRESS,
        data,
      },
    ]);

    // Get gas price
    const gasPrice = await this.provider.request('eth_gasPrice');

    // Get nonce
    const txNonce = await this.provider.request('eth_getTransactionCount', [fromAddress, 'pending']);

    // Ensure nonce is hex string
    const nonceHex = typeof txNonce === 'string' 
      ? txNonce 
      : '0x' + BigInt(txNonce as string | number).toString(16);

    // Build transaction
    const tx = {
      from: fromAddress,
      to: MINING_CONTRACT_ADDRESS,
      data,
      gas: '0x' + (BigInt(gasEstimate as string) + 1000n).toString(16),
      gasPrice: gasPrice as string,
      nonce: nonceHex,
    };

    // Sign transaction
    const { signTransaction } = await import('./crypto.js');
    const signedTx = await signTransaction(tx, privateKey);

    // Send raw transaction
    const txHash = await this.provider.request('eth_sendRawTransaction', [signedTx]);

    return txHash as TransactionHash;
  }

  /**
   * Check if address can mine (has sufficient stake)
   */
  async canMine(address: Address): Promise<boolean> {
    // getStake(address) selector: 0x7a766460
    const selector = '0x7a766460';
    const encodedAddress = padHex(address.toLowerCase(), 64).slice(2);
    const data = selector + encodedAddress;

    const STAKING_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000001235';

    const result = await this.provider.request('eth_call', [
      {
        to: STAKING_CONTRACT_ADDRESS,
        data,
      },
      'latest',
    ]);

    const stake = BigInt(result as string);
    return stake >= MIN_STAKE_WEI;
  }

  /**
   * Mine once: find nonce and submit transaction
   */
  async mineOnce(
    privateKey: string,
    fromAddress: Address,
    options: MiningOptions = {}
  ): Promise<MiningSuccess | undefined> {
    const { checkStake = false } = options;

    // Check stake if requested
    if (checkStake) {
      const canMine = await this.canMine(fromAddress);
      if (!canMine) {
        throw new Error('Insufficient stake to mine. Minimum 1000 APLO required.');
      }
    }

    // Get mining parameters
    const params = await this.getMinerParams(fromAddress);

    // Find valid nonce
    const result = await this.findValidNonce(
      fromAddress,
      params.currentDifficulty,
      params.prevHash,
      params.totalMined,
      options
    );

    if (!result) {
      return undefined;
    }

    // Submit transaction
    const txHash = await this.submitMineTransaction(result.nonce, privateKey, fromAddress);

    return {
      txHash,
      nonce: result.nonce,
      hash: result.hash,
      attempts: result.attempts,
    };
  }

  /**
   * Mine continuously in a loop
   */
  async mineLoop(
    privateKey: string,
    fromAddress: Address,
    options: MiningLoopOptions = {}
  ): Promise<void> {
    const {
      signal,
      onSuccess,
      onError,
      retryDelay = 5000,
      blockDelay = 10000,
      ...miningOptions
    } = options;

    while (!signal?.aborted) {
      try {
        const result = await this.mineOnce(privateKey, fromAddress, {
          ...miningOptions,
          signal,
        });

        if (result) {
          onSuccess?.(result);
          // Wait before next mining attempt
          await new Promise(resolve => setTimeout(resolve, blockDelay));
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

/**
 * Create AploMining client
 */
export function createAploMining(provider: Provider): AploMining {
  return new AploMining(provider);
}
