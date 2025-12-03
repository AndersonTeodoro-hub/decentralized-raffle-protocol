import React from 'react';
import Button from './Button';
import { WalletState } from '../types';

interface ConnectWalletProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ wallet, onConnect, onDisconnect }) => {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end hidden md:flex">
          <span className="text-xs font-medium text-gray-400">Balance</span>
          <span className="text-sm font-bold text-white">{wallet.balance.toLocaleString()} USDC</span>
        </div>
        <div className="flex items-center gap-2 p-1 pr-4 rounded-full bg-slate-800 border border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
            <span className="font-mono font-medium text-white">{formatAddress(wallet.address)}</span>
            <button 
                onClick={onDisconnect}
                className="ml-2 text-xs text-red-400 hover:text-red-300 underline"
            >
                Disconnect
            </button>
        </div>
      </div>
    );
  }

  return (
    <Button 
      variant="gold" 
      onClick={onConnect} 
      isLoading={wallet.isConnecting}
    >
      Connect Wallet
    </Button>
  );
};

export default ConnectWallet;