import {
  Amount,
  HoneyReserve,
  parseObligationAccount,
} from "@honey-finance/sdk";
import * as fetch from "node-fetch";
import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  // @ts-ignore
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { initWrappers } from "../initWrappers";
import { getAssociatedTokenAddress } from "@solana/spl-token-v2";
import { findMarketAuthorityAddress } from "../../helpers/web3";

import { Idl, Program } from "@project-serum/anchor";

import { HONEY_PROGRAM_ID, SOL_ADDRESS } from "../../constants";
import { Vault } from "./elixir/program";
import { elixirSell } from "./elixir/functions/sell";
import { BRIDGESPLIT_API, PROGRAM_IDS } from "./elixir/utils/constants";

import idl from "./elixir/idl/idl.json";

async function getPriceAndPoolMintFromElixir(
  nft_name: string
): Promise<[number, string]> {
  const elixir_request = await fetch(`https://api.bridgesplit.com/prices`, {
    method: "GET",
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
  const elixir_data = await elixir_request.json();
  // console.log(elixir_data);

  for (const object of elixir_data) {
    if (object.id === nft_name) {
      console.log(`${nft_name} price = `, object.sell.price);
      return [object.sell.price, object.mint];
    }
  }
  return [0, ""];
}

export async function elixirLiquidate(
  provider: anchor.AnchorProvider,
  honeyProgram: anchor.Program,
  wallet: Keypair,
  marketPkString: string,
  env: string,
  nftMint: string,
  depositor: string,
  nft_name: string,
  slippage_bps: number,
  verifiedCreator?: string
): Promise<void> {
  const [minimumSol, poolMintAddress] = await getPriceAndPoolMintFromElixir(
    nft_name
  );
  const poolMint = new PublicKey(poolMintAddress);
  console.log("minimum sol = ", minimumSol);
  console.log("poolMint = ", poolMintAddress);
  // const program = await loadHoneyProgram(wallet, env);
  const { client, user, reserves } = await initWrappers(
    wallet,
    env,
    honeyProgram.programId.toString(),
    marketPkString
  );

  // 1. Withdraw nft from HoneyProgram to DAO
  const nftATA: PublicKey | undefined = await getAssociatedTokenAddress(
    new PublicKey(nftMint),
    wallet.publicKey
  );

  if (!nftATA) {
    console.error(`Could not find the associated token account: ${nftATA}`);
    return;
  } else {
    console.log("associatedTokenAccount", nftATA.toString());
  }

  const nftMintPk = new PublicKey(nftMint);
  // Create the wallet token account if it doesn't exist
  const createTokenAccountIx = createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    nftMintPk,
    nftATA,
    wallet.publicKey,
    wallet.publicKey
  );
  try {
    const txNewAccount = await provider.sendAndConfirm(
      new Transaction().add(createTokenAccountIx),
      [],
      { skipPreflight: true }
    );
    console.log("txNewAccount", txNewAccount);
  } catch (e) {
    console.log("Account already exists!");
  }

  const vfCreator = verifiedCreator
    ? new PublicKey(verifiedCreator)
    : wallet.publicKey;
  const txid = await user.withdrawNFTSolvent(
    nftATA,
    nftMintPk,
    new PublicKey(depositor),
    vfCreator
  );
  console.log("withdraw transaction", txid);

  const elixir_request = await fetch(
    `${BRIDGESPLIT_API}/token/lookup_table/${poolMintAddress}`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    }
  );
  const elixir_data = await elixir_request.json();

  const lookupTableArray = elixir_data.addresses;
  let lookupTableAddresses: Array<PublicKey> = [];
  const length = lookupTableArray.length;

  for (var i = 0; i < length; i++) {
    lookupTableAddresses.push(new PublicKey(lookupTableArray[i]));
  }
  const lookup_table: PublicKey = new PublicKey(elixir_data.address);

  const balance_before = await provider.connection.getBalance(
    provider.publicKey
  );
  console.log("wallet balance before elixir sell = ", balance_before);

  // 2. sell NFT in Elixir
  const { transactions } = await elixirSell(
    {
      provider: provider,
      wallet: new anchor.Wallet(wallet),
      vault: PROGRAM_IDS.vault,
      program: new Program<Vault>(idl as Vault, PROGRAM_IDS.vault, provider),
      idl: idl as Vault,
    },
    new PublicKey(nftMint),
    poolMint,
    lookupTableAddresses,
    lookup_table,
    true,
    minimumSol
  );

  for (const tx of transactions) {
    tx.sign([wallet]);
    try {
      const sx = await provider.connection.sendTransaction(tx);

      console.log(`** -- Elixir Signature: ${sx}`);
      await provider.connection.confirmTransaction(sx, "confirmed");
    } catch (e) {
      console.log("error sending elixirSell transactions", e);
    }
  }

  const balance_after = await provider.connection.getBalance(
    provider.publicKey
  );
  const solAmount = Amount.tokens(balance_after - balance_before);
  console.log(
    "wallet balance after elixir sell = ",
    solAmount.value.toString()
  );

  if (minimumSol > 0 && solAmount.value.gten(minimumSol)) {
    // let indexATA = await getAssociatedTokenAddress(
    //   poolMint,
    //   wallet.publicKey
    // );

    // // Get index balance in the server wallet
    // const indexAmount = (await provider.connection.getTokenAccountBalance(
    //   indexATA,
    //   "processed"
    // )).value.amount;

    // console.log('indexAmount', indexAmount);

    // // 3. Swap index through Jupiter
    // const jupiter = await Jupiter.load({
    //   connection: provider.connection,
    //   cluster: env as Cluster,
    //   user: wallet, // or public key
    //   // platformFeeAndAccounts:  NO_PLATFORM_FEE,
    //   routeCacheDuration: 10_000, // Will not refetch data on computeRoutes for up to 10 seconds
    // });

    // const routes = await jupiter.computeRoutes({
    //   inputMint: poolMint, // Mint address of the input token
    //   outputMint: SOL_ADDRESS, // Mint address of the output token
    //   amount: JSBI.BigInt(indexAmount), // raw input amount of tokens
    //   slippageBps: slippage_bps, // The slippage in % terms
    //   forceFetch: false // false is the default value => will use cache if not older than routeCacheDuration
    // });

    // // Prepare execute exchange
    // const { execute } = await jupiter.exchange({
    //   routeInfo: routes.routesInfos[0],
    // });

    // // Execute swap
    // const swapResult: any = await execute();

    // const solAmount = Amount.tokens(swapResult.outputAmount);

    //4. Update onchain data of HoneyProgram
    const reserve: HoneyReserve = reserves.filter((reserve: HoneyReserve) =>
      reserve?.data?.tokenMint.equals(SOL_ADDRESS)
    )[0];
    console.log("reserve", reserve.reserve.toString());

    const [obligationAddress, obligationBump] =
      await PublicKey.findProgramAddress(
        [
          Buffer.from("obligation"),
          new PublicKey(marketPkString).toBuffer(),
          new PublicKey(depositor).toBuffer(),
        ],
        HONEY_PROGRAM_ID
      );
    const obligationData = await provider.connection.getAccountInfo(
      obligationAddress
    );
    if (!obligationData) {
      console.log("Wrong depositor address!");
      return;
    }
    const obligation = parseObligationAccount(
      obligationData.data,
      client.program.coder
    );

    console.log("obligation.owner", obligation.owner.toString());

    const derivedAccounts = await HoneyReserve.deriveAccounts(
      client,
      reserve.reserve,
      SOL_ADDRESS
    );
    const loanNoteMint = derivedAccounts.loanNoteMint;
    const vault = derivedAccounts.vault;
    const [loanAccountPK, loanAccountBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("loan"),
        reserve.reserve.toBuffer(),
        obligationAddress.toBuffer(),
        obligation.owner.toBuffer(),
      ],
      HONEY_PROGRAM_ID
    );
    console.log("loanAccount", loanAccountPK.toString());
    let [marketAuthority] = await findMarketAuthorityAddress(
      new PublicKey(marketPkString)
    );
    const collateralAddress = await getAssociatedTokenAddress(
      nftMintPk,
      marketAuthority,
      true
    );

    const refreshIx = await reserves[0].makeRefreshIx();
    const liquidateTx = new Transaction().add(refreshIx);

    const ix = await client.program.instruction.liquidateSolvent(solAmount, {
      accounts: {
        market: marketPkString,
        reserve: reserve.reserve,
        vault: vault.address,
        obligation: obligationAddress,
        loanNoteMint: loanNoteMint.address,
        loanAccount: loanAccountPK,
        marketAuthority: marketAuthority,
        nftMint: nftMintPk,
        collateralAccount: collateralAddress,
        executor: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });
    liquidateTx.add(ix);

    try {
      const liquidateTxid = await provider.sendAndConfirm(liquidateTx, [], {
        skipPreflight: true,
      });
      console.log("liquidated!", liquidateTxid);
    } catch (err) {
      console.log("Error executing liquidateElixir", err);
    }
  } else {
    console.log("failed to sell");
  }
}
