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
export function padHex(hex: string, byteLength: number): string {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const targetLength = byteLength * 2;
  if (cleaned.length >= targetLength) {
    return '0x' + cleaned;
  }
  return `0x${cleaned.padStart(targetLength, '0')}`;
}

/**
 * Keccak256 hash function
 */
export function keccak256(data: string): string {
  // Use native crypto if available, otherwise use a library
  if (typeof require !== 'undefined') {
    try {
      const { keccak256: keccakNode } = require('ethereum-cryptography/keccak');
      const bytes = hexToBytes(data);
      const hash = keccakNode(bytes);
      return '0x' + Buffer.from(hash).toString('hex');
    } catch {
      // Fallback to js-sha3
      const { keccak_256 } = require('js-sha3');
      const bytes = hexToBytes(data);
      return '0x' + keccak_256(bytes);
    }
  }
  throw new Error('keccak256 not available in this environment');
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Encode packed data (similar to Solidity's abi.encodePacked)
 */
export function encodePacked(
  ...args: Array<{ type: string; value: string }>
): string {
  let result = '0x';
  
  for (const arg of args) {
    const { type, value } = arg;
    
    if (type === 'address') {
      // Address: 20 bytes, no padding
      const cleaned = value.toLowerCase().replace('0x', '');
      result += cleaned.padStart(40, '0');
    } else if (type === 'bytes32') {
      // Bytes32: 32 bytes
      const cleaned = value.replace('0x', '');
      result += cleaned.padStart(64, '0');
    } else if (type === 'uint256') {
      // Uint256: 32 bytes
      const bn = BigInt(value);
      const hex = bn.toString(16);
      result += hex.padStart(64, '0');
    } else {
      throw new Error(`Unsupported type: ${type}`);
    }
  }
  
  return result;
}
