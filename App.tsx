import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import { WalletState } from './types';
import { connectWalletMock, submitBetMock } from './services/web3Mock';
import { MOCK_INITIAL_BALANCE, TICKET_PRICE_USDC } from './constants';

const App: React.FC = () => {
  // Wallet State
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    balance: 0,
    isConnecting: false,
  });

  // Game State
  const [pot, setPot] = useState<number>(12500); // Initial mock pot

  const handleConnect = async () => {
    setWallet(prev => ({ ...prev, isConnecting: true }));
    try {
      const address = await connectWalletMock();
      setWallet({
        address,
        isConnected: true,
        balance: MOCK_INITIAL_BALANCE,
        isConnecting: false,
      });
    } catch (error) {
      console.error("Failed to connect", error);
      setWallet(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const handleDisconnect = () => {
    setWallet({
      address: null,
      isConnected: false,
      balance: 0,
      isConnecting: false,
    });
  };

  const handleBet = async (tickets: number) => {
    const cost = tickets * TICKET_PRICE_USDC;
    if (cost > wallet.balance) throw new Error("Insufficient funds");

    // Optimistic UI update before "blockchain" confirms
    const newBalance = wallet.balance - cost;
    
    // Simulate Smart Contract Interaction
    await submitBetMock(cost);
    
    // Update State
    setWallet(prev => ({ ...prev, balance: newBalance }));
    setPot(prev => prev + cost);
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20 relative overflow-x-hidden selection:bg-gold-500 selection:text-black">
      {/* Ambient Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10">
        <Header 
            wallet={wallet} 
            onConnect={handleConnect} 
            onDisconnect={handleDisconnect} 
        />
        
        <main className="container px-4 mx-auto mt-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4 font-mono">
                    PROVABLY FAIR RAFFLE
                </h1>
                <p className="text-slate-400 max-w-xl mx-auto text-lg">
                    Decentralized, anonymous, and automated. <br/>
                    <span className="text-gold-500 font-bold">75%</span> to Winner, <span className="text-slate-500">25% Protocol Fee</span>.
                </p>
            </div>

            <Dashboard 
                wallet={wallet} 
                onBet={handleBet} 
                currentPot={pot}
            />
        </main>
      </div>
    </div>
  );
};

export default App;