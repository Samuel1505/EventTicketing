import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

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
  // networks: {
  //   sonicTestnet: {
  //     url: "https://rpc.testnet.soniclabs.com",
  //     chainId: 64165,
  //     accounts: [process.env.SONIC_PRIVATE_KEY || ""],
  //   },
  // },
  // etherscan: {
  //   apiKey: {
  //     sonicTestnet: process.env.SONICSCAN_API_KEY || "",
  //   },
  //   customChains: [
  //     {
  //       network: "sonicTestnet",
  //       chainId: 64165,
  //       urls: {
  //         apiURL: "https://api-testnet.sonicscan.org/api",
  //         browserURL: "https://testnet.sonicscan.org",
  //       },
  //     },
  //   ],
  // },
};

export default config;