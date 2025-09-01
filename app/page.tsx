import TickIndicator from '../components/TickIndicator';
import WorkTable from '../components/WorkTable';
import MetricsBar from '../components/MetricsBar';
import ControlBar from '../components/ControlBar';
import RadarCanvas from '../components/RadarCanvas';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold p-4">Calming Control Room</h1>
      <ControlBar />
      <MetricsBar />
      {/* Red thread indicator to validate engine → bridge → store pipeline */}
      <TickIndicator />
      <RadarCanvas />
      <WorkTable />
    </div>
  );
}
