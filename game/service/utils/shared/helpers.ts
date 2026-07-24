import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import {
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
  Chain,
} from "viem";
import { base, baseSepolia, celo, celoSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const { NODE_ENV, PRIVATE_KEY } = process.env;

if (!PRIVATE_KEY) {
  throw new Error(`Missing .env.${NODE_ENV}: PRIVATE_KEY`);
}

interface ChainRegistryEntry {
  chain: Chain;
  escrowEnvKey: string;
  usdcEnvKey: string;
}

const CHAIN_REGISTRY: Record<string, ChainRegistryEntry> = {
  base: {
    chain: base,
    escrowEnvKey: "BASE_FLAMINGO_ESCROW_ADDRESS",
    usdcEnvKey: "BASE_USDC_ADDRESS",
  },
  "base-sepolia": {
    chain: baseSepolia,
    escrowEnvKey: "BASE_SEPOLIA_FLAMINGO_ESCROW_ADDRESS",
    usdcEnvKey: "BASE_SEPOLIA_USDC_ADDRESS",
  },
  celo: {
    chain: celo,
    escrowEnvKey: "CELO_FLAMINGO_ESCROW_ADDRESS",
    usdcEnvKey: "CELO_USDC_ADDRESS",
  },
  "celo-sepolia": {
    chain: celoSepolia,
    escrowEnvKey: "CELO_SEPOLIA_FLAMINGO_ESCROW_ADDRESS",
    usdcEnvKey: "CELO_SEPOLIA_USDC_ADDRESS",
  },
};

export function getActiveChainKey(): string {
  const key = (process.env.CHAIN || "celo-sepolia").toLowerCase();
  if (!CHAIN_REGISTRY[key]) {
    throw new Error(
      `Unknown CHAIN "${key}". Expected one of: ${Object.keys(CHAIN_REGISTRY).join(", ")}`
    );
  }
  return key;
}

export interface ActiveChainConfig {
  chain: Chain;
  escrowAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
}

export function getChainConfig(): ActiveChainConfig {
  const key = getActiveChainKey();
  const entry = CHAIN_REGISTRY[key];

  const escrowAddress = process.env[entry.escrowEnvKey];
  const usdcAddress = process.env[entry.usdcEnvKey];

  if (!escrowAddress || !usdcAddress) {
    throw new Error(
      `Missing contract addresses for chain "${key}": set ${entry.escrowEnvKey} and ${entry.usdcEnvKey} in .env.${NODE_ENV}`
    );
  }

  return {
    chain: entry.chain,
    escrowAddress: escrowAddress as `0x${string}`,
    usdcAddress: usdcAddress as `0x${string}`,
  };
}

export function createClients(): {
  publicClient: PublicClient;
  deployer: WalletClient;
  account: any;
  chainId: Chain;
} {
  const { chain } = getChainConfig();

  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const deployer = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  return {
    publicClient: publicClient as PublicClient & { account: undefined },
    deployer,
    account,
    chainId: chain,
  };
}
