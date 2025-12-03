export interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: number; // Simulated USDC balance
  isConnecting: boolean;
}

export interface RaffleRound {
  id: number;
  totalPot: number;
  totalTickets: number;
  endTime: number;
  status: 'ACTIVE' | 'CALCULATING' | 'COMPLETED';
}

export interface Bet {
  amount: number;
  tickets: number;
  timestamp: number;
  txHash: string;
}

export interface WinnerHistory {
  roundId: number;
  winnerAddress: string;
  prizeAmount: number;
  timestamp: string;
}