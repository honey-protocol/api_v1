import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
    AggregatorAccount,
    loadSwitchboardProgram,
  } from "@switchboard-xyz/switchboard-v2";

export async function getOraclePrice(cluster: "devnet" | "mainnet-beta" = "devnet", connection: Connection, aggregatorKey: PublicKey): Promise<any> {
    // load the switchboard program
    const program = await loadSwitchboardProgram(
      cluster,
      connection,
      // Keypair.fromSeed(new Uint8Array(32).fill(1)) // using dummy keypair since we wont be submitting any transactions
    );
  
    // load the switchboard aggregator
    const aggregator = new AggregatorAccount({
      program,
      publicKey: aggregatorKey,
    });
  
    // get the result
    const result = await aggregator.getLatestValue();
    // console.log(`Switchboard Result: ${result}`);
    return result;
  }