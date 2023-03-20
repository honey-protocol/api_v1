// import { LiquidatorClient, RevokeBidParams } from "@honey-finance/sdk";
// import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import { PublicKey } from "@solana/web3.js";

// const revokeBid = async (
//   liquidator: LiquidatorClient,
//   bidder: string,
//   bidMint: string,
//   market: string) => {
    
//   const marketPk: PublicKey = new PublicKey(market);
//   const bidderPk: PublicKey = new PublicKey(bidder);
//   const bidMintPk: PublicKey = new PublicKey(bidMint);

//   // TODO needed for non-wSOL bids
//   // const withdrawDestination = await Token.getAssociatedTokenAddress(
//   //     ASSOCIATED_TOKEN_PROGRAM_ID,
//   //     TOKEN_PROGRAM_ID,
//   //     bidMint,
//   //     bidder
//   // );

//   const params: RevokeBidParams = {
//       market: marketPk,
//       bidder: bidderPk,
//       bid_mint: bidMintPk
//       // withdraw_destination: withdrawDestination,
//   }
    
//   const tx = await liquidator.revokeBid(params);
//   console.log("TxId: ", tx);
// }

// export {revokeBid}