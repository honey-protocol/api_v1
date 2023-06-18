import {
  fetchAllMarkets
} from '@honey-finance/sdk'
import {
  FetchedMarketModel
} from '../db/models/FetchMarketModel';
import {
  Connection
} from '@solana/web3.js';

import {
  HONEY_PROGRAM_ID,
  MARKET_IDS_STRING
} from '../constants';
/**
 * @description creates custom market object with correct values
 * @params market object
 * @returns object for FED to use
*/
async function formatMarketData(marketObject: any) {
  const marketId = marketObject.market.address.toString();
  const { utilization, interestRate } =
    await marketObject.reserves[0].getUtilizationAndInterestRate();
  
  const {outstandingDebt} =
    await marketObject.reserves[0].getReserveState();
  
  const {totalDeposits} =
    await marketObject.reserves[0].getReserveState();
  
  const nftPrice = await marketObject.market.fetchNFTFloorPriceInReserve(
    0
  );
  const allowanceAndDebt = await marketObject.user.fetchAllowanceAndDebt(
    0,
    'mainnet-beta'
  );

  const allowance = await allowanceAndDebt.allowance;
  const liquidationThreshold =
    await allowanceAndDebt.liquidationThreshold;
  const ltv = await allowanceAndDebt.ltv;
  const ratio = await allowanceAndDebt.ratio.toString();

  const positions = marketObject.positions.map((pos: any) => {
    return {
      obligation: pos.obligation,
      debt: pos.debt,
      nft_mint: pos.nft_mint.toString(),
      owner: pos.owner.toString(),
      ltv: pos.ltv,
      is_healthy: pos.is_healthy,
      highest_bid: pos.highest_bid,
      verifiedCreator: pos.verifiedCreator.toString()
    };
  });

  return {
    marketId,
    utilization: utilization,
    interestRate: interestRate,
    totalMarketDebt: outstandingDebt,
    totalMarketDeposits: totalDeposits,
    // totalMarketValue: totalMarketDebt + totalMarketDeposits,
    nftPrice: nftPrice,
    bids: marketObject.bids,
    allowance,
    liquidationThreshold,
    ltv,
    ratio,
    positions
  };
}

/**
 * @description this function runs every 2 min via a cron job and fetches the latest market data
 */ 
const fetchMarketData = async () => {
  // create connection for fetching of all markets
  const createConnection = () => {
    return new Connection(process.env.MAINNET_RPC_ENDPOINT);
  }
  // fetch market data
  const marketData = await fetchAllMarkets(
    createConnection(),
    null,
    HONEY_PROGRAM_ID.toString(),
    MARKET_IDS_STRING,
    false
  );
  // function that checks if the market already exists - 
  // if so it updates the data object | if not; injects new entity 
  async function saveOrUpdateMarketDate(fetchedObjects) {
    try {
      await Promise.all(
        fetchedObjects.map(async (market) => {
          const existingMarket = await FetchedMarketModel.findOne(
            { marketId: market.market.address.toString() }
          );
          if (existingMarket) {
            existingMarket.data = await formatMarketData(market);
            await existingMarket.save();
            return;
          } else {
            const newMarketObject = new FetchedMarketModel({ 
              marketId: market.market.address.toString(),
              data: await formatMarketData(market)
            });

            await newMarketObject.save();
            return;
          }
        })
      );
      console.log('Data updated and stored successfully');
      return; 
    } catch (error) {
        console.log(`An error occurred trying to save and update market data ${error}`);
        return; 
    }
  }
  // run save or update func. 
  saveOrUpdateMarketDate(marketData).then(
    (res) => {
      console.log('update market data success');
      return;
    }).catch((err) => {
    console.log(`Error during saveorupdatemarketdata func. ${err}`);
    return;
  });
}

export {
  fetchMarketData
}