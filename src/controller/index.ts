import {Request, Response, NextFunction } from 'express';
import { fetchAllBidsOnChain, fetchBidsOnChain } from '../helpers';
import { PublicKey } from "@solana/web3.js";
import { Market } from '../db/models/MarketModel'

/** This file contains the logic / execution functions of the routes for the Honey Finance API **/

/**
 * @description fetches all bids of all markets on chain
 * @params request object, response object, next middleware
 * @return array of objects containing the market and the bid info
*/
const handleAllMarketsBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bids = await fetchAllBidsOnChain();
    // TODO: create custom response object
    res.json(bids);
  } catch (error) {
    console.log(`Error fetching bids for all markets: ${error}`);
    res.json([]);
  }
}
/**
 * @description fetches all bids of a specific market on chain
 * @params request object, response object, next middleware
 * @return array of objects containing the market and the bid info
*/
const handleSingleMarketBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bids = await fetchBidsOnChain(new PublicKey(req.params.marketId));
    // TODO: create custom response object
    res.json(bids);
  } catch (error) {
    console.log(`Error fetching bids for market: ${error}`);
    res.json([]);
  }
}
/**
 * @description fetches the most recent on chain market data and updates DB for this market
 * @params request object, response object, next middleware
 * @return success or fail in saving fetching and saving market data in database
*/
const handleUpdateMarket = async (req: Request, res: Response, next: NextFunction) => {
  // get market id
  const marketId = req.body.marketId;
  // return error if not found
  if (!marketId) return {
    status: 'Failed',
    message: 'Please provide a market id'
  }
  try {
   // fetch bids
    const bids = await fetchBidsOnChain(new PublicKey(marketId));
    //  create new model 
    const market = new Market({
      marketId,
      bids
    });
    // validate if market exists
    const existingMarket = await Market.exists({ marketId: req.body.marketId });
    // update if exists or create new market
    if (existingMarket) {
      console.log('Market exists')
      await Market.findOneAndUpdate({ marketId: req.body.marketId}, { bids });
    } else {
      console.log('Market does not exist')
      await market.save();
    }
    res.json({
      status: 'success'
    })
  } catch (error) {
    console.log(`Error fetching bids for market: ${error}`);
    res.json([]);
  }
}

export { handleAllMarketsBids, handleSingleMarketBids, handleUpdateMarket }