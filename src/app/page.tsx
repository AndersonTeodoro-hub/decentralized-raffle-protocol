export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4 text-white">
        Decentralized Raffle Protocol
      </h1>

      <p className="text-gray-300 text-center max-w-xl">
        Anonymous betting with verifiable randomness (VRF).  
        5 USDC per ticket • Max 100 bets per wallet • Automatic payouts.
      </p>

      <div className="mt-10 text-center text-yellow-400 text-2xl">
        Front-end base loaded successfully ✔️
      </div>
    </main>
  );
}
