/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  isAddress,
  validateAddress,
  isHex,
  validateHex,
  fromWei,
  toWei,
  formatPrivateKey,
  padHex,
} from './utils.js';
import { InvalidAddressError, InvalidHexError } from './errors.js';

describe('Address validation', () => {
  it('should validate correct addresses', () => {
    expect(isAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    expect(isAddress('0x1234567890123456789012345678901234567890')).toBe(true);
    expect(isAddress('0xAbCdEf1234567890123456789012345678901234')).toBe(true);
  });

  it('should reject invalid addresses', () => {
    expect(isAddress('0x123')).toBe(false);
    expect(isAddress('1234567890123456789012345678901234567890')).toBe(false);
    expect(isAddress('0xGGGG567890123456789012345678901234567890')).toBe(false);
    expect(isAddress('')).toBe(false);
  });

  it('should throw InvalidAddressError for invalid addresses', () => {
    expect(() => validateAddress('0x123')).toThrow(InvalidAddressError);
    expect(() => validateAddress('invalid')).toThrow(InvalidAddressError);
  });

  it('should return valid address', () => {
    const addr = '0x1234567890123456789012345678901234567890';
    expect(validateAddress(addr)).toBe(addr);
  });
});

describe('Hex validation', () => {
  it('should validate correct hex strings', () => {
    expect(isHex('0x')).toBe(true);
    expect(isHex('0x0')).toBe(true);
    expect(isHex('0x1234abcdef')).toBe(true);
    expect(isHex('0xABCDEF')).toBe(true);
  });

  it('should reject invalid hex strings', () => {
    expect(isHex('123')).toBe(false);
    expect(isHex('0xGG')).toBe(false);
    expect(isHex('')).toBe(false);
  });

  it('should throw InvalidHexError for invalid hex', () => {
    expect(() => validateHex('123')).toThrow(InvalidHexError);
    expect(() => validateHex('0xGG')).toThrow(InvalidHexError);
  });

  it('should return valid hex', () => {
    const hex = '0x1234abcd';
    expect(validateHex(hex)).toBe(hex);
  });
});

describe('Wei/APLO conversion', () => {
  it('should convert wei to APLO', () => {
    expect(fromWei(1000000000000000000n)).toBe('1');
    expect(fromWei(1500000000000000000n)).toBe('1.5');
    expect(fromWei(123456789012345678n)).toBe('0.123456789012345678');
    expect(fromWei(0n)).toBe('0');
  });

  it('should convert APLO to wei', () => {
    expect(toWei('1')).toBe(1000000000000000000n);
    expect(toWei('1.5')).toBe(1500000000000000000n);
    expect(toWei('0.123456789012345678')).toBe(123456789012345678n);
    expect(toWei('0')).toBe(0n);
  });

  it('should handle edge cases in conversion', () => {
    expect(toWei('1000')).toBe(1000000000000000000000n);
    expect(fromWei(1000000000000000000000n)).toBe('1000');
    
    // Trailing zeros should be trimmed
    expect(fromWei(1000000000000000000n)).toBe('1');
    
    // Leading zeros in fraction
    expect(toWei('0.001')).toBe(1000000000000000n);
    expect(fromWei(1000000000000000n)).toBe('0.001');
  });

  it('should round-trip correctly', () => {
    const values = ['1', '1.5', '0.123456789012345678', '1000', '0.001'];
    values.forEach(val => {
      expect(fromWei(toWei(val))).toBe(val);
    });
  });
});

describe('Private key formatting', () => {
  it('should format private key with 0x prefix', () => {
    const key = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(formatPrivateKey(key)).toBe(`0x${key}`);
  });

  it('should keep 0x prefix if already present', () => {
    const key = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(formatPrivateKey(key)).toBe(key);
  });

  it('should throw for invalid private key length', () => {
    expect(() => formatPrivateKey('0x123')).toThrow(InvalidHexError);
    expect(() => formatPrivateKey('123')).toThrow(InvalidHexError);
  });

  it('should throw for invalid hex characters', () => {
    expect(() => formatPrivateKey('GGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toThrow(InvalidHexError);
  });
});

describe('Hex padding', () => {
  it('should pad hex to specified byte length', () => {
    expect(padHex('0x1', 4)).toBe('0x00000001');
    expect(padHex('0xab', 4)).toBe('0x000000ab');
    expect(padHex('0x1234', 4)).toBe('0x00001234');
  });

  it('should not truncate if already longer', () => {
    expect(padHex('0x123456', 2)).toBe('0x123456');
  });

  it('should handle exact length', () => {
    expect(padHex('0x1234', 2)).toBe('0x1234');
  });
});
