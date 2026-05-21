/**
 * React Hook Example: useAploWallet
 * 
 * This example shows how to create a custom React hook for AploNpm
 */

import { useState, useEffect, useCallback } from 'react';
import {
  detectInjectedProvider,
  createBrowserClient,
  createBrowserStaking,
  fromWei,
  type EIP1193Provider,
} from '@aplocoin/aplonpm';

interface WalletState {
  account: string | null;
  balance: string | null;
  stake: string | null;
  canMine: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAploWallet() {
  const [state, setState] = useState<WalletState>({
    account: null,
    balance: null,
    stake: null,
    canMine: false,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const [provider, setProvider] = useState<EIP1193Provider | null>(null);
  const [client, setClient] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  const [staking, setStaking] = useState<ReturnType<typeof createBrowserStaking> | null>(null);

  // Connect wallet
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const detectedProvider = detectInjectedProvider();
      if (!detectedProvider) {
        throw new Error('No Web3 wallet detected. Please install MetaMask.');
      }

      const accounts = await detectedProvider.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const browserClient = createBrowserClient(detectedProvider);
      const browserStaking = createBrowserStaking(detectedProvider);

      setProvider(detectedProvider);
      setClient(browserClient);
      setStaking(browserStaking);

      setState(prev => ({
        ...prev,
        account: accounts[0],
        isConnected: true,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      }));
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setProvider(null);
    setClient(null);
    setStaking(null);
    setState({
      account: null,
      balance: null,
      stake: null,
      canMine: false,
      isConnected: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Refresh wallet data
  const refresh = useCallback(async () => {
    if (!client || !staking || !state.account) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const [balanceWei, stakeWei, canMineResult] = await Promise.all([
        client.getBalance(state.account),
        staking.getStake(state.account),
        staking.canMine(state.account),
      ]);

      setState(prev => ({
        ...prev,
        balance: fromWei(balanceWei),
        stake: fromWei(stakeWei),
        canMine: canMineResult,
        isLoading: false,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      }));
    }
  }, [client, staking, state.account]);

  // Listen for account changes
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountList = accounts as string[];
      if (accountList.length === 0) {
        disconnect();
      } else {
        setState(prev => ({ ...prev, account: accountList[0] }));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider, disconnect]);

  // Auto-refresh data when account changes
  useEffect(() => {
    if (state.isConnected && state.account) {
      refresh();
    }
  }, [state.isConnected, state.account, refresh]);

  return {
    ...state,
    provider,
    client,
    staking,
    connect,
    disconnect,
    refresh,
  };
}

/**
 * Example usage in a React component:
 * 
 * function MyComponent() {
 *   const wallet = useAploWallet();
 * 
 *   return (
 *     <div>
 *       {!wallet.isConnected ? (
 *         <button onClick={wallet.connect}>Connect Wallet</button>
 *       ) : (
 *         <>
 *           <p>Account: {wallet.account}</p>
 *           <p>Balance: {wallet.balance} APLO</p>
 *           <p>Stake: {wallet.stake} APLO</p>
 *           <p>Can Mine: {wallet.canMine ? 'Yes' : 'No'}</p>
 *           <button onClick={wallet.refresh}>Refresh</button>
 *           <button onClick={wallet.disconnect}>Disconnect</button>
 *         </>
 *       )}
 *     </div>
 *   );
 * }
 */
