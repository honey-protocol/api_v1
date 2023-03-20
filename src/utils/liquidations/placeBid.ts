// import { LiquidatorClient, PlaceBidParams } from "@honey-finance/sdk";
// import { PublicKey } from "@solana/web3.js";

// const placeBid = async (liquidator: LiquidatorClient,
//     bidder: string,
//     bidMint: string,
//     bidLimit: number,
//     market: string) => {

//     console.log(`bidMint: ${bidMint}`);
//     console.log(`bidder: ${bidder}`);

//     const marketPk: PublicKey = new PublicKey(market);
//     const bidMintPk: PublicKey = new PublicKey(bidMint);
//     const bidderPk: PublicKey = new PublicKey(bidder);

//     // Non-SOL liquidations
//     // const depositSource = await Token.getAssociatedTokenAddress(
//     //     ASSOCIATED_TOKEN_PROGRAM_ID,
//     //     TOKEN_PROGRAM_ID,
//     //     bidMintPk,
//     //     bidderPk
//     // );

//     const params: PlaceBidParams = {
//         bid_limit: bidLimit,
//         market: marketPk,
//         bidder: bidderPk,
//         bid_mint: bidMintPk,
//         // deposit_source: depositSource.publicKey,
//     }

//     const tx = await liquidator.placeBid(params);
//     console.log("TxId: ", tx);
// }

// export {placeBid}