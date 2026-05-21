/**
 * AploNpm - TypeScript library for AploCoin blockchain interaction
 * @packageDocumentation
 */

export const VERSION = '0.1.0';

/**
 * Main AploClient class for interacting with AploCoin blockchain
 */
export class AploClient {
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  /**
   * Get the configured RPC URL
   */
  getRpcUrl(): string {
    return this.rpcUrl;
  }
}

export default AploClient;
