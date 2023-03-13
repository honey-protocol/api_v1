import {Request, Response, NextFunction } from 'express';
import { fetchAllBidsOnChain, fetchBidsOnChain } from '../helpers';
import { PublicKey } from "@solana/web3.js";

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

export { handleAllMarketsBids, handleSingleMarketBids }