/**
 * Example: Unstaking tokens
 * 
 * This example shows how to:
 * - Check current stake
 * - Unstake all tokens
 * - Verify unstaking result
 */

import { 
  createAploClient, 
  createAploStaking, 
  fromWei,
  STAKING_CONTRACT_ADDRESS,
  DEFAULT_RPC_ENDPOINTS 
} from '@aplocoin/aplonpm';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable not set');
    console.error('Usage: PRIVATE_KEY=0x... node 05-unstake.ts');
    process.exit(1);
  }

  const client = createAploClient({
    url: DEFAULT_RPC_ENDPOINTS.pub1,
    timeout: 30000,
  });

  const staking = createAploStaking({
    url: DEFAULT_RPC_ENDPOINTS.pub1,
    timeout: 30000,
  });

  const myAddress = '0x1234567890123456789012345678901234567890';

  try {
    console.log('=== Checking Current Stake ===');
    
    const currentStake = await staking.getStake(myAddress);
    console.log('Current stake (wei):', currentStake.toString());
    console.log('Current stake (APLO):', fromWei(currentStake));

    if (currentStake === 0n) {
      console.log('No tokens staked. Nothing to unstake.');
      return;
    }

    console.log('\n=== Unstaking All Tokens ===');
    console.log('WARNING: After unstaking, you will not be able to mine until you stake again.');
    
    // Encode unstake transaction
    const unstakeData = staking.encodeUnstake();

    // Send unstake transaction
    const txHash = await client.sendTransaction(privateKey, {
      to: STAKING_CONTRACT_ADDRESS,
      data: unstakeData,
      value: 0n,
    });

    console.log('Unstake transaction sent:', txHash);
    console.log('Waiting for confirmation...');

    const receipt = await client.getTransactionReceipt(txHash);
    console.log('Unstake confirmed! Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());

    // Verify unstaking
    const newStake = await staking.getStake(myAddress);
    console.log('\n=== Verification ===');
    console.log('New stake (APLO):', fromWei(newStake));
    console.log('Unstaked amount (APLO):', fromWei(currentStake - newStake));

    // Check mining eligibility
    const canMine = await staking.canMine(myAddress);
    console.log('Can still mine:', canMine);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
