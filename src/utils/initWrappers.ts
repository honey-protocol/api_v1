import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { HoneyClient, HoneyMarket, HoneyReserve, HoneyUser } from "@honey-finance/sdk";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { CLUSTERS } from "../constants";
/**
 * @description fetches market specific data
 * @params wallet | cluster | honey program id | market public key
 * @returns honey client | honey market | honey user | honey reserves | anchor provider
*/
const initWrappers = async (wallet: Keypair, env: string, honeyProgramId: string, marketPkString: string) => {

    const mainnetConn = new Connection(
        CLUSTERS[0].url
    );
    const connection = env === 'devnet' ? new Connection("https://api.devnet.solana.com") : mainnetConn;
    // console.log('initting wrappers for market', marketPkString);

    const walletWrapper = new NodeWallet(wallet);
    const provider = new anchor.AnchorProvider(connection, walletWrapper, anchor.AnchorProvider.defaultOptions());

    const client: HoneyClient = await HoneyClient.connect(provider, honeyProgramId, env === 'devnet');

    const marketPk = new PublicKey(marketPkString);
    const market: HoneyMarket = await HoneyMarket.load(client, marketPk);
    
    const reserves: HoneyReserve[] = market.reserves.map(
        (reserve) =>  new HoneyReserve(client, market, reserve.reserve)
    ).filter(reserve => !reserve.reserve.equals(PublicKey.default));
    await Promise.all(
        reserves.map(async (reserve) => {
            if (reserve.reserve && reserve.reserve.toBase58() !== PublicKey.default.toBase58()) await reserve.refresh();
        }),
    );
    const user = await HoneyUser.load(client, market, wallet.publicKey, reserves);
    // console.log('initting finished!');
    return { client, market, user, reserves, provider }
}

export {initWrappers}