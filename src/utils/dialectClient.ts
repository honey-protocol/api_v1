import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import {
  DialectSdk,
} from '@dialectlabs/sdk';
import {
  Solana,
} from '@dialectlabs/blockchain-sdk-solana';

const createDappIfAbsent = async function createDappIfAbsent(name: string, description: string, sdk: DialectSdk<Solana>) {
  const dapp = await sdk.dapps.find();
  if (!dapp) {
    console.log(
      `Dapp ${sdk.wallet.address} not registered, creating it`,
    );
    return sdk.dapps.create({
      name,
      description,
      // TODO: validate add blockchain type
      blockchainType: 'SOLANA'
    });
  }
  console.log(`Dapp ${dapp.address} already registered`);

  return dapp;
}

export {createDappIfAbsent}