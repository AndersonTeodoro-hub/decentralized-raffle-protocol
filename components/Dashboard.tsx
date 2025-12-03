import React, { useState } from 'react';
import { WalletState } from '../types';
import { 
  TICKET_PRICE_USDC, 
  MAX_BETS_PER_WALLET, 
  WINNER_PERCENTAGE, 
  PLATFORM_FEE_PERCENTAGE,
  TOKEN_SYMBOL
} from '../constants';
import Button from './Button';
import Timer from './Timer';

interface DashboardProps {
  wallet: WalletState;
  onBet: (ticketCount: number) => Promise<void>;
  currentPot: number;
}

const Dashboard: React.FC<DashboardProps> = ({ wallet, onBet, currentPot }) => {
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBets, setUserBets] = useState(0); // Simulated bets for current round

  const handleBet = async () => {
    if (!wallet.isConnected) return;
    
    setIsProcessing(true);
    try {
      await onBet(ticketCount);
      setUserBets(prev => prev + ticketCount);
      setTicketCount(1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const increment = () => {
    if (ticketCount + userBets < MAX_BETS_PER_WALLET) {
        setTicketCount(prev => prev + 1);
    }
  };
  
  const decrement = () => setTicketCount(prev => prev > 1 ? prev - 1 : 1);

  const setMax = () => {
    const remainingAllowed = MAX_BETS_PER_WALLET - userBets;
    const affordable = Math.floor(wallet.balance / TICKET_PRICE_USDC);
    setTicketCount(Math.min(remainingAllowed, affordable, MAX_BETS_PER_WALLET));
  };

  const totalCost = ticketCount * TICKET_PRICE_USDC;
  const potentialPrize = (currentPot + totalCost) * WINNER_PERCENTAGE;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      
      {/* Timer Section */}
      <Timer onRoundEnd={() => setUserBets(0)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pot Info */}
        <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div>
            <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Current Round Pot</h2>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              ${(currentPot).toLocaleString()} <span className="text-lg text-gray-500">{TOKEN_SYMBOL}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Round Active
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-700/50 space-y-4">
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Winner Takes (75%)</span>
                <span className="text-white font-mono font-bold">${(currentPot * WINNER_PERCENTAGE).toLocaleString()} {TOKEN_SYMBOL}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Platform/Dev (25%)</span>
                <span className="text-white font-mono">${(currentPot * PLATFORM_FEE_PERCENTAGE).toLocaleString()} {TOKEN_SYMBOL}</span>
             </div>
          </div>
        </div>

        {/* Betting Interface */}
        <div className="glass-panel rounded-2xl p-8 border-t-4 border-t-gold-500">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            Buy Tickets
            <span className="text-xs bg-slate-800 text-gold-500 px-2 py-1 rounded border border-slate-700">Cost: {TICKET_PRICE_USDC} {TOKEN_SYMBOL}</span>
          </h2>

          <div className="space-y-6">
            
            {/* Controls */}
            <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl border border-slate-700">
                <button onClick={decrement} className="w-12 h-12 flex items-center justify-center text-2xl text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition">-</button>
                <div className="text-center">
                    <span className="block text-2xl font-bold text-white">{ticketCount}</span>
                    <span className="text-xs text-gray-500 uppercase">Tickets</span>
                </div>
                <button onClick={increment} className="w-12 h-12 flex items-center justify-center text-2xl text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition">+</button>
            </div>

            {/* Calculations */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Cost</span>
                    <span className="text-white font-bold">{totalCost} {TOKEN_SYMBOL}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Your Round Limits</span>
                    <span>{userBets + ticketCount} / {MAX_BETS_PER_WALLET} Bets</span>
                </div>
                {userBets + ticketCount > MAX_BETS_PER_WALLET && (
                    <div className="text-xs text-red-500 text-right">Limit Exceeded</div>
                )}
            </div>

            <div className="pt-2">
                {!wallet.isConnected ? (
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-dashed border-slate-600 text-gray-400 text-sm">
                        Connect wallet to start betting
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <button onClick={setMax} className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold uppercase tracking-wider text-gray-300">
                            Max
                        </button>
                        <Button 
                            variant="gold" 
                            className="w-full"
                            onClick={handleBet}
                            isLoading={isProcessing}
                            disabled={userBets + ticketCount > MAX_BETS_PER_WALLET || totalCost > wallet.balance}
                        >
                            {totalCost > wallet.balance ? 'Insufficient Balance' : `Place Bet (${totalCost} ${TOKEN_SYMBOL})`}
                        </Button>
                    </div>
                )}
            </div>
          </div>
        </div>

      </div>

      {/* Info Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl text-center">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">VRF Status</div>
            <div className="text-emerald-400 font-bold flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Online
            </div>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">My Tickets</div>
            <div className="text-white font-bold">{userBets}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Players</div>
            <div className="text-white font-bold">142</div>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Contract</div>
            <div className="text-blue-400 font-bold underline cursor-pointer truncate px-2">0x12...F4A</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;