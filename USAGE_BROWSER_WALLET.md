# Browser Wallet Usage Guide

## Quick Start

```typescript
import { createBrowserClient, getWalletStatus } from '@aplocoin/aplonpm';

// Check wallet status
const status = await getWalletStatus();
if (!status.hasProvider) {
  alert('Please install MetaMask or another Web3 wallet');
  return;
}

// Connect and use
const { client, adapter, address } = await createBrowserClient();
console.log('Connected:', address);

const balance = await client.getBalance(address);
console.log('Balance:', balance);
```

## Rainbow/Wagmi Integration

### With Wagmi v2

```typescript
import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { BrowserWalletAdapter, detectInjectedProvider } from '@aplocoin/aplonpm';

// Standard Wagmi setup
const config = createConfig({
  chains: [mainnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
  },
});

// Use AploNpm adapter alongside Wagmi
function useAploWallet() {
  const provider = detectInjectedProvider();
  if (!provider) return null;
  
  return new BrowserWalletAdapter(provider);
}
```

### With RainbowKit

```typescript
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { BrowserWalletAdapter, detectInjectedProvider } from '@aplocoin/aplonpm';

const config = getDefaultConfig({
  appName: 'My AploCoin App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet],
});

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <YourApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Inside your component
function YourApp() {
  const [aploAdapter, setAploAdapter] = useState<BrowserWalletAdapter | null>(null);

  useEffect(() => {
    const provider = detectInjectedProvider();
    if (provider) {
      setAploAdapter(new BrowserWalletAdapter(provider));
    }
  }, []);

  const handleStake = async () => {
    if (!aploAdapter) return;
    
    const address = await aploAdapter.connect();
    // Use staking functions
    const { staking } = await createBrowserStaking();
    const stake = await staking.getStake(address);
    console.log('Current stake:', stake);
  };

  return <button onClick={handleStake}>Check Stake</button>;
}
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { 
  BrowserWalletAdapter, 
  detectInjectedProvider,
  createBrowserClient,
  type Address 
} from '@aplocoin/aplonpm';

export function useAploWallet() {
  const [adapter, setAdapter] = useState<BrowserWalletAdapter | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const provider = detectInjectedProvider();
    if (provider) {
      const walletAdapter = new BrowserWalletAdapter(provider);
      setAdapter(walletAdapter);

      // Listen for account changes
      walletAdapter.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0] as Address);
          setIsConnected(true);
        } else {
          setAddress(null);
          setIsConnected(false);
        }
      });

      // Check if already connected
      walletAdapter.getAccounts().then(accounts => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      });
    }
  }, []);

  const connect = async () => {
    if (!adapter) throw new Error('No wallet detected');
    const addr = await adapter.connect();
    setAddress(addr);
    setIsConnected(true);
    return addr;
  };

  return { adapter, address, isConnected, connect };
}

// Usage in component
function WalletButton() {
  const { address, isConnected, connect } = useAploWallet();

  if (isConnected) {
    return <div>Connected: {address}</div>;
  }

  return <button onClick={connect}>Connect Wallet</button>;
}
```

## Staking Example

```typescript
import { stakeAplo, unstakeAplo, createBrowserStaking } from '@aplocoin/aplonpm';

async function handleStaking() {
  // Check current stake
  const { staking, address } = await createBrowserStaking();
  const currentStake = await staking.getStake(address);
  
  if (currentStake === 0n) {
    // Stake 1000 APLO
    const hash = await stakeAplo('1000');
    console.log('Staking transaction:', hash);
  } else {
    // Unstake
    const hash = await unstakeAplo();
    console.log('Unstaking transaction:', hash);
  }
}
```

## Mining Progress Example

```typescript
import { createBrowserMining } from '@aplocoin/aplonpm';

async function checkMiningStatus() {
  const { mining, address } = await createBrowserMining();
  
  // Check if eligible to mine
  const canMine = await mining.canMine(address);
  if (!canMine) {
    console.log('Need to stake at least 1000 APLO first');
    return;
  }

  // Get mining parameters
  const params = await mining.getMinerParams(address);
  console.log('Difficulty:', params.difficulty);
  console.log('Reward:', params.reward);
  console.log('Last block time:', params.lastBlockTime);
}
```

## TypeScript Types

```typescript
import type {
  EIP1193Provider,
  EIP1193TransactionRequest,
  BrowserWalletEvent,
  Address,
  Hex,
} from '@aplocoin/aplonpm';

// Custom wallet integration
function createCustomWallet(provider: EIP1193Provider) {
  const adapter = new BrowserWalletAdapter(provider);
  return adapter;
}

// Transaction builder
function buildStakeTransaction(
  from: Address,
  amount: string
): EIP1193TransactionRequest {
  const { staking } = await createBrowserStaking();
  const data = staking.encodeStake(BigInt(amount) * BigInt(10 ** 18));
  
  return {
    from,
    to: STAKING_CONTRACT_ADDRESS,
    data,
    value: '0x0',
  };
}
```

## Error Handling

```typescript
import { ProviderError } from '@aplocoin/aplonpm';

try {
  const { client, address } = await createBrowserClient();
  // ... use client
} catch (error) {
  if (error instanceof ProviderError) {
    if (error.message.includes('No wallet provider detected')) {
      // Show install MetaMask prompt
    } else if (error.message.includes('User rejected')) {
      // User cancelled connection
    } else {
      // Other provider error
      console.error('Provider error:', error.message);
    }
  }
}
```

## Next.js 13+ App Router

```typescript
'use client'; // Required for client-side wallet interaction

import { useEffect, useState } from 'react';
import { getWalletStatus, createBrowserClient } from '@aplocoin/aplonpm';

export default function WalletPage() {
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    getWalletStatus().then(status => {
      if (status.connected && status.address) {
        setAddress(status.address);
      }
    });
  }, [mounted]);

  if (!mounted) return null; // Prevent SSR

  return (
    <div>
      {address ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={async () => {
          const { address } = await createBrowserClient();
          setAddress(address);
        }}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
```
