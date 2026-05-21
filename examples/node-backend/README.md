# Node.js Backend Examples

These examples demonstrate how to use AploNpm in Node.js backend applications.

## Prerequisites

```bash
npm install @aplocoin/aplonpm
# or
pnpm add @aplocoin/aplonpm
```

## Running Examples

All examples require a private key set as an environment variable:

```bash
export PRIVATE_KEY=0x1234567890abcdef...
node examples/node-backend/01-balance.ts
```

Or inline:

```bash
PRIVATE_KEY=0x1234... node examples/node-backend/02-send-transaction.ts
```

## Examples Overview

### 01-balance.ts
Get account balance and transaction count.

```bash
node examples/node-backend/01-balance.ts
```

**What it demonstrates:**
- Creating an AploClient
- Querying balance in wei and APLO
- Getting pending balance
- Getting transaction count (nonce)

### 02-send-transaction.ts
Send APLO tokens to another address.

```bash
PRIVATE_KEY=0x... node examples/node-backend/02-send-transaction.ts
```

**What it demonstrates:**
- Converting APLO to wei
- Creating and signing transactions
- Sending transactions
- Waiting for transaction receipts

### 03-staking.ts
Stake APLO tokens to enable mining.

```bash
PRIVATE_KEY=0x... node examples/node-backend/03-staking.ts
```

**What it demonstrates:**
- Checking current stake
- Getting staking multiplier
- Checking mining eligibility
- Staking tokens (minimum 1000 APLO)
- Encoding stake transactions

### 04-mining.ts
Mine APLO blocks.

```bash
PRIVATE_KEY=0x... node examples/node-backend/04-mining.ts
```

**What it demonstrates:**
- Checking mining eligibility
- Mining a single block
- Running continuous mining loop
- Handling mining results
- Using AbortController to stop mining

### 05-unstake.ts
Unstake APLO tokens.

```bash
PRIVATE_KEY=0x... node examples/node-backend/05-unstake.ts
```

**What it demonstrates:**
- Checking current stake
- Unstaking all tokens
- Verifying unstake result
- Checking mining eligibility after unstaking

## Security Notes

**NEVER hardcode private keys in your code!**

Use environment variables or secure key management solutions:

```typescript
// ✓ Good
const privateKey = process.env.PRIVATE_KEY;

// ✗ Bad
const privateKey = '0x1234...'; // Never do this!
```

For production applications, consider:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Environment-specific .env files (never committed to git)

## TypeScript Configuration

If you're using TypeScript, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## Error Handling

All examples include basic error handling. For production use, implement more robust error handling:

```typescript
import { AploError, ProviderError, TransactionError } from '@aplocoin/aplonpm';

try {
  await client.sendTransaction(privateKey, { ... });
} catch (error) {
  if (error instanceof TransactionError) {
    console.error('Transaction failed:', error.message);
  } else if (error instanceof ProviderError) {
    console.error('RPC error:', error.message);
  } else if (error instanceof AploError) {
    console.error('AploNpm error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```
