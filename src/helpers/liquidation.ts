import { HoneyClient, HoneyMarketReserveInfo, ObligationPositionStruct, PositionInfoList, getHealthStatus, NftPosition, TReserve, LiquidatorClient, withdraw, TokenAmount, HoneyMarket} from '@honey-finance/sdk';
import { Keypair, PublicKey } from '@solana/web3.js';
import { mongoClient, ReserveState } from '../utils/db';
import { HONEY_PROGRAM_ID } from '../constants';
import { initWrappers } from '../utils/initWrappers';
import { fetchMarketReserveInfo, fetchReserve, loadWalletKey, loadHoneyProgram, roundHalfDown } from '../utils/programUtils';
import { getOraclePrice } from './switchboard';
import { fetchBidsOnChain } from '../helpers';
import { BN } from '@project-serum/anchor';
import { executeBid } from '../utils/liquidations/executeBid';

const cluster = 'mainnet-beta';
// TODO: refactor - figure out mongo setup, seems to be an empty collection
const initLiquidation = async (markets: HoneyMarket[], wallet: Keypair, program: any) => {
console.log('initting liquidation');

    if(!wallet || !program)
    {
        console.log('wallet and program not ready yet')
        return;
    }
    const database = mongoClient.db('analytics');
    const db_collection = database.collection<ReserveState>('reserve_states');

    // const data = db_collection.find({})
    // console.log('@@-- database data', data);


    for(let i = 0; i < markets.length; i++) {
        const { client, provider } = await initWrappers(wallet, cluster, HONEY_PROGRAM_ID.toString(), markets[i].address.toString());

        const marketReserveInfo: HoneyMarketReserveInfo[] = await fetchMarketReserveInfo(client.program, markets[i].address);
        // console.log('fetched marketReserveInfo');

        const reserveInfo: TReserve = await fetchReserve(client, marketReserveInfo[0]);
        // console.log(`fetched reserveInfo for ${reserveInfo.market.toString()}`, reserveInfo.config);

        const liquidatorClient = new LiquidatorClient(program);
        // const bids = await redisUtils.fetchBids();//temporarily switching into onchain mode
    
        const bids = await fetchBidsOnChain(markets[i].address);
        const sortedBids = bids
            .sort((a, b) => a.bidLimit - b.bidLimit);//sort by bid amount
        
        let obligations = await markets[i].fetchObligations();
        // console.log('obligations', obligations);

        const newRecord = await db_collection.insertOne({
            market_id: reserveInfo.market.toString(),
            accrued_until: reserveInfo.reserveState.accruedUntil.toString(),
            outstanding_debt: reserveInfo.reserveState.outstandingDebt.toString(),
            uncollected_fees: reserveInfo.reserveState.uncollectedFees.toString(),
            protocol_uncollected_fees: reserveInfo.reserveState.protocolUncollectedFees.toString(),
            total_deposits: reserveInfo.reserveState.totalDeposits.toString(),
            total_deposit_notes: reserveInfo.reserveState.totalDepositNotes.toString(),
            total_loan_notes: reserveInfo.reserveState.totalLoanNotes.toString(),
            last_updated: reserveInfo.reserveState.lastUpdated.toString(),
            invalidated: reserveInfo.reserveState.invalidated,
            created_at: Date.now()
        })

        // console.log('getting oracle Price using cluster', cluster)
        const solPriceUsd = await getOraclePrice(cluster, liquidatorClient.conn, reserveInfo.switchboardPriceAggregator);
        const nftPriceUsd = await getOraclePrice(cluster, liquidatorClient.conn, markets[i].nftSwitchboardPriceAggregator);
        const nftPrice = nftPriceUsd / solPriceUsd;

        let riskyPositions: NftPosition[] = [];

        if (obligations) {
            // console.log('obligations length', obligations.length);
            for(let index = 0; index < obligations.length; index++) {
                const obligation = obligations[index];
                // console.log('obligation', obligation.account);
                let nftMints:PublicKey[] = obligation.account.collateralNftMint;
                const nft = nftMints[0];
                if(nft === PublicKey.default) {
                    console.log('not nft data');
                    continue;
                }
                
                const parsePosition = (position: any) => {
                    const pos: ObligationPositionStruct = {
                        account: new PublicKey(position.account),
                        amount: new BN(position.amount),
                        side: position.side,
                        reserveIndex: position.reserveIndex,
                        _reserved: [],
                    };
                    return pos;
                };

                obligation.account.loans = PositionInfoList.decode(Buffer.from(obligation.account.loans as any as number[])).map(parsePosition);

                const loanNoteBalance: TokenAmount = new TokenAmount(obligation.account?.loans[0]?.amount, -reserveInfo.exponent);
                const totalDebt = loanNoteBalance.mulb(marketReserveInfo[0].loanNoteExchangeRate).divb(new BN(Math.pow(10, 15)).mul(new BN(Math.pow(10, 6))));

                // const totalDebt = marketReserveInfo[0].loanNoteExchangeRate
                //     .mul(obligation.account?.loans[0]?.amount)
                //     .div(new BN(10 ** 15))
                //     .div(new BN(10 ** 6))//!!
                //     .div(new BN(10 ** 5)).toNumber() / (10 ** 4);//dividing lamport

                const health:string = getHealthStatus(totalDebt.uiAmountFloat, nftPrice);//TODO: not just nftPrice but with token deposits as collateral
                const is_risky = (totalDebt.uiAmountFloat / nftPrice * 100) >= 65;
                if(is_risky) {
                    if(sortedBids.length == 0) { // if there is no bid, execute solvent liquidation
                        console.log('executing elixir liquidation');
                        // await elixirLiquidate(
                        //     provider,
                        //     program,
                        //     wallet,
                        //     markets[i].address.toString(),
                        //     HONEY_PROGRAM_ID.toString(),
                        //     cluster,
                        //     nft.toString(),
                        //     obligation.account.owner.toString(),
                        //     4,
                        //     // verifiedCreator
                        // )
                    } else {
                        const highestBid = sortedBids.pop();//get the highest bid and pop
    
                        let position: NftPosition = {
                            obligation: obligation.publicKey.toString(),
                            debt: totalDebt.uiAmountFloat,
                            nft_mint: new PublicKey(nft),
                            owner: obligation.account.owner,
                            ltv: 40,
                            is_healthy: health,
                            highest_bid: highestBid.bidLimit
                        };
                        riskyPositions.push(position);
        
                        // console.log('executeBid param', 
                        //     // liquidatorClient, 
                        //     position.highest_bid / LAMPORTS_PER_SOL, 
                        //     HONEY_MARKET_ID.toString(), 
                        //     position.obligation, 
                        //     marketReserveInfo[0].reserve.toString(),
                        //     obligation.account.collateralNftMint[0].toString(), 
                        //     highestBid.bid,
                        //     wallet.publicKey.toString(), 
                        //     // wallet, 
                        //     // env, 
                        //     // HONEY_PROGRAM_ID.toString()
                        // );
                        console.log('execute auction liquidation');
                        await executeBid(liquidatorClient,
                            markets[i].address.toString(),
                            position.obligation,
                            marketReserveInfo[0].reserve.toString(),
                            obligation.account.collateralNftMint[0].toString(),
                            highestBid.bid,
                            wallet.publicKey,
                            wallet,
                            cluster,
                            HONEY_PROGRAM_ID.toString()
                        );
                    }
                }
            };
        };
        // console.log('liquidated positions!', riskyPositions);
    }
}

export {initLiquidation}