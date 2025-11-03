import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import {
  createPublicClient,
  createWalletClient,
  http,
  webSocket,
  PublicClient,
  WalletClient,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const {
  NODE_ENV,
  PRIVATE_KEY,
  BASE_RPC_URL
} = process.env;

if (!PRIVATE_KEY) {
  throw new Error(`Missing .env.${NODE_ENV}: PRIVATE_KEY`);
}

export function createClients(options?: { network?: "mainnet" | "testnet" }): {
  publicClient: PublicClient;
  deployer: WalletClient;
  account: any;
  chainId: typeof base | typeof baseSepolia;
} {
  const isMainnet = NODE_ENV === "production";
  const chainId = isMainnet ? base : baseSepolia;
  const rpcUrl = BASE_RPC_URL;

  if (!rpcUrl) {
    throw new Error(`Missing BASE_RPC_URL in .env.${NODE_ENV}`);
  }

  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

  const publicClient = createPublicClient({
    chain: chainId,
    transport: http(),
  });

  const deployer = createWalletClient({
    account,
    chain: chainId,
    transport: http(),
  });

  return {
    publicClient: publicClient as PublicClient & { account: undefined },
    deployer,
    account,
    chainId,
  };
}
