import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    // Mạng Flare testnet (Coston2). Loại bỏ các field không chuẩn của Hardhat (type, chainType).
    Flare: {
      url: "https://flare-testnet-coston2.rpc.thirdweb.com",
      chainId: 114,
      accounts: [
        "0x1a49e0b1ef62cfdb7760b9ddd94487ebea94317ccf76f6e081757cf5462e20e9",
      ],
    },
  },
};

export default config;
