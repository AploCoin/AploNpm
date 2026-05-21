/**
 * Utility functions for address, hex, and amount conversions
 */

import { InvalidAddressError, InvalidHexError } from './errors.js';
import type { Address, Hex } from './types.js';

/**
 * Validates if a string is a valid Ethereum address
 */
export function isAddress(value: string): value is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

/**
 * Validates and returns an address, throws if invalid
 */
export function validateAddress(value: string): Address {
  if (!isAddress(value)) {
    throw new InvalidAddressError(value);
  }
  return value;
}

/**
 * Validates if a string is a valid hex string
 */
export function isHex(value: string): value is Hex {
  return /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Validates and returns a hex string, throws if invalid
 */
export function validateHex(value: string): Hex {
  if (!isHex(value)) {
    throw new InvalidHexError(value);
  }
  return value;
}

/**
 * Converts wei (bigint) to APLO (string with decimals)
 * 1 APLO = 10^18 wei
 */
export function fromWei(wei: bigint, decimals: number = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const remainder = wei % divisor;
  
  if (remainder === 0n) {
    return whole.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  return `${whole}.${trimmed}`;
}

/**
 * Converts APLO (string with decimals) to wei (bigint)
 * 1 APLO = 10^18 wei
 */
export function toWei(aplo: string, decimals: number = 18): bigint {
  const parts = aplo.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  
  const wholeBigInt = BigInt(whole) * (10n ** BigInt(decimals));
  const fractionBigInt = BigInt(fraction);
  
  return wholeBigInt + fractionBigInt;
}

/**
 * Formats a private key to ensure 0x prefix
 */
export function formatPrivateKey(key: string): Hex {
  const cleaned = key.startsWith('0x') ? key : `0x${key}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(cleaned)) {
    throw new InvalidHexError(key);
  }
  return cleaned as Hex;
}

/**
 * Pads hex string to specified byte length
 */
export function padHex(hex: Hex, byteLength: number): Hex {
  const cleaned = hex.slice(2);
  const targetLength = byteLength * 2;
  if (cleaned.length >= targetLength) {
    return hex;
  }
  return `0x${cleaned.padStart(targetLength, '0')}` as Hex;
}
