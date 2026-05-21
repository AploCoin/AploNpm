# AploNpm

TypeScript library for AploCoin blockchain interaction - mining, staking, and wallet operations.

[![CI](https://github.com/AploCoin/AploNpm/actions/workflows/ci.yml/badge.svg)](https://github.com/AploCoin/AploNpm/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@aplocoin%2Faplonpm.svg)](https://www.npmjs.com/package/@aplocoin/aplonpm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @aplocoin/aplonpm
# or
pnpm add @aplocoin/aplonpm
# or
yarn add @aplocoin/aplonpm
```

## Quick Start

### Node.js Backend

```typescript
import { createAploClient, DEFAULT_RPC_ENDPOINTS, fromWei } from '@aplocoin/aplonpm';

// Create client
const client = createAploClient({
  url: DEFAULT_RPC_ENDPOINTS.pub1,
  timeout: 30000,
});

// Get balance
const balance = await client.getBalance('0x...');
console.log('Balance:', fromWei(balance), 'APLO');

// Send transaction
const txHash = await client.sendTransaction(privateKey, {
  to: '0x...',
  value: toWei('1.5'), // Send 1.5 APLO
});
```

### Browser with Wallet

```typescript
import { detectInjectedProvider, createBrowserClient, sendAplo } from '@aplocoin/aplonpm';

// Detect MetaMask or compatible wallet
const provider = detectInjectedProvider();

// Request account access
await provider.request({ method: 'eth_requestAccounts' });

// Send transaction
const txHash = await sendAplo(provider, '0x...', '1.5');
```

## Features

- ✅ **Core Operations**: Balance, transactions, gas estimation
- ✅ **Staking**: Stake/unstake APLO, check multipliers
- ✅ **Mining**: Mine blocks with staking rewards
- ✅ **Browser Wallets**: MetaMask, Rainbow, WalletConnect support
- ✅ **TypeScript**: Full type definitions with strict mode
- ✅ **Dual Format**: ESM and CommonJS support
- ✅ **Tree-shakeable**: Optimized bundle size
- ✅ **Tested**: 99 tests with comprehensive coverage

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Build
pnpm build

# Lint
pnpm lint
```

### Package Manager Notes

This project uses **pnpm** as the primary package manager. If `dyno` is available in your environment, you can use it as an alternative. Standard npm/yarn commands also work.

## Project Structure

```
aplonpm/
├── src/
│   └── index.ts          # Main entry point
├── tests/
│   └── index.test.ts     # Test suite
├── dist/                 # Build output (ESM + CJS)
├── package.json
├── tsconfig.json
├── tsup.config.ts        # Build configuration
└── vitest.config.ts      # Test configuration
```

## Examples

Comprehensive examples for both Node.js and browser environments:

### Node.js Backend Examples
- [01-balance.ts](./examples/node-backend/01-balance.ts) - Get account balance
- [02-send-transaction.ts](./examples/node-backend/02-send-transaction.ts) - Send APLO tokens
- [03-staking.ts](./examples/node-backend/03-staking.ts) - Stake tokens for mining
- [04-mining.ts](./examples/node-backend/04-mining.ts) - Mine blocks
- [05-unstake.ts](./examples/node-backend/05-unstake.ts) - Unstake tokens

### Browser Frontend Examples
- [wallet-integration.html](./examples/browser-frontend/wallet-integration.html) - Complete wallet integration
- [react-hook.tsx](./examples/browser-frontend/react-hook.tsx) - React hook for wallet state

See [examples/README.md](./examples/README.md) for detailed usage instructions.

## Documentation

- **[EXAMPLES.md](./EXAMPLES.md)** - Complete API examples and usage patterns
- **[USAGE_BROWSER_WALLET.md](./USAGE_BROWSER_WALLET.md)** - Browser wallet integration guide
- **[RELEASE.md](./RELEASE.md)** - Release process and NPM publishing

## API Overview

### Core Client
```typescript
import { createAploClient, AploClient } from '@aplocoin/aplonpm';

const client = createAploClient({ url: 'https://pub1.aplocoin.com' });
await client.getBalance(address);
await client.sendTransaction(privateKey, { to, value });
await client.getTransactionReceipt(txHash);
```

### Staking
```typescript
import { createAploStaking, MIN_STAKE_WEI } from '@aplocoin/aplonpm';

const staking = createAploStaking({ url: 'https://pub1.aplocoin.com' });
await staking.getStake(address);
await staking.getMultiplier(address);
await staking.canMine(address);
```

### Mining
```typescript
import { createAploMining } from '@aplocoin/aplonpm';

const mining = createAploMining({ url: 'https://pub1.aplocoin.com' });
const result = await mining.mineOnce(privateKey, address);
await mining.mineLoop(privateKey, address, { onSuccess, onError });
```

### Browser Wallets
```typescript
import { detectInjectedProvider, sendAplo, stakeAplo } from '@aplocoin/aplonpm';

const provider = detectInjectedProvider();
await sendAplo(provider, toAddress, '1.5');
await stakeAplo(provider, '1000');
```

## CI/CD

This project uses GitHub Actions for continuous integration and deployment:

- **CI Workflow** (`.github/workflows/ci.yml`): Runs on every push and PR
  - Tests on Node.js 18.x, 20.x, 22.x
  - Type checking, linting, and testing
  - Build verification and package size check

- **Publish Workflow** (`.github/workflows/publish.yml`): Publishes to NPM
  - Triggered by version tags (`v1.0.0`) or manual dispatch
  - Automatic dist-tag detection (latest, beta, alpha)
  - NPM provenance attestations
  - GitHub Release creation

See [RELEASE.md](./RELEASE.md) for publishing instructions.

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- All tests pass: `pnpm test`
- Type checking passes: `pnpm run typecheck`
- Code is linted: `pnpm run lint`
- Examples are updated if API changes

## Links

- [GitHub Repository](https://github.com/AploCoin/AploNpm)
- [NPM Package](https://www.npmjs.com/package/@aplocoin/aplonpm)
- [AploCoin Website](https://aplocoin.com)
