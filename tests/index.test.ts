import { describe, it, expect } from 'vitest';
import { AploClient, VERSION } from '../src/index';

describe('Package exports', () => {
  it('should export VERSION constant', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should export AploClient class', () => {
    expect(AploClient).toBeDefined();
    expect(typeof AploClient).toBe('function');
  });

  it('should create AploClient instance with RPC URL', () => {
    const rpcUrl = 'https://pub1.aplocoin.com';
    const client = new AploClient(rpcUrl);
    
    expect(client).toBeInstanceOf(AploClient);
    expect(client.getRpcUrl()).toBe(rpcUrl);
  });
});

describe('TypeScript types', () => {
  it('should have proper type definitions', () => {
    const client = new AploClient('https://test.com');
    
    // TypeScript should enforce string type for RPC URL
    const url: string = client.getRpcUrl();
    expect(url).toBe('https://test.com');
  });
});
