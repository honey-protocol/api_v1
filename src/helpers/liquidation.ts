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
import { Keypair, PublicKey } from "@solana/web3.js";
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
    // sorts bids by amount
    const sortedBids = bids.sort((a, b) => a.bidLimit - b.bidLimit);
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
    // console.log('@@-- market', markets[i].address.toString())

    // if (markets[i].address.toString() === 'HxuWzw18mR93RmxPkPu8RCD8kjrSJxo7WyaaKHu5NQEZ') {
    //   // if (obligations.owner.toString
    //   console.log('@@-- obligations', obligations)
    // }
    // if there are obligations we need to validate if they are risky
    if (obligations) {
      // loop through each obligation
      for (let index = 0; index < obligations.length; index++) {
        const obligation = obligations[index];

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

        // // if (markets[index].address.toString() === 'A5FZGzNiHZEJ8qxzMjUs2Dxtz8oFi2wTrrvhoxYH3e7m') {
        //   if (obligation.account.owner.toString() === '9LqWBRfn2UJ7WF4v6NhEsYQD79iMkCLujCSj8KfXJua2' && 
        //     obligation.account.market.toString() === 'A5FZGzNiHZEJ8qxzMjUs2Dxtz8oFi2wTrrvhoxYH3e7m'
        //   ) {
        //     console.log('@@-- obligation', obligation, totalDebt)
        //   }
        // // }
        
        // TODO: should be removed - is not scoped to USDC market
        const health: string = getHealthStatus(
          totalDebt.uiAmountFloat,
          nftPrice
        );

        // obligations.map((obligation) => {
          if (obligation.account.owner.toString()  === '9LqWBRfn2UJ7WF4v6NhEsYQD79iMkCLujCSj8KfXJua2') {
              console.log('@@-- obligation debt', totalDebt.uiAmountFloat);
              console.log('@@-- nft price', nftPrice.toString());
              console.log('@@-- multiplier', multiplier);
              console.log('@@-- min coll ratio', minCollateralRatio);
          }

        const is_risky =
          totalDebt.uiAmountFloat / (nftPrice * multiplier) >=
          10000 / minCollateralRatio;
        
          if (obligation.account.owner.toString() === '9LqWBRfn2UJ7WF4v6NhEsYQD79iMkCLujCSj8KfXJua2') {
            console.log('@@-- is risky', is_risky, totalDebt.uiAmountFloat)
          }
        if (is_risky) {

          if (reserveInfo.tokenMint.toString() != NATIVE_MINT.toString()) {
            console.log('@@-- USDC market liquidation');
            if (totalDebt.uiAmountFloat > sortedBids[0].bidLimit) {
                // if there is no bid, execute solvent liquidation
                console.log("executing elixir liquidation");
                await elixirLiquidate(
                  provider,
                  program,
                  wallet,
                  markets[i].address.toString(),
                  cluster,
                  HONEY_PROGRAM_ID.toString(),
                  obligation.account.owner.toString(),
                  nft.toString(),
                  totalDebt.uiAmountFloat
                );
            } else {
                const highestBid = sortedBids.pop();
                // TODO: @yuri - why default ltv of 40?
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
                console.log("execute auction liquidation");

                await executeBid(
                  liquidatorClient,
                  markets[i].address.toString(),
                  position.obligation,
                  marketReserveInfo[0].reserve.toString(),
                  obligation.account.collateralNftMint[0].toString(),
                  (highestBid.bid / 10**6).toString(),
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
            else {
              console.log('@@-- SOL market liquidation')
              if (totalDebt.uiAmountFloat > sortedBids[0].bidLimit) {
                // if there is no bid, execute solvent liquidation
                console.log("executing elixir liquidation");
                await elixirLiquidate(
                  provider,
                  program,
                  wallet,
                  markets[i].address.toString(),
                  cluster,
                  HONEY_PROGRAM_ID.toString(),
                  obligation.account.owner.toString(),
                  nft.toString(),
                  totalDebt.uiAmountFloat
                );
              } else {
                  const highestBid = sortedBids.pop();
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
                  console.log("execute auction liquidation");

                  await executeBid(
                    liquidatorClient,
                    markets[i].address.toString(),
                    position.obligation,
                    marketReserveInfo[0].reserve.toString(),
                    obligation.account.collateralNftMint[0].toString(),
                    // (highestBid.bid / 10**6).toString(),
                    highestBid.bid,
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
