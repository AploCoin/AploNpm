# AploNpm API Examples

## Installation

```bash
npm install @aplocoin/aplonpm
# or
pnpm add @aplocoin/aplonpm
```

## Quick Start

### Create Client

```typescript
import { createAploClient, DEFAULT_RPC_ENDPOINTS } from '@aplocoin/aplonpm';

// Using default RPC endpoint
const client = createAploClient({
  url: DEFAULT_RPC_ENDPOINTS.pub1,
  timeout: 30000, // optional, default 30s
});

// Using custom RPC endpoint
const customClient = createAploClient({
  url: 'https://custom-rpc.aplocoin.com',
  headers: { 'X-API-Key': 'your-key' }, // optional
});
```

### Alternative: Manual Provider Setup

```typescript
import { HttpProvider, AploClient } from '@aplocoin/aplonpm';

const provider = new HttpProvider({
  url: 'https://pub1.aplocoin.com',
  timeout: 30000,
});

const client = new AploClient(provider);
```

## Core Operations

### Get Balance

```typescript
// Get balance in wei (bigint)
const balanceWei = await client.getBalance('0x1234567890123456789012345678901234567890');
console.log(balanceWei); // 1000000000000000000n

// Convert to APLO
import { fromWei } from '@aplocoin/aplonpm';
const balanceAplo = fromWei(balanceWei);
console.log(balanceAplo); // "1"

// Get balance at specific block
const pendingBalance = await client.getBalance(
  '0x1234567890123456789012345678901234567890',
  'pending'
);
```

### Get Transaction Count (Nonce)

```typescript
const nonce = await client.getTransactionCount('0x1234567890123456789012345678901234567890');
console.log(nonce); // 5

// Get pending nonce
const pendingNonce = await client.getTransactionCount(
  '0x1234567890123456789012345678901234567890',
  'pending'
);
```

### Get Gas Price

```typescript
const gasPrice = await client.getGasPrice();
console.log(gasPrice); // 1000000000n (1 gwei)

const gasPriceAplo = fromWei(gasPrice, 9); // gwei has 9 decimals
console.log(gasPriceAplo); // "1"
```

### Estimate Gas

```typescript
import { toWei } from '@aplocoin/aplonpm';

const gas = await client.estimateGas({
  from: '0x1234567890123456789012345678901234567890',
  to: '0x0987654321098765432109876543210987654321',
  value: toWei('1'), // 1 APLO
});

console.log(gas); // 21000n
```

### Send Transaction

```typescript
// Note: You need to sign the transaction first using web3 or ethers
// This example shows the raw transaction sending

const txHash = await client.sendRawTransaction(
  '0xf86c808504a817c800825208940987654321098765432109876543210987654321880de0b6b3a76400008025a0...'
);

console.log(txHash); // "0xabcdef..."
```

### Get Transaction Receipt

```typescript
const receipt = await client.getTransactionReceipt(
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
);

if (receipt) {
  console.log('Block:', receipt.blockNumber);
  console.log('Status:', receipt.status === 1n ? 'Success' : 'Failed');
  console.log('Gas used:', receipt.gasUsed);
  console.log('Logs:', receipt.logs);
} else {
  console.log('Transaction not found or pending');
}
```

### Get Chain Info

```typescript
// Get chain ID
const chainId = await client.getChainId();
console.log(chainId); // 1

// Get current block number
const blockNumber = await client.getBlockNumber();
console.log(blockNumber); // 12345678n
```

## Utility Functions

### Address Validation

```typescript
import { isAddress, validateAddress, InvalidAddressError } from '@aplocoin/aplonpm';

// Check if valid
if (isAddress('0x1234567890123456789012345678901234567890')) {
  console.log('Valid address');
}

// Validate and throw on error
try {
  const addr = validateAddress('0x1234567890123456789012345678901234567890');
  console.log('Valid:', addr);
} catch (error) {
  if (error instanceof InvalidAddressError) {
    console.error('Invalid address:', error.message);
  }
}
```

### Hex Validation

```typescript
import { isHex, validateHex, InvalidHexError } from '@aplocoin/aplonpm';

if (isHex('0x1234abcd')) {
  console.log('Valid hex');
}

try {
  const hex = validateHex('0x1234abcd');
} catch (error) {
  if (error instanceof InvalidHexError) {
    console.error('Invalid hex:', error.message);
  }
}
```

### Amount Conversion

```typescript
import { toWei, fromWei } from '@aplocoin/aplonpm';

// APLO to wei
const wei = toWei('1.5'); // 1.5 APLO
console.log(wei); // 1500000000000000000n

// Wei to APLO
const aplo = fromWei(1500000000000000000n);
console.log(aplo); // "1.5"

// Custom decimals (e.g., for gwei)
const gwei = fromWei(1000000000n, 9);
console.log(gwei); // "1"
```

### Private Key Formatting

```typescript
import { formatPrivateKey } from '@aplocoin/aplonpm';

// Add 0x prefix if missing
const key1 = formatPrivateKey('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
console.log(key1); // "0x1234567890abcdef..."

// Keep 0x prefix if present
const key2 = formatPrivateKey('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
console.log(key2); // "0x1234567890abcdef..."
```

### Hex Padding

```typescript
import { padHex } from '@aplocoin/aplonpm';

const padded = padHex('0x1', 4); // Pad to 4 bytes (8 hex chars)
console.log(padded); // "0x00000001"
```

## Error Handling

```typescript
import {
  ProviderError,
  InvalidAddressError,
  TimeoutError,
  TransactionError,
} from '@aplocoin/aplonpm';

try {
  const balance = await client.getBalance('invalid-address');
} catch (error) {
  if (error instanceof InvalidAddressError) {
    console.error('Invalid address format');
  } else if (error instanceof ProviderError) {
    console.error('RPC error:', error.message, 'Code:', error.code);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out');
  }
}
```

## TypeScript Types

```typescript
import type {
  Address,
  Hex,
  TransactionHash,
  TransactionRequest,
  TransactionReceipt,
  Provider,
  ProviderConfig,
  NetworkConfig,
} from '@aplocoin/aplonpm';

// Type-safe address
const myAddress: Address = '0x1234567890123456789012345678901234567890';

// Type-safe transaction request
const txRequest: TransactionRequest = {
  from: '0x1234567890123456789012345678901234567890',
  to: '0x0987654321098765432109876543210987654321',
  value: 1000000000000000000n,
  gas: 21000n,
  gasPrice: 1000000000n,
  nonce: 5,
};
```

## Browser Usage

```typescript
// Works in both Node.js and browser
import { createAploClient, DEFAULT_RPC_ENDPOINTS } from '@aplocoin/aplonpm';

const client = createAploClient({
  url: DEFAULT_RPC_ENDPOINTS.pub1,
});

// Use in React, Vue, etc.
async function fetchBalance(address: string) {
  try {
    const balance = await client.getBalance(address);
    return fromWei(balance);
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    return null;
  }
}
```

## Configuration

### Default RPC Endpoints

```typescript
import { DEFAULT_RPC_ENDPOINTS } from '@aplocoin/aplonpm';

console.log(DEFAULT_RPC_ENDPOINTS.pub1); // "https://pub1.aplocoin.com"
console.log(DEFAULT_RPC_ENDPOINTS.pub2); // "https://pub2.aplocoin.com"
```

### Custom Timeout

```typescript
const client = createAploClient({
  url: DEFAULT_RPC_ENDPOINTS.pub1,
  timeout: 60000, // 60 seconds
});
```

### Custom Headers

```typescript
const client = createAploClient({
  url: 'https://custom-rpc.aplocoin.com',
  headers: {
    'X-API-Key': 'your-api-key',
    'X-Custom-Header': 'value',
  },
});
```

## Testing

The library includes comprehensive test coverage. Run tests:

```bash
pnpm test        # Run all tests
pnpm test:watch  # Watch mode
pnpm typecheck   # Type checking
pnpm build       # Build package
```

## Next Steps

For contract interaction (staking, mining), see the upcoming contract modules that will build on top of this core client.

## Staking Operations

### Create Staking Client

```typescript
import { createAploStaking, DEFAULT_RPC_ENDPOINTS } from '@aplocoin/aplonpm';

// Using factory function
const staking = createAploStaking({
  url: DEFAULT_RPC_ENDPOINTS.pub1,
  timeout: 30000,
});

// Or with manual provider setup
import { HttpProvider, AploStaking } from '@aplocoin/aplonpm';

const provider = new HttpProvider({ url: DEFAULT_RPC_ENDPOINTS.pub1 });
const staking = new AploStaking(provider);
```

### Check Stake Status

```typescript
import { fromWei, MIN_STAKE_WEI } from '@aplocoin/aplonpm';

const address = '0x1234567890123456789012345678901234567890';

// Get staked amount in wei
const stakedWei = await staking.getStake(address);
console.log('Staked (wei):', stakedWei); // 1500000000000000000000n

// Convert to APLO
const stakedAplo = fromWei(stakedWei);
console.log('Staked (APLO):', stakedAplo); // "1500"

// Check minimum stake requirement
console.log('Min stake:', fromWei(MIN_STAKE_WEI)); // "1000"
```

### Get Staking Multiplier

```typescript
// Get multiplier (scaled by 10, e.g., 15 = 1.5x)
const multiplierRaw = await staking.getMultiplier(address);
console.log('Multiplier raw:', multiplierRaw); // 15n

// Convert to actual multiplier
const multiplier = Number(multiplierRaw) / 10;
console.log('Multiplier:', multiplier); // 1.5

// Tier examples:
// 1000-4999 APLO: 1.0x (multiplier = 10)
// 5000-9999 APLO: 1.2x (multiplier = 12)
// 10000+ APLO: 1.5x (multiplier = 15)
// Max tier: 1.7x (multiplier = 17)
```

### Check Mining Eligibility

```typescript
import { STAKING_CONTRACT_ADDRESS, MIN_STAKE_WEI } from '@aplocoin/aplonpm';

// Check if address can mine (has >= 1000 APLO staked)
const canMine = await staking.canMine(address);

if (canMine) {
  console.log('✓ Address can mine');
  const multiplier = await staking.getMultiplier(address);
  console.log(`Mining multiplier: ${Number(multiplier) / 10}x`);
} else {
  console.log('✗ Insufficient stake for mining');
  console.log(`Minimum required: ${fromWei(MIN_STAKE_WEI)} APLO`);
}

console.log('Staking contract:', STAKING_CONTRACT_ADDRESS);
// "0x0000000000000000000000000000000000001235"
```

### Encode Stake Transaction

```typescript
import { toWei } from '@aplocoin/aplonpm';

// Encode stake transaction data
const amountToStake = toWei('1500'); // 1500 APLO
const stakeData = staking.encodeStake(amountToStake);

console.log('Transaction data:', stakeData);
// "0xa694fc3a0000000000000000000000000000000000000000000000514594d4c000000000"

// Use with AploClient to send transaction
import { createAploClient, STAKING_CONTRACT_ADDRESS } from '@aplocoin/aplonpm';

const client = createAploClient({ url: DEFAULT_RPC_ENDPOINTS.pub1 });

// Estimate gas for stake transaction
const gasEstimate = await client.estimateGas({
  from: address,
  to: STAKING_CONTRACT_ADDRESS,
  data: stakeData,
});

console.log('Estimated gas:', gasEstimate);
```

### Encode Unstake Transaction

```typescript
// Encode unstake transaction data
const unstakeData = staking.encodeUnstake();

console.log('Unstake data:', unstakeData);
// "0x2e17de78"

// Estimate gas for unstake
const gasEstimate = await client.estimateGas({
  from: address,
  to: STAKING_CONTRACT_ADDRESS,
  data: unstakeData,
});
```

### Complete Staking Flow

```typescript
import {
  createAploClient,
  createAploStaking,
  DEFAULT_RPC_ENDPOINTS,
  STAKING_CONTRACT_ADDRESS,
  MIN_STAKE_WEI,
  toWei,
  fromWei,
} from '@aplocoin/aplonpm';

const client = createAploClient({ url: DEFAULT_RPC_ENDPOINTS.pub1 });
const staking = createAploStaking({ url: DEFAULT_RPC_ENDPOINTS.pub1 });

async function checkStakingStatus(address: string) {
  // Get current stake
  const stakedWei = await staking.getStake(address);
  const stakedAplo = fromWei(stakedWei);
  
  // Get multiplier
  const multiplierRaw = await staking.getMultiplier(address);
  const multiplier = Number(multiplierRaw) / 10;
  
  // Check mining eligibility
  const canMine = await staking.canMine(address);
  
  return {
    staked: stakedAplo,
    stakedWei,
    multiplier,
    canMine,
    minStake: fromWei(MIN_STAKE_WEI),
  };
}

async function prepareStakeTransaction(
  fromAddress: string,
  amountAplo: string
) {
  const amountWei = toWei(amountAplo);
  
  // Check if amount meets minimum
  if (amountWei < MIN_STAKE_WEI) {
    throw new Error(`Minimum stake is ${fromWei(MIN_STAKE_WEI)} APLO`);
  }
  
  // Encode transaction data
  const data = staking.encodeStake(amountWei);
  
  // Estimate gas
  const gas = await client.estimateGas({
    from: fromAddress,
    to: STAKING_CONTRACT_ADDRESS,
    data,
  });
  
  // Get gas price
  const gasPrice = await client.getGasPrice();
  
  // Get nonce
  const nonce = await client.getTransactionCount(fromAddress, 'pending');
  
  return {
    from: fromAddress,
    to: STAKING_CONTRACT_ADDRESS,
    data,
    gas,
    gasPrice,
    nonce,
  };
}

// Usage
const address = '0x1234567890123456789012345678901234567890';

// Check status
const status = await checkStakingStatus(address);
console.log('Staking status:', status);

// Prepare stake transaction
const stakeTx = await prepareStakeTransaction(address, '1500');
console.log('Ready to stake:', stakeTx);
// Note: You need to sign this transaction with a wallet/signer
```

### Error Handling

```typescript
import { InvalidAddressError, ProviderError } from '@aplocoin/aplonpm';

try {
  const stake = await staking.getStake('invalid-address');
} catch (error) {
  if (error instanceof InvalidAddressError) {
    console.error('Invalid address format');
  } else if (error instanceof ProviderError) {
    console.error('RPC error:', error.message);
  }
}
```

### TypeScript Types

```typescript
import type { Address, Hex } from '@aplocoin/aplonpm';

// Type-safe staking operations
async function getStakingInfo(address: Address): Promise<{
  stake: bigint;
  multiplier: bigint;
  canMine: boolean;
}> {
  const [stake, multiplier] = await Promise.all([
    staking.getStake(address),
    staking.getMultiplier(address),
  ]);
  
  const canMine = await staking.canMine(address);
  
  return { stake, multiplier, canMine };
}
```

## Browser Wallet Integration

### Quick Start with Browser Wallet

```typescript
import { createBrowserClient, getWalletStatus } from '@aplocoin/aplonpm';

// Check wallet status first
const status = await getWalletStatus();
if (!status.hasProvider) {
  console.error('Please install MetaMask or another Web3 wallet');
  return;
}

if (!status.connected) {
  console.log('Wallet not connected, will request connection...');
}

// Connect and create client
const { client, adapter, address } = await createBrowserClient();
console.log('Connected:', address);

// Get balance
const balance = await client.getBalance(address);
console.log('Balance:', balance);
```

### EIP-1193 Provider Adapter

Low-level adapter for direct wallet interaction:

```typescript
import { BrowserWalletAdapter, detectInjectedProvider } from '@aplocoin/aplonpm';

// Detect injected provider (MetaMask, Rainbow, etc.)
const provider = detectInjectedProvider();
if (!provider) {
  throw new Error('No wallet detected');
}

// Create adapter
const adapter = new BrowserWalletAdapter(provider);

// Connect wallet
const address = await adapter.connect();

// Get accounts
const accounts = await adapter.getAccounts();

// Get chain ID
const chainId = await adapter.getChainId();

// Switch chain
await adapter.switchChain(1); // Switch to Ethereum mainnet

// Send transaction
const hash = await adapter.sendTransaction({
  from: address,
  to: '0x...',
  value: '0x0',
  data: '0x...',
});

// Listen to events
adapter.on('accountsChanged', (accounts) => {
  console.log('Accounts changed:', accounts);
});

adapter.on('chainChanged', (chainId) => {
  console.log('Chain changed:', chainId);
});
```

### Browser Wallet with Staking

```typescript
import { createBrowserStaking, stakeAplo, unstakeAplo } from '@aplocoin/aplonpm';

// Create staking client with browser wallet
const { staking, adapter, address } = await createBrowserStaking();

// Check current stake
const currentStake = await staking.getStake(address);
console.log('Current stake:', currentStake);

// Check multiplier
const multiplier = await staking.getMultiplier(address);
console.log('Multiplier:', multiplier); // e.g., 15 = 1.5x

// Check if can mine
const canMine = await staking.canMine(address);
console.log('Can mine:', canMine);

// Stake tokens (high-level helper)
const stakeHash = await stakeAplo('1000'); // Stake 1000 APLO
console.log('Staking transaction:', stakeHash);

// Wait for confirmation
const receipt = await client.getTransactionReceipt(stakeHash);
console.log('Staking confirmed:', receipt.status === 1n);

// Unstake tokens (high-level helper)
const unstakeHash = await unstakeAplo();
console.log('Unstaking transaction:', unstakeHash);
```

### Browser Wallet with Mining

```typescript
import { createBrowserMining } from '@aplocoin/aplonpm';

// Create mining client with browser wallet
const { mining, adapter, address } = await createBrowserMining();

// Check if can mine (requires 1000+ APLO staked)
const canMine = await mining.canMine(address);
if (!canMine) {
  console.log('Need to stake at least 1000 APLO first');
  return;
}

// Get miner parameters
const params = await mining.getMinerParams(address);
console.log('Difficulty:', params.difficulty);
console.log('Reward:', params.reward);

// Note: Mining with browser wallet requires private key
// For security, mining should be done server-side or with explicit user consent
// Browser mining is primarily for testing/development

// Example: Mine once (requires private key - use with caution!)
// const privateKey = '0x...'; // User must provide this explicitly
// const result = await mining.mineOnce(privateKey, address);
// console.log('Mining result:', result);
```

### Send APLO Tokens

```typescript
import { sendAplo } from '@aplocoin/aplonpm';

// High-level helper for sending APLO
const hash = await sendAplo({
  to: '0x0987654321098765432109876543210987654321',
  amount: '100', // 100 APLO
});

console.log('Transaction sent:', hash);

// Or use adapter directly for more control
import { createBrowserClient } from '@aplocoin/aplonpm';

const { adapter, address } = await createBrowserClient();

const hash = await adapter.sendTransaction({
  from: address,
  to: '0x0987654321098765432109876543210987654321',
  value: '0x56bc75e2d63100000', // 100 APLO in wei (hex)
});
```

### React/Next.js Integration

SSR-safe imports for Next.js:

```typescript
'use client'; // Next.js 13+ client component

import { useEffect, useState } from 'react';
import { 
  getWalletStatus, 
  createBrowserClient,
  type Address 
} from '@aplocoin/aplonpm';

export function WalletConnect() {
  const [address, setAddress] = useState<Address | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);

  useEffect(() => {
    // Check wallet status on mount
    getWalletStatus().then(status => {
      if (status.connected && status.address) {
        setAddress(status.address);
      }
    });
  }, []);

  const connect = async () => {
    try {
      const { client, address } = await createBrowserClient();
      setAddress(address);
      
      const balance = await client.getBalance(address);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <div>
      {address ? (
        <div>
          <p>Connected: {address}</p>
          {balance && <p>Balance: {balance.toString()} wei</p>}
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Wagmi/RainbowKit Compatibility

The `BrowserWalletAdapter` is compatible with Wagmi connectors:

```typescript
import { BrowserWalletAdapter, detectInjectedProvider } from '@aplocoin/aplonpm';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Use with Wagmi
const config = createConfig({
  connectors: [injected()],
  // ... other config
});

// Or use AploNpm adapter directly
const provider = detectInjectedProvider();
if (provider) {
  const adapter = new BrowserWalletAdapter(provider);
  // adapter.request() is compatible with Wagmi's provider interface
}
```

### Error Handling

```typescript
import { 
  createBrowserClient, 
  ProviderError 
} from '@aplocoin/aplonpm';

try {
  const { client, address } = await createBrowserClient();
  // ... use client
} catch (error) {
  if (error instanceof ProviderError) {
    if (error.message.includes('No wallet provider detected')) {
      console.error('Please install MetaMask');
    } else if (error.message.includes('User rejected')) {
      console.error('User rejected connection');
    } else {
      console.error('Provider error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### TypeScript Types

```typescript
import type {
  EIP1193Provider,
  EIP1193TransactionRequest,
  BrowserWalletEvent,
  Address,
  Hex,
} from '@aplocoin/aplonpm';

// Custom provider wrapper
class CustomProvider implements EIP1193Provider {
  async request(args: { method: string; params?: unknown[] }): Promise<unknown> {
    // Custom implementation
  }
}

// Transaction builder
function buildTransaction(
  from: Address,
  to: Address,
  value: Hex
): EIP1193TransactionRequest {
  return { from, to, value };
}
```

