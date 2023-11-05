import {
  CachedReserveInfo,
  ObligationPositionStruct,
  getHealthStatus,
  NftPosition,
  TReserve,
  LiquidatorClient,
  TokenAmount,
  HoneyMarket,
  HoneyReserve,
  PositionInfoList,
} from "@honey-finance/sdk";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { HONEY_PROGRAM_ID, PNFT_MARKET_IDS_STRING } from "../constants";
import { initWrappers } from "../utils/initWrappers";
import { fetchMarketReserveInfo, fetchReserve } from "../utils/programUtils";
import { getOraclePrice } from "./switchboard";
import { fetchBidsOnChain } from "../helpers";
import { BN } from "@project-serum/anchor";
import { executeBid } from "../utils/liquidations/executeBid";
import { elixirLiquidate } from "../utils/liquidations/elixirLiquidate";
import { NATIVE_MINT } from "@solana/spl-token";

const cluster = "mainnet-beta";
// filter out closed bid in the bidding array and return the closest bid to the debt amount
function findClosestBid(bids, debtAmount) {
  let closestBid = null;
  let smallestDifference = Infinity;

  bids.forEach(bid => {
    const bidLimit = parseInt(bid.bidLimit, 10);

    if (isNaN(bidLimit)) {
      return; // Skip to the next bid
    }

    const difference = Math.abs(debtAmount - bidLimit);

    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestBid = bid;
    }
  });

  return closestBid;
}

const initLiquidation = async (
  markets: HoneyMarket[],
  wallet: Keypair,
  program: any
) => {
  console.log("initting liquidation");

  if (!wallet || !program) {
console.log("wallet and program not ready yet");
    return;
  }
  try {
      for (let i = 0; i < markets.length; i++) {
    // inits the honey objects and Anchor provider
    const { client, provider } = await initWrappers(
      wallet,
      cluster,
      HONEY_PROGRAM_ID.toString(),
      markets[i].address.toString()
    );

    // fetches CachedReserveInfo
    const marketReserveInfo: CachedReserveInfo[] = await fetchMarketReserveInfo(
      client.program,
      markets[i].address
    );
    // fetches TReserve
    const reserveInfo: TReserve = await fetchReserve(
      client,
      marketReserveInfo[0]
    );
    // creates an instance of the Liquidator client
    const liquidatorClient = new LiquidatorClient(program);
    // fetching bids on chain
    const bids = await fetchBidsOnChain(markets[i].address);

    // fetch all obligations of a specific market
    let obligations = await markets[i].fetchObligations();
    // fetch oracle prices
    const solPriceUsd = await getOraclePrice(
      cluster,
      liquidatorClient.conn,
      reserveInfo.switchboardPriceAggregator
    );
    const nftPriceUsd = await getOraclePrice(
      cluster,
      liquidatorClient.conn,
      markets[i].nftSwitchboardPriceAggregator
    );
    // set nft price to be usd if market is usdc | if not set to be 
    const nftPrice = reserveInfo.exponent === -6 ?  nftPriceUsd : nftPriceUsd / solPriceUsd;
    // declare the array for risky positions
    let riskyPositions: NftPosition[] = [];

    // if there are obligations we need to validate if they are risky
    if (obligations) {
      // loop through each obligation
      for (let index = 0; index < obligations.length; index++) {
        const obligation = obligations[index];
        console.log('@@-- obligation', obligation.publicKey.toString())

        let nftMints: PublicKey[] = obligation.account.collateralNftMint;
        const nft = nftMints[0];
        // filter out default PKs
        if (nft === PublicKey.default) {
          console.log("not nft data");
          continue;
        }

        const parsePosition = (position: any) => {
          const pos: ObligationPositionStruct = {
            account: new PublicKey(position.account),
            amount: new BN(position.amount),
            side: position.side,
            reserveIndex: position.reserveIndex,
            _reserved: [],
          };
          return pos;
        };

        obligation.account.loans = PositionInfoList.decode(
          Buffer.from(obligation.account.loans as any as number[])
        ).map(parsePosition);
        // console.log(obligation.account.collateralNftMint);
        const multiplier = obligation.account.collateralNftMint.filter(
          (key) => key.toString() != PublicKey.default.toString()
        ).length;

        const honeyReserveMarketObject = new HoneyReserve(
          client,
          markets[i],
          marketReserveInfo[0].reserve
        );
        await honeyReserveMarketObject.refresh();
        const { minCollateralRatio } =
          honeyReserveMarketObject.getReserveConfig();
        const loanNoteBalance: TokenAmount = new TokenAmount(
          obligation.account?.loans[0]?.amount,
          -reserveInfo.exponent
        );

        let totalDebt = loanNoteBalance
          .mulb(marketReserveInfo[0].loanNoteExchangeRate)
          .divb(new BN(Math.pow(10, 15)).mul(new BN(Math.pow(10, 6))))
        
        // check if USDC market or SOL - if USDC, we divide totalDebt.uiAmountFloat by 1000
        if (reserveInfo.tokenMint.toString() != NATIVE_MINT.toString()) {
          totalDebt.uiAmountFloat = totalDebt.uiAmountFloat / 10**3;
        }
        
        // TODO: should be removed - is not scoped to USDC market
        const health: string = getHealthStatus(
          totalDebt.uiAmountFloat,
          nftPrice
        );

        const totalDebtInLamports = new BN(totalDebt.uiAmountFloat * LAMPORTS_PER_SOL);

        
        const closestBid = await findClosestBid(bids, totalDebtInLamports);
        const is_risky =
          totalDebt.uiAmountFloat / (nftPrice * multiplier) >=
          10000 / minCollateralRatio;

          // console.log('@@-- closed bid', closestBid)
          
        if (is_risky) {
          if (reserveInfo.tokenMint.toString() != NATIVE_MINT.toString()) {
            if (totalDebtInLamports > closestBid.bidLimit) {
              // if no bid is greater than debt we dont execute liq.
              return;
            } else {
                // liquidation in non SOL market
                const highestBid = closestBid
                
                let position: NftPosition = {
                  obligation: obligation.publicKey.toString(),
                  debt: totalDebt.uiAmountFloat,
                  nft_mint: new PublicKey(nft),
                  owner: obligation.account.owner,
                  ltv: 40,
                  is_healthy: health,
                  highest_bid: highestBid.bidLimit / 10**6,
                };

                riskyPositions.push(position);

                await executeBid(
                  liquidatorClient,
                  markets[i].address.toString(),
                  position.obligation,
                  marketReserveInfo[0].reserve.toString(),
                  obligation.account.collateralNftMint[0].toString(),
                  (highestBid.bid / 10**6).toString(),
                  wallet.publicKey, // new PublicKey(highestBid.bidder),
                  wallet,
                  cluster,
                  HONEY_PROGRAM_ID.toString(),
                  obligation.account.owner.toString(),
                  totalDebt.uiAmountFloat,
                  PNFT_MARKET_IDS_STRING.includes(markets[i].address.toString()),
                );
            }
          }
            else {
              if (totalDebtInLamports > closestBid.bidLimit) {
                // if no bid is greater than debt we dont execute liq.
                return;
              } else {

                  const highestBid = closestBid;

                  if (highestBid.bidLimit == 0) return;

                  // TODO: @yuri - why default ltv of 40?
                  let position: NftPosition = {
                    obligation: obligation.publicKey.toString(),
                    debt: totalDebt.uiAmountFloat,
                    nft_mint: new PublicKey(nft),
                    owner: obligation.account.owner,
                    ltv: 40,
                    is_healthy: health,
                    highest_bid: highestBid.bidLimit,
                  };

                  riskyPositions.push(position);
                  await executeBid(
                    liquidatorClient,
                    markets[i].address.toString(),
                    position.obligation,
                    marketReserveInfo[0].reserve.toString(),
                    obligation.account.collateralNftMint[0].toString(),
                    highestBid,
                    wallet.publicKey,
                    wallet,
                    cluster,
                    HONEY_PROGRAM_ID.toString(),
                    obligation.account.owner.toString(),
                    totalDebt.uiAmountFloat,
                    PNFT_MARKET_IDS_STRING.includes(markets[i].address.toString()),

                  );
                }
              }
          }
        }
      }
    }
  } catch (error) {
        console.log(`Error running Liquidation: ${error}`);
  }
};

export { initLiquidation };
