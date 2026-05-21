/**
 * Custom error classes for AploNpm
 */

/**
 * Base error class for all AploNpm errors
 */
export class AploError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AploError';
  }
}

/**
 * Error thrown when provider request fails
 */
export class ProviderError extends AploError {
  constructor(
    message: string,
    public readonly _code?: number,
    public readonly _data?: unknown
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Error thrown when address validation fails
 */
export class InvalidAddressError extends AploError {
  constructor(address: string) {
    super(`Invalid address: ${address}`);
    this.name = 'InvalidAddressError';
  }
}

/**
 * Error thrown when hex string validation fails
 */
export class InvalidHexError extends AploError {
  constructor(hex: string) {
    super(`Invalid hex string: ${hex}`);
    this.name = 'InvalidHexError';
  }
}

/**
 * Error thrown when transaction fails
 */
export class TransactionError extends AploError {
  constructor(
    message: string,
    public readonly _transactionHash?: string
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Error thrown when network request times out
 */
export class TimeoutError extends AploError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}
