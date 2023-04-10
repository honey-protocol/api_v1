import {
  HoneyClient,
  HoneyReserve,
  HoneyUser
} from '@honey-finance/sdk';
import {
  PublicKey
} from '@solana/web3.js';
import {
  Schema,
  model
} from 'mongoose';
// declare the interface for the market
interface FetchedMarketM {
  marketId: string,
    data: {

    }
}
// init the schema based on interface
const fetchedMarketSchema = new Schema < FetchedMarketM > ({
  marketId: {
    type: String,
    required: true
  },
  data: {
    bids: {
      type: [{
        bid: String,
        bidder: String,
        bidLimit: String
      }],
      required: false
    },
    client: {
      type: HoneyClient,
      required: true
    },
    positions: {
      type: [{
        debt: Number,
        highest_bid: Number,
        is_healthy: String,
        ltv: Number,
        nft_mint: PublicKey,
        obligation: String,
        owner: PublicKey,
        verifiedCreator: PublicKey
      }],
      required: false
    },
    reserves: {
      type: HoneyReserve,
      required: true
    },
    user: {
      type: HoneyUser,
      required: true
    }
  }
})
// create a model based on the market schema 
const FetchedMarketModel = model < FetchedMarketM > ('FetchedMarketModel', fetchedMarketSchema, 'fetchedMarketModels');
// export model
export {
  FetchedMarketModel
}