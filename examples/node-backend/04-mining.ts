/**
 * Example: Mining operations
 * 
 * This example shows how to:
 * - Check mining eligibility
 * - Mine a single block
 * - Run continuous mining loop
 * - Handle mining results
 */

import { 
  createAploMining, 
  createAploStaking,
  DEFAULT_RPC_ENDPOINTS 
} from '@aplocoin/aplonpm';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable not set');
    console.error('Usage: PRIVATE_KEY=0x... node 04-mining.ts');
    process.exit(1);
  }

  const mining = createAploMining({
    url: DEFAULT_RPC_ENDPOINTS.pub1,
    timeout: 30000,
  });

  const staking = createAploStaking({
    url: DEFAULT_RPC_ENDPOINTS.pub1,
    timeout: 30000,
  });

  // Your mining address
  const myAddress = '0x1234567890123456789012345678901234567890';

  try {
    console.log('=== Checking Mining Eligibility ===');
    
    // Check if address can mine (requires staking)
    const canMine = await staking.canMine(myAddress);
    console.log('Can mine:', canMine);

    if (!canMine) {
      console.error('Error: Address cannot mine. Please stake at least 1000 APLO first.');
      console.error('See 03-staking.ts example for staking instructions.');
      process.exit(1);
    }

    // Get staking multiplier (affects mining rewards)
    const multiplier = await staking.getMultiplier(myAddress);
    console.log('Mining multiplier:', multiplier.toString());

    console.log('\n=== Mining Single Block ===');
    
    // Mine once
    const result = await mining.mineOnce(privateKey, myAddress);
    
    if (result.success) {
      console.log('✓ Mining successful!');
      console.log('Transaction hash:', result.txHash);
      console.log('Nonce found:', result.nonce);
      console.log('Attempts:', result.attempts);
    } else {
      console.log('✗ Mining failed');
      console.log('Error:', result.error);
    }

    console.log('\n=== Continuous Mining (10 seconds) ===');
    
    // Create abort controller for stopping the loop
    const controller = new AbortController();
    
    // Stop after 10 seconds
    setTimeout(() => {
      console.log('\nStopping mining...');
      controller.abort();
    }, 10000);

    let successCount = 0;
    let failCount = 0;

    // Start mining loop
    await mining.mineLoop(privateKey, myAddress, {
      signal: controller.signal,
      onSuccess: (result) => {
        successCount++;
        console.log(`✓ Block mined! Hash: ${result.txHash}, Attempts: ${result.attempts}`);
      },
      onError: (error) => {
        failCount++;
        console.error('✗ Mining error:', error.message);
      },
      delayMs: 1000, // Wait 1 second between attempts
    });

    console.log('\n=== Mining Summary ===');
    console.log('Successful blocks:', successCount);
    console.log('Failed attempts:', failCount);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
