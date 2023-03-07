import {
    AddressType,
    Dapp,
    Dialect,
    DialectCloudEnvironment,
    DialectSdk,
} from '@dialectlabs/sdk';

import {
  loadWalletKey,
  loadHoneyProgram
} from '../utils/programUtils';

import {createDappIfAbsent} from '../utils/dialectClient'

const dialectWalletPath = './monitoring-service-key.json';
const cluster = 'mainnet-beta';
// Solana-specific imports
import {
    Solana,
    SolanaSdkFactory,
    DialectSolanaWalletAdapter,
    NodeDialectSolanaWalletAdapter,
    DialectSolanaWalletAdapterWrapper
} from '@dialectlabs/blockchain-sdk-solana';
import {checkForOutbid} from '../helpers'
const environment: DialectCloudEnvironment = 'production';

/**
 * @description inits dialect listeners
 * @params TBA
 * @returns TBA
*/
async function initDialectListeners () {
    console.log('initting DB');

    const dialectWallet = loadWalletKey(dialectWalletPath);
    console.log('wallet', dialectWallet.publicKey.toString());
    let dialectProgram = await loadHoneyProgram(dialectWallet, cluster);

    const sdk: DialectSdk<Solana> = Dialect.sdk(
        {
          environment,
        },
        SolanaSdkFactory.create({
          wallet: NodeDialectSolanaWalletAdapter.create(dialectWallet) as any,
        }),
    );
    // console.log('dapps', await sdk.dapps.findAll());

    console.log('addresses', await sdk.wallet.addresses.findAll());
    const dapp = await createDappIfAbsent('Honey Finance', '', sdk);
    console.log('dapp', dapp)

    let listenerRevokeBid = dialectProgram.addEventListener("RevokeBidEvent", async (event, slot) => {
        console.log('RevokeBidEvent');
    });

    let listenerPlaceBid = dialectProgram.addEventListener("PlaceBidEvent", async (event, slot) => {
        console.log('PlaceBidEvent', event);

        await checkForOutbid(event.bid, event.bidLimit, dapp);
    });
    
    let listenerExecuteBid = dialectProgram.addEventListener("ExecuteLiquidateEvent", async (event, slot) => {
        console.log('ExecuteLiquidateEvent', event);
        const title = 'Honey Finance';
        const bidPk = event.bid.toString();

    });

    let listenerIncreaseBid = dialectProgram.addEventListener("IncreaseBidEvent", async (event, slot) => {
        console.log('IncreaseBidEvent', event);
        await checkForOutbid(event.bid, event.bidLimit, dapp);
    });

    let withdrawEvent: string;
    let depositEvent: string;
    let depositedAt: number = 0;
    let withdrewAt: number = 0;

    // let withdrawEvent, depositEvent, depositedAt = 0, withdrewAt = 0;

    let listenerDepositNft = dialectProgram.addEventListener("DepositCollateralEvent", (event, slot) => {
        console.log('DepositCollateralEvent')
        if(JSON.stringify(event) === JSON.stringify(depositEvent) && Date.now() - depositedAt < 500)
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
        })
        console.log('message sent!');
    });

    let listenerWithdrawNft = dialectProgram.addEventListener("WithdrawCollateralEvent", (event, slot) => {
        console.log('WithdrawCollateralEvent');
        if(JSON.stringify(event) === JSON.stringify(withdrawEvent) && Date.now() - withdrewAt < 500)
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
        })
        console.log('message sent!');
    });
}