"use client";

import { useEffect, useState } from "react";

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 min

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 1800)); // reinicia a cada 30 min
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="text-center text-white text-3xl py-4">
      Next draw in:  
      <span className="text-yellow-400 ml-2">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
