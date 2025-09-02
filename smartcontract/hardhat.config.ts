import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const { ALCHEMY_SEPOLIA_API_KEY_URL, ACCOUNT_PRIVATE_KEY, ETHERSCAN_API_KEY} = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Low runs value to prioritize smaller bytecode
      },
      debug: {
        revertStrings: "strip", // Remove revert strings to reduce bytecode size
      },
    },
  },
  networks:{
    sepolia:{
      url: ALCHEMY_SEPOLIA_API_KEY_URL,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`]
    },
    sonicTestnet: {
      url: ALCHEMY_SEPOLIA_API_KEY_URL,
      accounts: [`0x${ACCOUNT_PRIVATE_KEY}`]
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY || "",
      sonicTestnet: ETHERSCAN_API_KEY || ""
    },
  },
};

export default config;
