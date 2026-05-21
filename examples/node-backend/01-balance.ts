/**
 * Example: Get account balance
 * 
 * This example shows how to:
 * - Create an AploClient
 * - Query account balance
 * - Convert between wei and APLO
 */

import { createAploClient, fromWei, DEFAULT_RPC_ENDPOINTS } from '@aplocoin/aplonpm';

async function main() {
  // Create client with default RPC endpoint
  const client = createAploClient({
    url: DEFAULT_RPC_ENDPOINTS.pub1,
    timeout: 30000,
  });

  // Example address (replace with your own)
  const address = '0x1234567890123456789012345678901234567890';

  try {
    // Get balance in wei (bigint)
    const balanceWei = await client.getBalance(address);
    console.log('Balance (wei):', balanceWei.toString());

    // Convert to APLO (string with 18 decimals)
    const balanceAplo = fromWei(balanceWei);
    console.log('Balance (APLO):', balanceAplo);

    // Get pending balance (includes unconfirmed transactions)
    const pendingBalance = await client.getBalance(address, 'pending');
    const pendingAplo = fromWei(pendingBalance);
    console.log('Pending balance (APLO):', pendingAplo);

    // Get transaction count (nonce)
    const nonce = await client.getTransactionCount(address);
    console.log('Transaction count:', nonce);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
