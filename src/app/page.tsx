import ConnectWallet from "../components/ConnectWallet";
import Countdown from "../components/Countdown";
import BuyTickets from "../components/BuyTickets";

export default function Home() {
  return (
    <main className="flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-white mt-10">
        Decentralized Raffle Protocol
      </h1>

      <Countdown />

      <ConnectWallet />

      <BuyTickets />
    </main>
  );
}
