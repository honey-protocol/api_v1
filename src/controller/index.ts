import {Request, Response, NextFunction } from 'express';
import { fetchAllBidsOnChain } from '../helpers';

const handleAllMarketsBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bids = await fetchAllBidsOnChain();
    // add data to object
    return res.json(bids) 
  } catch (error) {
    next(error);
  }
}

const handleSingleMarketBids = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json({
      status: res.status,
      data: {
        operation: 'Success',
        tx: 'tx string'
      }
    })
  } catch (error) {
    
  }
}

export { handleAllMarketsBids, handleSingleMarketBids }