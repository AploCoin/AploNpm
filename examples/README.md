# AploNpm Examples

This directory contains practical examples demonstrating how to use AploNpm in different environments.

## Directory Structure

```
examples/
├── node-backend/          # Node.js backend examples
│   ├── 01-balance.ts      # Get account balance
│   ├── 02-send-transaction.ts  # Send APLO tokens
│   ├── 03-staking.ts      # Stake tokens
│   ├── 04-mining.ts       # Mine blocks
│   ├── 05-unstake.ts      # Unstake tokens
│   └── README.md          # Node.js examples guide
└── browser-frontend/      # Browser frontend examples
    ├── wallet-integration.html  # Complete HTML example
    ├── react-hook.tsx     # React hook for wallet integration
    └── README.md          # Browser examples guide
```

## Quick Start

### Node.js Backend

```bash
# Install dependencies
npm install @aplocoin/aplonpm

# Set your private key
export PRIVATE_KEY=0x...

# Run an example
node examples/node-backend/01-balance.ts
```

See [node-backend/README.md](./node-backend/README.md) for detailed instructions.

### Browser Frontend

```bash
# Serve the examples
npx serve examples/browser-frontend

# Open in browser
# http://localhost:3000/wallet-integration.html
```

See [browser-frontend/README.md](./browser-frontend/README.md) for detailed instructions.

## Example Categories

### Basic Operations
- **Balance checking**: Get account balance and transaction count
- **Sending transactions**: Transfer APLO tokens between addresses
- **Gas estimation**: Calculate transaction costs

### Staking
- **Check stake**: View current staked amount and multiplier
- **Stake tokens**: Lock APLO to enable mining (minimum 1000 APLO)
- **Unstake tokens**: Withdraw staked APLO

### Mining
- **Mining eligibility**: Check if address can mine
- **Single block mining**: Mine one block
- **Continuous mining**: Run mining loop with callbacks

### Browser Integration
- **Wallet connection**: Connect to MetaMask or compatible wallets
- **React hooks**: Custom hooks for wallet state management
- **Event handling**: Listen for account and chain changes

## Security Notes

### Node.js Examples
- **Never hardcode private keys** in production code
- Use environment variables: `process.env.PRIVATE_KEY`
- Consider using secure key management (AWS Secrets Manager, HashiCorp Vault)

### Browser Examples
- **Never ask users for private keys** in browser applications
- Use wallet signing capabilities (MetaMask, WalletConnect)
- Validate all user inputs before transactions

## Testing Examples

### Local Testing
All examples can be tested against a local AploCoin node:

```typescript
import { createAploClient } from '@aplocoin/aplonpm';

const client = createAploClient({
  url: 'http://localhost:8545', // Local node
  timeout: 30000,
});
```

### Testnet
For testing without real funds, use a testnet endpoint:

```typescript
const client = createAploClient({
  url: 'https://testnet.aplocoin.com', // Testnet
  timeout: 30000,
});
```

## Common Issues

### "Cannot find module '@aplocoin/aplonpm'"
- Ensure the package is installed: `npm install @aplocoin/aplonpm`
- Check you're in the correct directory
- For TypeScript, ensure `tsconfig.json` is configured correctly

### "No Web3 wallet detected"
- Install MetaMask or compatible wallet
- Refresh the page after installation
- Check browser console for errors

### "Transaction failed"
- Check account has sufficient balance
- Verify gas price is adequate
- Ensure network is not congested
- Check user didn't reject the transaction

## Contributing Examples

To add a new example:

1. Create a new file in the appropriate directory
2. Follow the existing example structure:
   - Clear comments explaining what the example does
   - Error handling
   - Console output for debugging
3. Update the relevant README.md
4. Test the example thoroughly

## Resources

- [Main Documentation](../README.md)
- [API Examples](../EXAMPLES.md)
- [Browser Wallet Guide](../USAGE_BROWSER_WALLET.md)
- [Release Process](../RELEASE.md)

## Support

If you encounter issues with the examples:

1. Check the [Common Issues](#common-issues) section
2. Review the example's README.md
3. Open an issue on GitHub with:
   - Example file name
   - Error message
   - Steps to reproduce
   - Environment (Node.js version, browser, OS)
