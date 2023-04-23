// import { NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
import { CLUSTERS, DEFAULT_CLUSTER, HONEY_PROGRAM_ID } from "../constants";
import * as anchor from '@project-serum/anchor';
import { DerivedAccount, ReserveConfig, ToBytes } from "@honey-finance/sdk";

type DerivedAccountSeed = HasPublicKey | ToBytes | Uint8Array | string;

export async function findBidAccount(market: PublicKey, bidder: PublicKey): Promise<DerivedAccount> {
    return await findDerivedAccount(["bid", market, bidder]);
}

/**
    * Find a PDA
    * @param seeds
    * @returns
*/
export async function findDerivedAccount(seeds: DerivedAccountSeed[]): Promise<DerivedAccount> {
    const seedBytes = seeds.map((s) => {
        if (typeof s === 'string') {
            return Buffer.from(s);
        } else if ('publicKey' in s) {
            return s.publicKey.toBytes();
        } else if ('toBytes' in s) {
            return s.toBytes();
        } else {
            return s;
        }
    });
    const [address, bumpSeed] = await PublicKey.findProgramAddress(seedBytes, HONEY_PROGRAM_ID);
    return new DerivedAccount(address, bumpSeed);
}

export function getCluster(name: string): string {
    for (const cluster of CLUSTERS) {
        if (cluster.name === name) {
            return cluster.url;
        }
    }
    return DEFAULT_CLUSTER.url;
}
export async function findMarketAuthorityAddress(market: PublicKey) {
    return PublicKey.findProgramAddress(
        [market.toBuffer()],
        HONEY_PROGRAM_ID
    );
}

interface HasPublicKey {
    publicKey: PublicKey;
}
/**
 * Convert some object of fields with address-like values,
 * such that the values are converted to their `PublicKey` form.
 * @param obj The object to convert
 */
export function toPublicKeys(obj: Record<string, string | PublicKey | HasPublicKey>): any {
    const newObj: Record<string, string | PublicKey | HasPublicKey> = {};

    for (const key in obj) {
        const value = obj[key];

        if (typeof value == "string") {
            newObj[key] = new PublicKey(value);
        } else if ('publicKey' in value) {
            newObj[key] = value.publicKey;
        } else {
            newObj[key] = value;
        }
    }

    return newObj;
}

// export class TestToken extends Token {
//     decimals: number;

//     constructor(conn: Connection, token: Token, decimals: number) {
//         super(conn, token.publicKey, token.programId, token.payer);
//         this.decimals = decimals;
//     }

//     /**
//      * Convert a token amount to the integer format for the mint
//      * @param token The token mint
//      * @param amount The amount of tokens
//      */
//     // amount(amount: u64 | number): u64 {
//     //     if (typeof amount == "number") {
//     //         amount = new u64(amount);
//     //     }

//     //     const one_unit = new u64(10).pow(new u64(this.decimals));
//     //     const value = amount.mul(one_unit);

//     //     return amount.mul(one_unit);
//     // }
// }

// export async function createNativeToken(conn: Connection, authority: Keypair) {
//     const token = new Token(
//         conn,
//         NATIVE_MINT,
//         TOKEN_PROGRAM_ID,
//         authority as Signer
//     );

//     return new TestToken(conn, token, 9);
// }
// TODO: validate with Brian if values are still correct
// export const reserveConfig = {
//     utilizationRate1: 8500,
//     utilizationRate2: 9500,
//     borrowRate0: 20000,
//     borrowRate1: 20000,
//     borrowRate2: 20000,
//     borrowRate3: 20000,
//     minCollateralRatio: 12500,
//     liquidationPremium: 100,
//     manageFeeRate: 50,
//     manageFeeCollectionThreshold: new anchor.BN(10),
//     loanOriginationFee: 10,
//     liquidationSlippage: 300,
//     liquidationDexTradeMax: new anchor.BN(100),
//     confidenceThreshold: 200,
// } as ReserveConfig;