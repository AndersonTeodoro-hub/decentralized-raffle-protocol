"use client";

import { useAccount } from "wagmi";
import { useState } from "react";

const TICKET_PRICE = 5; // 5 USDC
const MAX_PER_WALLET = 100;

export default function BuyTickets() {
  const { address } = useAccount();
  const [amount, setAmount] = useState(1);

  const increase = () => {
    if (amount < MAX_PER_WALLET) setAmount(amount + 1);
  };

  const decrease = () => {
    if (amount > 1) setAmount(amount - 1);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full mt-8 text-center">
      <h2 className="text-xl font-bold mb-4 text-white">Buy Tickets</h2>

      <div className="flex justify-center items-center gap-6">
        <button
          onClick={decrease}
          className="px-3 py-2 bg-gray-700 rounded text-white"
        >
          -
        </button>

        <span className="text-2xl text-white">{amount}</span>

        <button
          onClick={increase}
          className="px-3 py-2 bg-gray-700 rounded text-white"
        >
          +
        </button>
      </div>

      <p className="mt-4 text-gray-300">
        Total cost: <b>{amount * TICKET_PRICE} USDC</b>
      </p>

      {!address ? (
        <p className="text-yellow-400 mt-4">Connect wallet to buy tickets</p>
      ) : (
        <button className="mt-6 bg-yellow-500 text-black px-4 py-2 rounded-lg">
          Buy Now
        </button>
      )}
    </div>
  );
}
