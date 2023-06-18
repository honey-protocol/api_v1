import {Request, Response, NextFunction } from 'express';
import { fetchAllBidsOnChain, fetchBidsOnChain } from '../helpers';
import { PublicKey } from "@solana/web3.js";
import { Market } from '../db/models/MarketModel';
import { LiquidationModel } from '../db/models/LiquidationModel';
import { MARKET_IDS_STRING } from '../constants';
import { FetchedMarketModel } from '../db/models/FetchMarketModel';

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
  if (!marketId) return res.json({status: 'Failed', message: 'Please provide a market id'});

  try {
    // validate if market ID is an active honey market 
    if (MARKET_IDS_STRING.includes(marketId)) {
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
        await Market.findOneAndUpdate({ marketId: req.body.marketId}, { bids });
      } else {
        await market.save();
      }
      res.json({
        status: 'Success',
        message: 'Marketdata updated'
      });
    } else {
        res.json({ status: 'Failed', message: 'Not an active Honeymarket' });
    }
  } catch (error) {
      console.log(`Error updating market: ${error}`);
      res.json([]);
  }
}
/**
 * @description fetches liquidations of a specific market
 * @params request object, response object, next middleware
 * @return array of objects - each object being a liquidation
*/
const handleFetchMarketLiquidations = async (req: Request, res: Response, next: NextFunction) => {
  const marketId = req.params.marketId ? req.params.marketId : false;
  // return error if not found
  if (!marketId) return res.json({status: 'Failed', message: 'Please provide a market id'});

  try {
    // validate if market ID is an active honey market
    if (MARKET_IDS_STRING.includes(marketId)) {
      const marketLiquidations = await LiquidationModel.find({ marketId });
      return res.json(marketLiquidations);
    } else {
      return res.json({status: 'Failed', message: 'Not an active Honeymarket'});
    }
  } catch (error) {
    console.log(`Error fetching liquidations for market ${marketId}: ${error}`);
    res.json([]);
  }
}
/**
 * @description fetches liquidations of all markets
 * @params request object, response object, next middleware
 * @return array of objects - each object containing a market ID and an array of liquidations
*/
const handleFetchMarketsLiquidations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // fetch liquidations for all markets
    const marketsLiquidations = await LiquidationModel.find();
    res.json(marketsLiquidations);
  } catch (error) {
    console.log(`Error fetching liquidations ${error}`);
    res.json([]);
  }
}
/**
 * @description fetches market level data
 * @params request object, response object, next middleware
 * @return array of objects - each object containing a market with market level data || empty array
*/
const fetchMarketLevelData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const marketLevelData = await FetchedMarketModel.find();   
    res.json(marketLevelData);
  } catch (error) {
    console.log(`Error while fetching market level data: ${error}`);
    res.json([]);
  }
}

const fetchSingleMarketLevelData = async (req: Request, res: Response, next: NextFunction) => {
  const marketId = req.params.marketId ? req.params.marketId : false;
  // return error if not found
  if (!marketId) return res.json({status: 'Failed', message: 'Not an active Honeymarket'});

  try {
    // validate if market ID is an active honey market
    if (MARKET_IDS_STRING.includes(marketId)) {
      const marketLevelData = await FetchedMarketModel.find({marketId});   
      res.json(marketLevelData);
    } else {
      res.json({status: 'Failed', message: 'Not an active Honeymarket'});
    }
    
  } catch (error) {
    console.log(`Error while fetching market level data: ${error}`);
    res.json([]);
  }
}

export { 
  handleAllMarketsBids, 
  handleSingleMarketBids, 
  handleUpdateMarket,
  handleFetchMarketLiquidations,
  handleFetchMarketsLiquidations,
  fetchMarketLevelData,
  fetchSingleMarketLevelData
}