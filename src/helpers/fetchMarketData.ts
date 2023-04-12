import {
  fetchAllMarkets
} from '@honey-finance/sdk'
import {
  FetchedMarketModel
} from '../db/models/FetchedMarketModel';
import {
  Connection
} from '@solana/web3.js';

import {
  HONEY_PROGRAM_ID,
  MARKET_IDS_STRING
} from '../constants';
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
    MARKET_IDS_STRING
  );
  // function that checks if the market already exists - 
  // if so it updates the data object | if not; injects new entity 
  async function saveOrUpdateMarketDate(fetchedObjects) {
    try {
      await Promise.all(
        fetchedObjects.map(async (market) => {
          const existingMarket = await FetchedMarketModel.findOne({ marketId: market.market.address.toString() });
          if (existingMarket) {
            existingMarket.data = market.data;
            return existingMarket.save();
          } else {
            const newMarketObject = new FetchedMarketModel({ 
              marketId: market.market.address.toString(),
              data: market.data
            });

            return newMarketObject.save();
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
  
  saveOrUpdateMarketDate(marketData).then(
    (res) => {
      console.log('update market data success')
    }).catch((err) => {
    console.log(`Error during saveorupdatemarketdata func. ${err}`);
  });
}

export {
  fetchMarketData
}