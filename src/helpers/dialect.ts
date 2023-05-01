import {
  AddressType,
  Dapp,
  Dialect,
  DialectCloudEnvironment,
  DialectSdk,
} from '@dialectlabs/sdk';

import { loadWalletKey, loadHoneyProgram } from '../utils/programUtils';

import { createDappIfAbsent } from '../utils/dialectClient';

const dialectWalletPath = './monitoring-service-key.json';
const cluster = 'mainnet-beta';
// Solana-specific imports
import {
  Solana,
  SolanaSdkFactory,
  DialectSolanaWalletAdapter,
  NodeDialectSolanaWalletAdapter,
  DialectSolanaWalletAdapterWrapper,
} from '@dialectlabs/blockchain-sdk-solana';
import { checkForOutbid } from './';
import { BN, web3 } from '@project-serum/anchor';
const environment: DialectCloudEnvironment = 'production';

/**
 * @description inits dialect listeners
 * @params none
 * @returns emits message
 */
const initDialectListeners = async () => {
  console.log('initting DB');

  const dialectWallet = loadWalletKey(dialectWalletPath);
  let dialectProgram = await loadHoneyProgram(dialectWallet, cluster);

  const sdk: DialectSdk<Solana> = Dialect.sdk(
    {
      environment,
    },
    SolanaSdkFactory.create({
      wallet: NodeDialectSolanaWalletAdapter.create(dialectWallet) as any,
    })
  );
  // console.log('dapps', await sdk.dapps.findAll());

  // console.log('addresses', await sdk.wallet.addresses.findAll());

  const dapp = await createDappIfAbsent('Honey Finance', '', sdk);
  // console.log('dapp', dapp)

  let listenerRevokeBid = dialectProgram.addEventListener(
    'RevokeBidEvent',
    async (event, slot) => {
      console.log('RevokeBidEvent');
    }
  );

  let listenerPlaceBid = dialectProgram.addEventListener(
    'PlaceBidEvent',
    async (event, slot) => {
      console.log('PlaceBidEvent', event);
      const title = 'Honey Finance';
      
      console.log(new BN(event.bid_limit).toString())
      const amount = event.bid_limit / web3.LAMPORTS_PER_SOL
      console.log(amount)
      const rounded_amount = amount.toPrecision(3)
      console.log(rounded_amount)
      //ToDO: Add market name.
      const message = `You have placed a liquidation bid of ${rounded_amount} SOL in the ... market`
      const recipient = event.bidder.toString();

      dapp.messages.send({
        title: title,
        message: message,
        recipient: recipient
      })
      console.log("Message Send!")
      await checkForOutbid(event.bid, event.bidLimit, dapp);
    }
  );

  // Message to Bid owner
  let listenerExecuteBid = dialectProgram.addEventListener(
    'ExecuteLiquidateEvent',
    async (event, slot) => {
      console.log('ExecuteLiquidateEvent', event);
      const title = 'Honey Finance';
      const bidPk = event.bid.toString();
      //ToDO: Add market name.
      const message = "You have liquidated a nft"
      const recipient = event.bid.bidder;

      dapp.messages.send({
        title: title,
        message: message,
        recipient: event.bid.bidder
      })


    }
  );

  let listenerIncreaseBid = dialectProgram.addEventListener(
    'IncreaseBidEvent',
    async (event, slot) => {
      console.log('IncreaseBidEvent', event);
      await checkForOutbid(event.bid, event.bidLimit, dapp);
    }
  );

  let withdrawEvent: string;
  let depositEvent: string;
  let borrowEvent: string;
  let depositedAt: number = 0;
  let withdrewAt: number = 0;
  let borrowedAt: number = 0;

  // let withdrawEvent, depositEvent, depositedAt = 0, withdrewAt = 0;

  let listenerDepositNft = dialectProgram.addEventListener(
    'DepositCollateralEvent',
    (event, slot) => {
      console.log('DepositCollateralEvent');
      if (
        JSON.stringify(event) === JSON.stringify(depositEvent) &&
        Date.now() - depositedAt < 500
      )
        return;

      depositEvent = event;
      depositedAt = Date.now();

      const title = 'Honey Finance';
      const message = 'You have deposited an nft';
      const recipient = event.depositor.toString();

      dapp.messages.send({
        title,
        message,
        recipient,
        // addressTypes: [AddressType.Wallet],
        // notificationTypeId: allNotificationTypes[0].id
      });
      console.log('message sent!');
    }
  );
  /**
   * Borrow event:
   *pub struct BorrowEvent {
    borrower: Pubkey,
    reserve: Pubkey,
    debt: u64,
    requested_amount: u64,
    marketId: Pubkey
    }   
   */
  let listenerBorrow = dialectProgram.addEventListener(
    'BorrowEvent',
    (event, slot) => {
      console.log('BorrowEvent');
      if (
        JSON.stringify(event) === JSON.stringify(borrowEvent) &&
        Date.now() - borrowedAt < 500
      )
        return;
      borrowEvent = event;
      borrowedAt = Date.now();
      const debt = event.debt / web3.LAMPORTS_PER_SOL;
      const rounded_debt = debt.toPrecision(4);
      const title = 'Honey Finance';
      //TODO: Add solscan tx, and market name.
      const message = `You have borrowed ${rounded_debt} SOL`;
      const recipient = event.borrower.toString();

      dapp.messages.send({
        title,
        message,
        recipient,
        // addressTypes: [AddressType.Wallet],
        // notificationTypeId: allNotificationTypes[0].id
      });
      console.log('message sent!');
    }
  );

  let listenerWithdrawNft = dialectProgram.addEventListener(
    'WithdrawCollateralEvent',
    (event, slot) => {
      console.log('WithdrawCollateralEvent');
      if (
        JSON.stringify(event) === JSON.stringify(withdrawEvent) &&
        Date.now() - withdrewAt < 500
      )
        return;

      withdrawEvent = event;
      withdrewAt = Date.now();

      const title = 'Honey Finance';
      const message = 'You have claimed your nft';
      const recipient = event.depositor.toString();

      dapp.messages.send({
        title,
        message,
        recipient,
        // addressTypes: [AddressType.Wallet],
        // notificationTypeId: allNotificationTypes[0].id
      });
      console.log('message sent!');
    }
  );
};

export { initDialectListeners };
