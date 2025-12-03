import React from 'react';
import ConnectWallet from './ConnectWallet';
import { WalletState } from '../types';

interface HeaderProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ wallet, onConnect, onDisconnect }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="container px-4 mx-auto h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-xl font-bold text-black">R</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight">DECENTRALIZED</span>
            <span className="text-xs font-bold text-gold-500 tracking-widest uppercase">Raffle Protocol</span>
          </div>
        </div>

        <ConnectWallet 
            wallet={wallet} 
            onConnect={onConnect} 
            onDisconnect={onDisconnect} 
        />
      </div>
    </header>
  );
};

export default Header;