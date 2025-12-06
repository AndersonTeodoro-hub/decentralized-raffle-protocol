import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decentralized Raffle Protocol",
  description: "A fully decentralized and anonymous Web3 raffle protocol built with verifiable randomness (VRF).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
