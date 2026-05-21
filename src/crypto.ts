/**
 * Cryptographic utilities for transaction signing
 */

import { formatPrivateKey } from './utils.js';

interface Transaction {
  from: string;
  to: string;
  data: string;
  gas: string;
  gasPrice: string;
  nonce: string;
  value?: string;
}

/**
 * Sign a transaction with a private key
 * Returns the raw signed transaction hex string
 */
export async function signTransaction(
  tx: Transaction,
  privateKey: string
): Promise<string> {
  const formattedKey = formatPrivateKey(privateKey);
  
  // Use ethereum-cryptography for signing
  if (typeof require !== 'undefined') {
    try {
      const { secp256k1 } = require('ethereum-cryptography/secp256k1');
      const { keccak256 } = require('ethereum-cryptography/keccak');
      const { RLP } = require('@ethereumjs/rlp');
      
      // Convert hex strings to buffers for RLP encoding
      const toBuffer = (hex: string): Buffer => {
        if (typeof hex === 'bigint') {
          throw new Error(`toBuffer received bigint: ${hex}. All transaction fields must be hex strings.`);
        }
        if (typeof hex !== 'string') {
          throw new Error(`toBuffer received ${typeof hex}: ${hex}. Expected hex string.`);
        }
        const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
        return Buffer.from(cleaned, 'hex');
      };
      
      // Build legacy transaction
      const txArray = [
        toBuffer(tx.nonce),
        toBuffer(tx.gasPrice),
        toBuffer(tx.gas),
        toBuffer(tx.to),
        toBuffer(tx.value || '0x0'),
        toBuffer(tx.data),
      ];
      
      // RLP encode for signing
      const rlpEncoded = RLP.encode(txArray);
      
      // Ensure rlpEncoded is a Buffer
      const rlpBuffer = Buffer.isBuffer(rlpEncoded) ? rlpEncoded : Buffer.from(rlpEncoded);
      const msgHash = keccak256(rlpBuffer);
      
      // Sign
      const privateKeyBytes = Buffer.from(formattedKey.slice(2), 'hex');
      const signature = secp256k1.sign(msgHash, privateKeyBytes);
      
      // Add v, r, s to transaction
      const v = signature.recovery + 27; // Legacy chain ID
      
      // Convert signature r and s to buffers (they might be Uint8Array or bigint)
      const r = signature.r instanceof Uint8Array 
        ? Buffer.from(signature.r) 
        : Buffer.from(signature.r.toString(16).padStart(64, '0'), 'hex');
      const s = signature.s instanceof Uint8Array 
        ? Buffer.from(signature.s) 
        : Buffer.from(signature.s.toString(16).padStart(64, '0'), 'hex');
      
      const signedTxArray = [
        toBuffer(tx.nonce),
        toBuffer(tx.gasPrice),
        toBuffer(tx.gas),
        toBuffer(tx.to),
        toBuffer(tx.value || '0x0'),
        toBuffer(tx.data),
        Buffer.from([v]),
        r,
        s,
      ];
      
      const signedRlp = RLP.encode(signedTxArray);
      
      // Debug: check what RLP.encode returned
      if (typeof signedRlp === 'bigint') {
        throw new Error(`RLP.encode returned bigint: ${signedRlp}. This should not happen.`);
      }
      
      const signedRlpBuffer = Buffer.isBuffer(signedRlp) ? signedRlp : Buffer.from(signedRlp);
      return '0x' + signedRlpBuffer.toString('hex');
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error}`);
    }
  }
  
  throw new Error('Transaction signing not available in this environment');
}

/**
 * Derive address from private key
 */
export function privateKeyToAddress(privateKey: string): string {
  const formattedKey = formatPrivateKey(privateKey);
  
  if (typeof require !== 'undefined') {
    try {
      const { privateToAddress } = require('@ethereumjs/util');
      const privateKeyBuffer = Buffer.from(formattedKey.slice(2), 'hex');
      const addressBuffer = privateToAddress(privateKeyBuffer);
      return '0x' + addressBuffer.toString('hex');
    } catch (error) {
      throw new Error(`Failed to derive address: ${error}`);
    }
  }
  
  throw new Error('Address derivation not available in this environment');
}
