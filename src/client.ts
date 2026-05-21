/**
 * AploClient - Main client for interacting with AploCoin blockchain
 */

import type { Provider, Address, TransactionRequest, TransactionReceipt, Hex } from './types.js';
import { validateAddress } from './utils.js';

/**
 * Block tag for specifying block position
 */
export type BlockTag = 'latest' | 'earliest' | 'pending';

/**
 * Main client class for AploCoin blockchain interaction
 */
export class AploClient {
  private provider: Provider;

  constructor(provider: Provider) {
    this.provider = provider;
  }

  /**
   * Get balance of an address in wei
   */
  async getBalance(address: string, blockTag: BlockTag = 'latest'): Promise<bigint> {
    const validAddress = validateAddress(address);
    const result = await this.provider.request<string>('eth_getBalance', [validAddress, blockTag]);
    return BigInt(result);
  }

  /**
   * Get transaction count (nonce) for an address
   */
  async getTransactionCount(address: string, blockTag: BlockTag = 'latest'): Promise<number> {
    const validAddress = validateAddress(address);
    const result = await this.provider.request<string>('eth_getTransactionCount', [validAddress, blockTag]);
    return parseInt(result, 16);
  }

  /**
   * Get current gas price in wei
   */
  async getGasPrice(): Promise<bigint> {
    const result = await this.provider.request<string>('eth_gasPrice', []);
    return BigInt(result);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    const txData: Record<string, string> = {
      from: tx.from,
    };

    if (tx.to) txData.to = tx.to;
    if (tx.data) txData.data = tx.data;
    if (tx.value !== undefined) txData.value = '0x' + tx.value.toString(16);
    if (tx.gas !== undefined) txData.gas = '0x' + tx.gas.toString(16);
    if (tx.gasPrice !== undefined) txData.gasPrice = '0x' + tx.gasPrice.toString(16);

    const result = await this.provider.request<string>('eth_estimateGas', [txData]);
    return BigInt(result);
  }

  /**
   * Send raw signed transaction
   */
  async sendRawTransaction(signedTx: string): Promise<Hex> {
    const result = await this.provider.request<string>('eth_sendRawTransaction', [signedTx]);
    return result as Hex;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    const result = await this.provider.request<any>('eth_getTransactionReceipt', [txHash]);
    
    if (!result) {
      return null;
    }

    return {
      transactionHash: result.transactionHash as Hex,
      blockNumber: BigInt(result.blockNumber),
      blockHash: result.blockHash as Hex,
      from: result.from as Address,
      to: result.to as Address | undefined,
      gasUsed: BigInt(result.gasUsed),
      status: BigInt(result.status),
      logs: result.logs.map((log: any) => ({
        address: log.address as Address,
        topics: log.topics as Hex[],
        data: log.data as Hex,
      })),
    };
  }

  /**
   * Get chain ID
   */
  async getChainId(): Promise<number> {
    const result = await this.provider.request<string>('eth_chainId', []);
    return parseInt(result, 16);
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<bigint> {
    const result = await this.provider.request<string>('eth_blockNumber', []);
    return BigInt(result);
  }
}
