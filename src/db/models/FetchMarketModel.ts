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
    utilization: {
      type: Number,
      required: false
    },
    interestRate: {
      type: Number,
      required: false
    },
    totalMarketDebt: {
      type: Number,
      required: false
    },
    totalMarketDeposits: {
      type: Number,
      required: false
    },
    nftPrice: {
      type: Number,
      required: false
    },
    bids: {
      type: [{
        bid: String,
        bidder: String,
        bidLimit: String
      }],
      required: false
    },
    allowance: {
      type: Number,
      required: false
    },
    liquidationThreshold: {
      type: Number,
      required: false
    },
    ltv: {
      type: Number,
      required: false
    },
    ratio: {
      type: Number,
      required: false
    },
    positions: {
      type: [
        {
          obligation: String,
          debt: Number,
          nft_mint: String,
          owner: String,
          ltv: Number,
          is_healthy: String,
          highest_bid: {
            type: Number,
            required: false,
          },
          verifiedCreator: String,
        },
      ],
      required: false,
    },
  }
})
// create a model based on the market schema 
const FetchedMarketModel = model < FetchedMarketM > ('FetchedMarketModel', fetchedMarketSchema, 'fetchedMarketModels');
// export model
export {FetchedMarketModel}