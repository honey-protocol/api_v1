import { HoneyMarket} from '@honey-finance/sdk';
import { loadWalletKey, loadHoneyProgram,  fetchMarketReserveInfo, fetchReserve } from '../utils/programUtils';
import { HONEY_MARKET_IDS, HONEY_PROGRAM_ID } from '../constants';
var keypairPath = './keypair.json';
import { initWrappers } from '../utils/initWrappers';
import { Keypair, PublicKey } from '@solana/web3.js';
import {findBidAccount} from './web3';
import { BN } from '@project-serum/anchor';
import cron from 'node-cron';


// Common imports for dialect
import {
    AddressType,
    Dapp,
    Dialect,
    DialectCloudEnvironment,
    DialectSdk,
    Thread,
} from '@dialectlabs/sdk';
import { initLiquidation } from './liquidation';
import { initDialectListeners } from './dialect';

// TODO: switch to devnet for local testing
const cluster = 'mainnet-beta'; //mainnet-beta, devnet, testnet
let wallet: Keypair;
let program: any;
/**
 * @description loops through all the market IDs and inits the honey wrappers
 * @params none
 * @returns markets with their objects: honey client | honey market | honey user | honey reserves | anchor provider
*/
const loadMarkets = async (): Promise<HoneyMarket[]> => {
    let markets: HoneyMarket[] = [];
    wallet = loadWalletKey(keypairPath);
    program = await loadHoneyProgram(wallet, cluster);

    for(let i = 0; i < HONEY_MARKET_IDS.length; i++) {
        const { market } = await initWrappers(wallet, cluster, HONEY_PROGRAM_ID.toString(), HONEY_MARKET_IDS[i].toString());
        markets.push(market);
    }

    return markets;
}
/**
 * @description fetches and inits all the bids of all markets
 * @params none
 * @returns array of objects containing market id with bidding data
*/
const fetchAllBidsOnChain = async () => {
    let bids = [];
    const allBids = await program.account.bid.all();

    for(const v of allBids) {
        if((await program.provider.connection.getAccountInfo(v.publicKey))) {
            const bid = {
                marketID: v.account.market.toString(),
                bidData: {
                    bid: v.publicKey.toString(),
                    bidder: v.account.bidder.toString(),
                    bidLimit: v.account.bidLimit.toString()
                }
            };
            bids.push(bid);
        }
    }
    return bids
}
/**
 * @description fetchs all bids in the same market, 
 * filters out with greater bidLimit 
 * and sends the dialect message to the next higher bid
 * @params
 * bid: public key of bid account
 * bid_limit: bidLimit value of bid account
*/
const checkForOutbid = async (bid: string, bid_limit: string, dapp: Dapp) => {
    const market_id = await findMarketOfBid(HONEY_MARKET_IDS, bid);
    if (!market_id) return;

    let bids = (await fetchBidsOnChain(new PublicKey(market_id))).filter((item) => {
        return new BN(item.bidLimit).lt(new BN(bid_limit))
    }).sort((a, b) => b.bidLimit - a.bidLimit);

    if(bids.length > 0) {
        const outbid = bids[0]
        const title = 'Honey Finance';
        await dapp.messages.send({
            title,
            message: "You have been outbid",
            recipient: outbid.bidder
        });
    }
}
/**
 * @description fetches and inits all the bids of a market
 * @params market id - Public key
 * @returns array of objects containing bidding data
*/
const fetchBidsOnChain = async(market_id: PublicKey) => {
    let bids = [];
    const allBids = await program.account.bid.all();
    
    for(const v of allBids) {
        const bid = {
            bid: v.publicKey.toString(),
            bidder: v.account.bidder.toString(),
            bidLimit: v.account.bidLimit.toString()
        };
        const bidAccountInfo = await program.provider.connection.getAccountInfo(v.publicKey)
        if(bidAccountInfo) {

            const bidForMarket = (await findBidAccount(market_id, new PublicKey(bid.bidder))).address.toString();
            if(bid.bid == bidForMarket) {
                bids.push(bid);
            }
        }

    }
    return bids;
}
/**
 * @description subset of checkForOutBid
 * @params array of market ids being PublicKeys | the bid
 * @returns market id | null
*/
const findMarketOfBid = async (market_ids: PublicKey[], bid: string) => {
    const bid_account = await program.account.bid.fetch(bid);

    const bid_obj = {
        bid,
        bidder: bid_account.bidder.toString(),
        bidLimit: bid_account.bidLimit.toString()
    };
    for(const market_id of market_ids) {
        const bidForMarket = (await findBidAccount(market_id, new PublicKey(bid_obj.bidder))).address.toString();
        if(bid_obj.bid == bidForMarket) {
            return market_id;
        }
    }
    return null;
}
/**
 * @description inits the markets and fires of a cron job 
 * every 2 minutes that calls upon the initLiquidation function
*/
const initProgram = async () => {
    // call loadmarkets
    loadMarkets().then((markets) => {
        console.log('@@-- init markets')
        cron.schedule('*/2 * * * *', async () => {
            initLiquidation(markets, wallet, program).catch(e => {
                console.log(`Error executing liquidation: ${e}`);
        });
      });
    });

    console.log('@@-- init dialect');
    initDialectListeners().catch(e => {
    // Deal with the fact the chain failed
    console.log(`Error: init of Dialect failed: ${e}`);
})
}



export { fetchAllBidsOnChain, fetchBidsOnChain, loadMarkets, checkForOutbid, initProgram, findMarketOfBid }