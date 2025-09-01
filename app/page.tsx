import TickIndicator from '../components/TickIndicator';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold p-4">Calming Control Room</h1>
      {/* Red thread indicator to validate engine → bridge → store pipeline */}
      <TickIndicator />
    </div>
  );
}
