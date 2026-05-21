import { describe, it, expect } from 'vitest';
import {
  VERSION,
  AploClient,
  AploStaking,
  HttpProvider,
  createAploClient,
  createAploStaking,
  DEFAULT_RPC_ENDPOINTS,
  STAKING_CONTRACT_ADDRESS,
  MIN_STAKE_WEI,
  isAddress,
  validateAddress,
  fromWei,
  toWei,
} from '../src/index.js';

describe('Package exports', () => {
  it('should export VERSION', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('should export AploClient class', () => {
    expect(AploClient).toBeDefined();
    expect(typeof AploClient).toBe('function');
  });

  it('should export AploStaking class', () => {
    expect(AploStaking).toBeDefined();
    expect(typeof AploStaking).toBe('function');
  });

  it('should export HttpProvider class', () => {
    expect(HttpProvider).toBeDefined();
    expect(typeof HttpProvider).toBe('function');
  });

  it('should export createAploClient factory', () => {
    expect(createAploClient).toBeDefined();
    expect(typeof createAploClient).toBe('function');
  });

  it('should export createAploStaking factory', () => {
    expect(createAploStaking).toBeDefined();
    expect(typeof createAploStaking).toBe('function');
  });

  it('should export DEFAULT_RPC_ENDPOINTS', () => {
    expect(DEFAULT_RPC_ENDPOINTS).toEqual({
      pub1: 'https://pub1.aplocoin.com',
      pub2: 'https://pub2.aplocoin.com',
    });
  });

  it('should export staking constants', () => {
    expect(STAKING_CONTRACT_ADDRESS).toBe('0x0000000000000000000000000000000000001235');
    expect(MIN_STAKE_WEI).toBe(BigInt('1000000000000000000000'));
  });

  it('should export utility functions', () => {
    expect(isAddress).toBeDefined();
    expect(validateAddress).toBeDefined();
    expect(fromWei).toBeDefined();
    expect(toWei).toBeDefined();
  });
});
