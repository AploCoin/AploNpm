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
