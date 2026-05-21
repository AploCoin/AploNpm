/**
 * Example: Staking operations
 * 
 * This example shows how to:
 * - Check staking status
 * - Stake APLO tokens
 * - Unstake tokens
 * - Check mining eligibility
 */

import { 
  createAploClient, 
  createAploStaking, 
  toWei, 
  fromWei,
  MIN_STAKE_WEI,
  DEFAULT_RPC_ENDPOINTS 
} from '@aplocoin/aplonpm';

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable not set');
    console.error('Usage: PRIVATE_KEY=0x... node 03-staking.ts');
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

  // Derive address from private key (you need to implement this or use a library)
  // For this example, we'll use a placeholder
  const myAddress = '0x1234567890123456789012345678901234567890';

  try {
    console.log('=== Checking Staking Status ===');
    
    // Get current stake
    const currentStake = await staking.getStake(myAddress);
    console.log('Current stake (wei):', currentStake.toString());
    console.log('Current stake (APLO):', fromWei(currentStake));

    // Get staking multiplier
    const multiplier = await staking.getMultiplier(myAddress);
    console.log('Staking multiplier:', multiplier.toString());

    // Check if can mine
    const canMine = await staking.canMine(myAddress);
    console.log('Can mine:', canMine);

    // Minimum stake requirement
    console.log('Minimum stake required (APLO):', fromWei(MIN_STAKE_WEI));

    console.log('\n=== Staking Tokens ===');
    
    // Stake 1000 APLO (minimum required)
    const stakeAmount = toWei('1000');
    console.log('Staking amount:', fromWei(stakeAmount), 'APLO');

    const stakeTxHash = await client.sendTransaction(privateKey, {
      to: await staking.getStake(myAddress).then(() => '0x0000000000000000000000000000000000001235'), // Staking contract
      data: staking.encodeStake(stakeAmount),
      value: 0n,
    });

    console.log('Stake transaction sent:', stakeTxHash);
    console.log('Waiting for confirmation...');
    
    const stakeReceipt = await client.getTransactionReceipt(stakeTxHash);
    console.log('Stake confirmed! Block:', stakeReceipt.blockNumber);

    // Verify new stake
    const newStake = await staking.getStake(myAddress);
    console.log('New stake (APLO):', fromWei(newStake));

    console.log('\n=== Unstaking (example - commented out) ===');
    console.log('// To unstake, use:');
    console.log('// const unstakeTxHash = await client.sendTransaction(privateKey, {');
    console.log('//   to: STAKING_CONTRACT_ADDRESS,');
    console.log('//   data: staking.encodeUnstake(),');
    console.log('//   value: 0n,');
    console.log('// });');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
