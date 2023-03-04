import { HoneyClient, HoneyMarketReserveInfo, ObligationPositionStruct, PositionInfoList, getHealthStatus, NftPosition, TReserve, LiquidatorClient, withdraw, TokenAmount, HoneyMarket} from '@honey-finance/sdk';
import { loadWalletKey, loadHoneyProgram,  fetchMarketReserveInfo, fetchReserve } from '../utils/programUtils';
import { HONEY_MARKET_IDS, HONEY_PROGRAM_ID } from '../constants';
var keypairPath = './keypair.json';
import { initWrappers } from '../utils/initWrappers';
import { Keypair } from '@solana/web3.js';

const cluster = 'mainnet-beta'; //mainnet-beta, devnet, testnet
let wallet: Keypair;
let program: any;

const loadMarkets = async (): Promise<HoneyMarket[]> => {
    let markets: HoneyMarket[] = [];
    wallet = loadWalletKey(keypairPath);
    program = await loadHoneyProgram(wallet, cluster);

    console.log('loading markets')

    for(let i = 0; i < HONEY_MARKET_IDS.length; i++) {
        const { market } = await initWrappers(wallet, cluster, HONEY_PROGRAM_ID.toString(), HONEY_MARKET_IDS[i].toString());
        markets.push(market);
    }

    return markets;
}

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
    return bids;
}



export { fetchAllBidsOnChain }