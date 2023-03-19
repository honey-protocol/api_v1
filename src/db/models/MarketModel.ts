import {Schema, model} from 'mongoose';
// declare the interface for the market
interface MarketM {
  marketId: string,
  bids: [
    {
      bid: String,
      bidder: String,
      bidLimit: String
    }
  ]
}
// init the schema based on interface
const marketSchema = new Schema<MarketM>({
  marketId: {
    type: String,
    required: true
  },
  bids: [
    {
      bid: String,
      bidder: String,
      bidLimit: String
    }
  ]
})
// create a model based on the market schema 
const Market = model<MarketM>('Market', marketSchema);
// export model
export { Market }