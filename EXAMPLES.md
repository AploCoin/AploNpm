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

