import { describe, it, expect } from 'vitest';
import { AploClient, VERSION, createAploClient, HttpProvider, DEFAULT_RPC_ENDPOINTS } from '../src/index';

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

  it('should export HttpProvider class', () => {
    expect(HttpProvider).toBeDefined();
    expect(typeof HttpProvider).toBe('function');
  });

  it('should export createAploClient factory function', () => {
    expect(createAploClient).toBeDefined();
    expect(typeof createAploClient).toBe('function');
  });

  it('should export DEFAULT_RPC_ENDPOINTS', () => {
    expect(DEFAULT_RPC_ENDPOINTS).toBeDefined();
    expect(DEFAULT_RPC_ENDPOINTS.pub1).toBe('https://pub1.aplocoin.com');
    expect(DEFAULT_RPC_ENDPOINTS.pub2).toBe('https://pub2.aplocoin.com');
  });

  it('should create AploClient instance with createAploClient', () => {
    const client = createAploClient({ url: 'https://pub1.aplocoin.com' });
    
    expect(client).toBeInstanceOf(AploClient);
  });
});

describe('TypeScript types', () => {
  it('should have proper type definitions', () => {
    const provider = new HttpProvider({ url: 'https://test.com' });
    const client = new AploClient(provider);
    
    // TypeScript should enforce proper types
    expect(client).toBeInstanceOf(AploClient);
  });
});
