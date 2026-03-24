import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    // Mạng Flare testnet (Coston2). Loại bỏ các field không chuẩn của Hardhat (type, chainType).
    Flare: {
      
      url: process.env.URL || "https://check-lai-di.com",
      chainId: 114,
      accounts: [
        process.env.PRIVATE_KEY || "0x...",
      ],
    },
  },
};

export default config;
