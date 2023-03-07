import {Request, Response, NextFunction } from 'express';
import { fetchAllBidsOnChain, fetchBidsOnChain } from '../helpers';
import { PublicKey } from "@solana/web3.js";
/**
 * @description
 * @params
 * @return
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
 * @description
 * @params
 * @return
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