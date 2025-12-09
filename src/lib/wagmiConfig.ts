import { configureChains, createConfig } from "wagmi";
import { arbitrum, polygon } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { getDefaultWallets } from "@rainbow-me/rainbowkit";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygon, arbitrum],
  [publicProvider()]
);

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID env var required for WalletConnect"
  );
}

const { connectors } = getDefaultWallets({
  appName: "Decentralized Raffle Protocol",
  projectId,
  chains,
});

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };
