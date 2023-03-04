export const verifiedCreator = '6vRx1iVZo3xfrBHdpvuwArL2jucVj9j9nLpd2VUTTGMG';
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
const config = dotenv.config();
const DEFAULT_MAINNET_CLUSTER = process.env.DEFAULT_MAINNET_CLUSTER || '';
console.log('@@-- default mainnet cluster', DEFAULT_MAINNET_CLUSTER)
const MAINNET_RPC_ENDPOINT = config.parsed ? config.parsed.MAINNET_RPC_ENDPOINT : DEFAULT_MAINNET_CLUSTER;

export const HONEY_PROGRAM_ID = new PublicKey(
    "hNEYyRsRBVq2La65V1KjvdbTE39w36gwrdjkmcpvysk"
);

export const HONEY_MARKET_IDS = [
  new PublicKey('6FcJaAzQnuoA6o3sVw1GD6Ba69XuL5jinZpQTzJhd2R3'),// Honey Gen
  new PublicKey('Bw77MGpg189EaATjN67WXcnp3c4544LhKoV4Ftmdg4C'),// Pesky Penguins
  new PublicKey('H2H2pJuccdvpET9A75ajB3GgdYdCUL4T3kiwUMA6DJ7q'),// Lifinity flares
  new PublicKey('Bxk1JQCbVjpeFnjzvH5n9bepnZeHjRADUFwZiVC7L5Gq'),// OG Atadians
  new PublicKey('F8rZviSSuqgkTsjMeoyrTUSNSqh7yNDCAozJkxm7eujY'),// Burrito
  new PublicKey('GrKPvcdHVb4cwR5a2CCgCTvdkSqhNDRgSUiUVzXRWLk6'), // Blocksmith
  new PublicKey('5UKRRSxbi4PgPnQU2ZqtukUxd1fyN6ydn1hoxivP46A8'), // Ovols
  new PublicKey('GAqyPziKPwVpwKaeqPhEsxiy6MwQ2bvtodruWErpLVKo'), // Droids
  new PublicKey('2dxJ4eMkhMxm1ZqpAhKsjunvyziuq1JRnuHaqKFRY8et'), // Vandals
  new PublicKey('FTBLaLcrx1aXALW2UEpu8a6HLRVFATezkK12wCABPAiA'), // Ukiyo
  new PublicKey('Dmngi1MDEQU9fm6sX39EuyT3EpYEmXYuyg56uEjVCkD6'), // Marshies
  new PublicKey('5ZxAjKpbYje5fCxhvnRYxbMh6XSZm5Cd7RA9mMGb1DLY'), // Heavenland 
  new PublicKey('7pfaZcAqpWRHpEqGMwPQrn5tj5WVQ48F4PrAtFLuS1P7'), // Drunken Ape Social Club
];

export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
export const SOL_ADDRESS = new PublicKey("So11111111111111111111111111111111111111112")
export const SVT_MINT_ADDRESS = new PublicKey("svtMpL5eQzdmB3uqK9NXaQkq8prGZoKQFNVJghdWCkV");//droplet mint address for certain nft collection

type Cluster = {
    name: string;
    url: string;
  };
export const CLUSTERS: Cluster[] = [
  {
    name: 'mainnet-beta',
    url: MAINNET_RPC_ENDPOINT,
  },
  {
    name: 'testnet',
    url: clusterApiUrl('testnet'),
  },
  {
    name: 'devnet',
    url: clusterApiUrl('devnet'),
  },
  {
    name: 'localnet',
    url: "http://localhost:8899"
  }
];
export const DEFAULT_CLUSTER = CLUSTERS[2];
