import { HoneyClient, CachedReserveInfo, HoneyReserve, TReserve } from "@honey-finance/sdk";
import { Program, AnchorProvider } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs";
import { CLUSTERS, HONEY_PROGRAM_ID } from "../constants";
var web3 = require("@solana/web3.js");
/**
 * @description fetches the reserve info of a specific market
 * @params honey program | market ID
 * @returns promise -> CachedReserveInfo
*/
const fetchMarketReserveInfo = async (honeyProgram: any, marketId: PublicKey): Promise<CachedReserveInfo[]> => {
  // market info
  const marketValue = await honeyProgram.account.market.fetch(marketId);
  // reserve info
  // const reserveInfoData = new Uint8Array(marketValue.reserves as any as number[]);
  // const reserveInfoList = MarketReserveInfoList.decode(reserveInfoData) as CachedReserveInfo[];
  
  return marketValue.reserves;
}
/**
 * @description fetches TReserve
 * @params HoneyClient | CachedReserveInfo
 * @returns promise -> data object from TReserve
*/
const fetchReserve = async (client: HoneyClient, reserveInfo: CachedReserveInfo): Promise<TReserve> => {
    if (reserveInfo.reserve.equals(PublicKey.default)) {
      throw new Error("wrong reserve!");
    };
    //   console.log('reserve', reserveInfo.reserve.toString());
    const data = await HoneyReserve.decodeReserve(client, reserveInfo.reserve);
    //   console.log("reserves data", data);
    return data;
}
/**
 * @description loads wallet key
 * @params keypair
 * @returns keypair
*/
const loadWalletKey = (keypair: any) => {
  if (!keypair || keypair == '') {
    throw new Error('Keypair is required!');
  }
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(keypair).toString())),
  );
  // console.log(`wallet public key: ${loaded.publicKey}`);
  return loaded;
}
/**
 * @description inits honey program
 * @params walletKeyPair | cluster 
 * @returns
*/
const loadHoneyProgram = async (walletKeyPair: Keypair, cluster: string) => {
  const solConnection = new Connection(
    cluster == "mainnet-beta"? CLUSTERS[0].url: web3.clusterApiUrl(cluster),
  );

  const walletWrapper = new NodeWallet(walletKeyPair);
  const provider = new AnchorProvider(solConnection, walletWrapper, AnchorProvider.defaultOptions(),);
  console.log('fetchingIDL of', HONEY_PROGRAM_ID.toString());
  const idl = await Program.fetchIdl(HONEY_PROGRAM_ID, provider)!;
  const program = new Program(idl as any, HONEY_PROGRAM_ID, provider);
  // console.log('program id from anchor', program.programId.toBase58());
  return program;
}

const roundHalfDown = (val: number, decimals: number = 2): number => {
  return Math.floor(val * 10 ** decimals) / 10 ** decimals;
}

export {fetchMarketReserveInfo, fetchReserve, loadWalletKey, loadHoneyProgram, roundHalfDown}