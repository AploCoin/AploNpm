# AploNpm

TypeScript library for AploCoin blockchain interaction - mining, staking, and wallet operations.

## Installation

```bash
npm install @aplocoin/aplonpm
# or
pnpm add @aplocoin/aplonpm
# or
yarn add @aplocoin/aplonpm
```

## Quick Start

```typescript
import { AploClient } from '@aplocoin/aplonpm';

// Initialize client with RPC endpoint
const client = new AploClient('https://pub1.aplocoin.com');

// Get RPC URL
console.log(client.getRpcUrl());
```

## Features

- ✅ TypeScript strict mode with full type definitions
- ✅ ESM and CommonJS support
- ✅ Tree-shakeable exports
- ✅ Comprehensive test coverage
- 🚧 Mining operations (coming soon)
- 🚧 Staking operations (coming soon)
- 🚧 Wallet management (coming soon)

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

## API Reference

### AploClient

Main client class for interacting with AploCoin blockchain.

#### Constructor

```typescript
new AploClient(rpcUrl: string)
```

**Parameters:**
- `rpcUrl` - RPC endpoint URL (e.g., 'https://pub1.aplocoin.com')

#### Methods

##### `getRpcUrl(): string`

Returns the configured RPC URL.

## License

MIT

## Contributing

Contributions are welcome! Please ensure all tests pass and follow the existing code style.

## Links

- [GitHub Repository](https://github.com/AploCoin/AploNpm)
- [AploCoin Website](https://aplocoin.com)
