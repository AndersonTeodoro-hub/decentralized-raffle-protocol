import React, { useState, useEffect } from 'react';
import { ROUND_DURATION_MINUTES } from '../constants';

interface TimerProps {
  onRoundEnd: () => void;
}

const Timer: React.FC<TimerProps> = ({ onRoundEnd }) => {
  const [timeLeft, setTimeLeft] = useState<string>('30:00');
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Logic: Calculate time until next 30-minute block (e.g., 10:00, 10:30, 11:00)
    // This ensures all users see roughly the same timer without a backend for this demo
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const durationMs = ROUND_DURATION_MINUTES * 60 * 1000;
      const nextRoundTime = Math.ceil(now / durationMs) * durationMs;
      const diff = nextRoundTime - now;

      if (diff <= 1000) {
        onRoundEnd();
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setTimeLeft(formatted);
      
      const totalSeconds = ROUND_DURATION_MINUTES * 60;
      const remainingSeconds = (minutes * 60) + seconds;
      setProgress((remainingSeconds / totalSeconds) * 100);
    };

    const interval = setInterval(calculateTimeRemaining, 1000);
    calculateTimeRemaining(); // Initial call

    return () => clearInterval(interval);
  }, [onRoundEnd]);

  return (
    <div className="flex flex-col items-center justify-center p-6 mb-8 rounded-2xl glass-panel">
      <h3 className="mb-2 text-sm font-semibold tracking-widest text-gray-400 uppercase">Next Draw In</h3>
      <div className="text-5xl font-bold font-mono text-white tracking-wider tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
        {timeLeft}
      </div>
      <div className="w-full h-2 mt-4 overflow-hidden rounded-full bg-slate-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Timer;