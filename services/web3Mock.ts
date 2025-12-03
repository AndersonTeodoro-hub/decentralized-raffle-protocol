import { MOCK_WALLET_DELAY, MOCK_TX_DELAY } from '../constants';

// This service mimics the behavior of wagmi/viem for the purpose of this UI demo
// In production, this would be replaced by actual contract calls.

export const connectWalletMock = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate a random wallet address
      const randomAddr = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      resolve(randomAddr);
    }, MOCK_WALLET_DELAY);
  });
};

export const submitBetMock = async (amount: number): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate transaction hash
      const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      resolve(txHash);
    }, MOCK_TX_DELAY);
  });
};