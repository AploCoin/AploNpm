/**
 * Example: Send APLO transaction
 * 
 * This example shows how to:
 * - Create and sign a transaction
 * - Send APLO to another address
 * - Wait for transaction receipt
 */

import { createAploClient, toWei, DEFAULT_RPC_ENDPOINTS } from '@aplocoin/aplonpm';

async function main() {
  // IMPORTANT: Never hardcode private keys in production!
  // Use environment variables or secure key management
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable not set');
    console.error('Usage: PRIVATE_KEY=0x... node 02-send-transaction.ts');
    process.exit(1);
  }

  const client = createAploClient({
    url: DEFAULT_RPC_ENDPOINTS.pub1,
    timeout: 30000,
  });

  // Transaction parameters
  const toAddress = '0x0987654321098765432109876543210987654321';
  const amountAplo = '1.5'; // Send 1.5 APLO

  try {
    console.log('Preparing transaction...');
    console.log('To:', toAddress);
    console.log('Amount:', amountAplo, 'APLO');

    // Convert APLO to wei
    const valueWei = toWei(amountAplo);
    console.log('Value (wei):', valueWei.toString());

    // Send transaction
    const txHash = await client.sendTransaction(privateKey, {
      to: toAddress,
      value: valueWei,
      // Optional: specify gas limit and gas price
      // gas: 21000n,
      // gasPrice: await client.getGasPrice(),
    });

    console.log('Transaction sent!');
    console.log('Hash:', txHash);

    // Wait for transaction receipt
    console.log('Waiting for confirmation...');
    const receipt = await client.getTransactionReceipt(txHash);

    console.log('Transaction confirmed!');
    console.log('Block number:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Status:', receipt.status === 1n ? 'Success' : 'Failed');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
