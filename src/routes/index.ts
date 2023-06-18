import express from 'express';
const router = express.Router();
import {
  handleAllMarketsBids, 
  handleSingleMarketBids, 
  handleUpdateMarket, 
  handleFetchMarketLiquidations, 
  handleFetchMarketsLiquidations,
  fetchMarketLevelData,
  fetchSingleMarketLevelData
} from '../controller/index'

/** This file contains the routes for the Honey Finance API **/

/**
 * @description fetches all bids for all markets
 * @params none
 * @returns array of objects, each object has a market ID and an object containing the bid data
*/
router
  .route('/bids')
  .get(handleAllMarketsBids);
/**
 * @description fetches all bids for a specific market
 * @params the id of the market
 * @returns array of objects, each object containing the bid data
*/
router 
  .route('/bids/:marketId')
  .get(handleSingleMarketBids);
/**
 * @description stores most recent data of market in DB
 * @params post request must contain marketId type string being the market id
 * @returns either success message or error message
*/
router
  .route('/updateMarket')
  .post(handleUpdateMarket)
/**
 * @description fetches liquidations of a specific market
 * @params marketID: string
 * @returns array of objects containing liquidation data
*/
router
  .route('/liquidationOverview/:marketId')
  .get(handleFetchMarketLiquidations)
/**
 * @description fetches liquidations of a all markets
 * @params none
 * @returns array of objects each object representing a market - with liquidations
*/
router
  .route('/liquidationOverview')
  .get(handleFetchMarketsLiquidations)
/**
 * @description fetches market level data
 * @params none
 * @returns array of objects each object representing a market - with market level data
*/
router
  .route('/marketData')
  .get(fetchMarketLevelData)
  /**
 * @description fetches market level data for a specific market
 * @params marketID
 * @returns object containing the market data
*/
router
  .route('/marketData/:marketId')
  .get(fetchSingleMarketLevelData)
/**
 * @description 404 route
 * @params none
 * @returns descriptive 404 page
*/
router
  .route('*')
    .get(async (req, res) => {
      res.send('render 404 Honey page: page not found');
    });

export { router }