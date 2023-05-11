import {Schema, model} from 'mongoose';
// declare the interface for the market
interface LiquidationM {
  marketId: string,
  obligationId: string,
  collateralNFTMint: string,
  payer: string,
  isPNFT: boolean,
  previousOwner: string,
  debtAtTimeOfLiquidation: number,
}
// init the schema based on interface
const liquidationSchema = new Schema<LiquidationM>({
  marketId: {
    type: String,
    required: false
  },
  obligationId: {
    type: String,
    required: false
  },
  collateralNFTMint: {
    type: String,
    required: false
  },
  payer: {
    type: String,
    required: false
  },
  isPNFT: {
    type: Boolean,
    required: false
  },
  previousOwner: {
    type: String,
    required: false
  },
  debtAtTimeOfLiquidation: {
    type: Number,
    required: false
  }
}, {
  timestamps: true
})
// create a model based on the market schema 
const LiquidationModel = model<LiquidationM>('LiquidationModel', liquidationSchema, 'liquidations');
// export model
export { LiquidationModel }