# Browser Frontend Examples

These examples demonstrate how to use AploNpm in browser applications with Web3 wallets.

## Prerequisites

- MetaMask or compatible Web3 wallet installed
- Modern browser with ES modules support

## Installation

```bash
npm install @aplocoin/aplonpm
# or
pnpm add @aplocoin/aplonpm
```

## Examples Overview

### wallet-integration.html
Complete standalone HTML example with wallet connection, balance checking, sending, staking, and mining.

**Features:**
- Connect to MetaMask or compatible wallet
- Check account balance
- Send APLO transactions
- Stake and unstake tokens
- Check mining eligibility
- Event listeners for account/chain changes

**Usage:**
1. Serve the file with a local server (required for ES modules):
   ```bash
   npx serve examples/browser-frontend
   # or
   python3 -m http.server 8000
   ```
2. Open http://localhost:8000/wallet-integration.html
3. Click "Connect Wallet" and approve in MetaMask

### react-hook.tsx
Custom React hook for AploNpm integration.

**Features:**
- `useAploWallet()` hook with state management
- Auto-refresh on account changes
- Error handling
- TypeScript support

**Usage:**
```tsx
import { useAploWallet } from './react-hook';

function MyApp() {
  const wallet = useAploWallet();

  if (!wallet.isConnected) {
    return <button onClick={wallet.connect}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Account: {wallet.account}</p>
      <p>Balance: {wallet.balance} APLO</p>
      <p>Stake: {wallet.stake} APLO</p>
      <button onClick={wallet.refresh}>Refresh</button>
    </div>
  );
}
```

## Framework Integration

### Next.js 13+ (App Router)

```tsx
// app/providers.tsx
'use client';

import { createContext, useContext } from 'react';
import { useAploWallet } from './hooks/useAploWallet';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const wallet = useAploWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);

// app/layout.tsx
import { WalletProvider } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}

// app/page.tsx
'use client';

import { useWallet } from './providers';

export default function Home() {
  const wallet = useWallet();
  // Use wallet state...
}
```

### Vite + React

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// src/App.tsx
import { useAploWallet } from './hooks/useAploWallet';

function App() {
  const wallet = useAploWallet();
  
  return (
    <div>
      {!wallet.isConnected ? (
        <button onClick={wallet.connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {wallet.account}</p>
          <p>Balance: {wallet.balance} APLO</p>
        </div>
      )}
    </div>
  );
}

export default App;
```

## Wagmi Integration

AploNpm works with Wagmi v2 for advanced wallet management:

```tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { createBrowserClient } from '@aplocoin/aplonpm';

function MyComponent() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Use AploNpm with Wagmi's provider
  const client = createBrowserClient(window.ethereum);

  // Rest of your component...
}
```

See [USAGE_BROWSER_WALLET.md](../../USAGE_BROWSER_WALLET.md) for complete Wagmi examples.

## Security Best Practices

### 1. Never Expose Private Keys
Browser wallets handle private keys securely. Never ask users for private keys directly.

```tsx
// ✓ Good - Use wallet signing
const txHash = await sendAplo(provider, toAddress, amount);

// ✗ Bad - Never do this in browser
const txHash = await client.sendTransaction(privateKey, { ... });
```

### 2. Validate User Input
Always validate addresses and amounts before sending transactions:

```tsx
import { isAddress, toWei } from '@aplocoin/aplonpm';

function sendTransaction(to: string, amount: string) {
  if (!isAddress(to)) {
    throw new Error('Invalid address');
  }
  
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Invalid amount');
  }
  
  // Proceed with transaction...
}
```

### 3. Handle Errors Gracefully
Users may reject transactions or disconnect wallets:

```tsx
try {
  const txHash = await sendAplo(provider, to, amount);
  console.log('Success:', txHash);
} catch (error) {
  if (error.code === 4001) {
    // User rejected transaction
    console.log('Transaction cancelled by user');
  } else {
    console.error('Transaction failed:', error.message);
  }
}
```

### 4. Check Network
Ensure users are on the correct network:

```tsx
const chainId = await provider.request({ method: 'eth_chainId' });
if (chainId !== '0x...') { // Your AploCoin chain ID
  alert('Please switch to AploCoin network');
}
```

## Common Issues

### Module Not Found
If you get "Cannot find module '@aplocoin/aplonpm'":
- Ensure the package is installed: `npm install @aplocoin/aplonpm`
- Check your bundler configuration (Vite, Webpack, etc.)

### Provider Not Detected
If `detectInjectedProvider()` returns null:
- Ensure MetaMask or compatible wallet is installed
- Check browser console for errors
- Try refreshing the page after installing the wallet

### Transaction Fails
Common reasons:
- Insufficient balance
- Gas price too low
- User rejected transaction
- Network congestion

## Testing

For testing browser integration without a real wallet, use a mock provider:

```tsx
const mockProvider = {
  request: async ({ method, params }) => {
    if (method === 'eth_requestAccounts') {
      return ['0x1234...'];
    }
    // Mock other methods...
  },
  on: () => {},
  removeListener: () => {},
};

const client = createBrowserClient(mockProvider);
```

## Resources

- [USAGE_BROWSER_WALLET.md](../../USAGE_BROWSER_WALLET.md) - Complete browser wallet guide
- [EXAMPLES.md](../../EXAMPLES.md) - All API examples
- [MetaMask Documentation](https://docs.metamask.io/)
- [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) - Provider standard
