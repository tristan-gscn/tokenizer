import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC ?? "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY ?? "";

// Hardhat rejects an empty string in `accounts` when it loads the config, which
// would break every task. Only register the deployer when a key is present.
const accounts = PRIVATE_KEY.length > 0 ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },

  paths: {
    sources: "./code",
    tests: "./test",
  },

  networks: {
    bscTestnet: {
      url: BSC_TESTNET_RPC,
      chainId: 97,
      accounts,
    },
  },

  // Source verification. The key must be a plain string, not an object keyed by
  // network: hardhat-verify treats a string as an etherscan.io key and calls the
  // unified v2 API, while the object form selects the per-explorer v1 API that
  // was shut down in 2025. bscTestnet is a built-in chain, so no customChains.
  etherscan: {
    apiKey: BSCSCAN_API_KEY,
  },
};

export default config;
