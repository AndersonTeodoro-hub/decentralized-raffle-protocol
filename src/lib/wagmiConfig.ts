import { http, createConfig } from "wagmi";
import { polygon, arbitrum } from "wagmi/chains";
import { getDefaultWallets } from "@rainbow-me/rainbowkit";

const { wallets } = getDefaultWallets({
  appName: "Decentralized Raffle Protocol",
  projectId: "raffle-protocol", // depois substituímos pelo seu ID real do WalletConnect
});

export const config = createConfig({
  chains: [polygon, arbitrum],
  connectors: wallets,
  transports: {
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});
