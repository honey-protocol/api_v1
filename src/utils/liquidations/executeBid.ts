import { ExecuteBidParams, HoneyReserve, LiquidatorClient, TxnResponse } from "@honey-finance/sdk";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { initWrappers } from "../initWrappers";
import { LiquidationModel } from "../../db/models/LiquidationModel";

const executeBid = async (
  liquidator: LiquidatorClient,
  market: string,
  obligation: string,
  reserve: string,
  nftMint: string,
  bid: string,
  payer: PublicKey,
  wallet: Keypair, 
  env: string, 
  programId: string,
  previousOwner: string,
  debtAtTimeOfLiquidation: number,
  pnft?: boolean
) => {

  try {
    const bidPK = new PublicKey(bid);
    const nftMintPk = new PublicKey(nftMint);
    const reservePk = new PublicKey(reserve);
    const obligationPk = new PublicKey(obligation);
    const marketPk: PublicKey = new PublicKey(market);
    const bidData = await liquidator.program.account.bid.fetch(bidPK);
    const { reserves } = await initWrappers(wallet, env, programId, market);

    // const withdrawSource = await getAssociatedTokenAddress(
    //     ASSOCIATED_TOKEN_PROGRAM_ID,
    //     TOKEN_PROGRAM_ID,
    //     bidMint,
    //     bidder
    // );

    console.log('nftMint', nftMintPk.toString());
    console.log('bidder', bidData.bidder.toString());

    const params: ExecuteBidParams = {
        market: marketPk,
        obligation: obligationPk,
        reserve: reservePk,
        nftMint: nftMintPk,
        payer,
        bidder: new PublicKey(bidData.bidder),
    }

    if (pnft) {
      const tx = await liquidator.executePnftBid(reserves, params);

      if (tx[0] === 'FAILED') {
        console.log(`Liquidation failed`);
        return;
      } else {
        const liquidation = new LiquidationModel({
          marketId: market,
          obligationId: obligation,
          collateralNFTMint: nftMint,
          payer: payer.toString(),
          isPNFT: true,
          previousOwner,
          debtAtTimeOfLiquidation
        });

        await liquidation.save().then((res) => {
          console.log(`Liquidation stored in DB: ${res}`)
        }).catch((err) => {
          console.log(`Error storing liquidation ${err}`);
        })
        
        console.log("TxId: ", tx);
        return;
      }
    } else {
      const tx = await liquidator.executeBid(reserves, params);

      if (tx[0] === 'FAILED') {
        console.log(`Liquidation failed`);
        return;
      } else {
        const liquidation = new LiquidationModel({
          marketId: market,
          obligationId: obligation,
          collateralNFTMint: nftMint,
          payer: payer.toString(),
          isPNFT: false,
          previousOwner,
          debtAtTimeOfLiquidation
        });

        await liquidation.save().then((res) => {
          console.log(`Liquidation stored in DB: ${res}`)
        }).catch((err) => {
          console.log(`Error storing liquidation ${err}`);
        })
        
        console.log("TxId: ", tx);
        return;
      }
    }
  } catch (error) {
      console.log(`An error occurred in executing the liquidation: ${error}`);
      return;
}

// testing bids
// async function simulateBid(
//     liquidator: LiquidatorClient,
//     market: string,
//     obligation: string,
//     reserve: string,
//     nftMint: string,
//     bid: string,
//     payer: PublicKey,
//     wallet: Keypair, 
//     env: string, 
//     programId: string) {

//     const bidPK = new PublicKey(bid);
//     const nftMintPk = new PublicKey(nftMint);
//     const reservePk = new PublicKey(reserve);
//     const obligationPk = new PublicKey(obligation);
//     const marketPk: PublicKey = new PublicKey(market);
//     console.log("simulateBid->liquidator.program.provider.connection", liquidator.program.provider.connection.rpcEndpoint);
//     const bidData = await liquidator.program.account.bid.fetch(bidPK);
//     const { reserves } = await initWrappers(wallet, env, programId, market);

//     // const withdrawSource = await getAssociatedTokenAddress(
//     //     ASSOCIATED_TOKEN_PROGRAM_ID,
//     //     TOKEN_PROGRAM_ID,
//     //     bidMint,
//     //     bidder
//     // );

//     console.log('nftMint', nftMintPk.toString());
//     console.log('bidder', bidData.bidder.toString())

//     const params: ExecuteBidParams = {
//         market: marketPk,
//         obligation: obligationPk,
//         reserve: reservePk,
//         nftMint: nftMintPk,
//         payer,
//         bidder: new PublicKey(bidData.bidder),
//     }
    
//     // const tx = await simulateBidSdk(liquidator, reserves, params);
//     console.log("TxId: ", tx);
// }

// async function simulateBidSdk(liquidator: any, reserves: HoneyReserve[], params: ExecuteBidParams) {
//     const bid = await liquidator.findBidAccount(params.market, params.bidder);
//     const bid_escrow = await liquidator.findEscrowAccount(params.market, params.bidder);
//     const bid_escrow_authority = await liquidator.findBidEscrowAuthorityAccount(bid_escrow.address);
//     const market_authority = await liquidator.findMarketAuthority(params.market);

//     const bumps = {
//       bid: bid.bumpSeed,
//       bidEscrow: bid_escrow.bumpSeed,
//       bidEscrowAuthority: bid_escrow_authority.bumpSeed,
//     };

//     const market = await liquidator.program.account.market.fetch(params.market);
//     const reserve = await liquidator.program.account.reserve.fetch(params.reserve);
//     const obligation = await liquidator.program.account.obligation.fetch(params.obligation);
//     const bidData = await liquidator.program.account.bid.fetch(bid.address);

//     // pay for these should be ther person getting liquidated
//     // @ts-ignore
//     const loanNoteAddress = await liquidator.findLoanNoteAddress(params.reserve, params.obligation, obligation.owner);
//     // @ts-ignore
//     const loanNoteMint = await liquidator.findLoanNoteMintAddress(params.reserve, reserve.tokenMint);
//     const vault = await liquidator.findVaultAddress(params.market, params.reserve);

//     // find the registered nft to liqudiate
//     const vaultedNFTMint = obligation.collateralNftMint[0];
//     const vaultedNFT: PublicKey = await getAssociatedTokenAddress(
//       // ASSOCIATED_TOKEN_PROGRAM_ID,
//       // TOKEN_PROGRAM_ID,
//       vaultedNFTMint,
//       market_authority.address,
//       true,
//     );

//     const receiverAccount: PublicKey = await getAssociatedTokenAddress(
//       // ASSOCIATED_TOKEN_PROGRAM_ID,
//       // TOKEN_PROGRAM_ID,
//       params.nftMint,
//       // @ts-ignore
//       bidData.bidder,
//     );

//     const liquidationFeeReceiver = await getAssociatedTokenAddress(
//       // ASSOCIATED_TOKEN_PROGRAM_ID,
//       // TOKEN_PROGRAM_ID,
//       // @ts-ignore
//       bidData.bidMint,
//       params.payer,
//     );

//     console.log('liquidationFeeReceiver', liquidationFeeReceiver.toString());

//     const leftoversReceiver = await getAssociatedTokenAddress(
//       // ASSOCIATED_TOKEN_PROGRAM_ID,
//       // TOKEN_PROGRAM_ID,
//       // @ts-ignore
//       bidData.bidMint,
//       bidData.bidder,
//     );
//     console.log('leftoversReceiver', leftoversReceiver.toString());
//     console.log('bid', bid.address.toString());
//     console.log('bidData.bidder', bidData.bidder.toString());

//     const refreshIx = await reserves[0].makeRefreshIx();
//     // const tx = new Transaction().add(refreshIx);

//     try {
//       // @ts-ignore
//       const result = await liquidator.program.methods.executeLiquidateBid(bumps)
//       .accounts({
//         market: params.market,
//         marketAuthority: market_authority.address,
//         obligation: params.obligation,
//         reserve: params.reserve,
//         vault: vault.address,
//         loanNoteMint: loanNoteMint.address,
//         loanAccount: loanNoteAddress.address,
//         collateralAccount: vaultedNFT,
//         bid: bid.address,
//         bidder: new PublicKey(bidData.bidder),
//         bidMint: new PublicKey(bidData.bidMint),
//         bidEscrow: new PublicKey(bidData.bidEscrow),
//         bidEscrowAuthority: bid_escrow_authority.address,
//         payerAccount: new PublicKey(bidData.bidEscrow),
//         nftMint: params.nftMint,
//         receiverAccount: receiverAccount,
//         liquidationFeeReceiver,
//         leftoversReceiver,
//         payer: params.payer,
//         // system accounts
//         tokenProgram: TOKEN_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//         rent: SYSVAR_RENT_PUBKEY,
//         systemProgram: SystemProgram.programId,
//       })
//       .preInstructions([refreshIx])
//       .simulate();

//       // const result = await liquidator.program.provider.sendAndConfirm(tx, [], { skipPreflight: true });
//       console.log(result);
//       return [TxnResponse.Success, [result]];
//     } catch(err) {
//       console.log('error', err)
//       return [TxnResponse.Failed, []];
//     }
//   }
// }
}

export {executeBid}