import WorkTable from '../components/WorkTable';
import MetricsBar from '../components/MetricsBar';
import ControlBar from '../components/ControlBar';
import RadarCanvas from '../components/RadarCanvas';

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-2xl font-bold">Calming Control Room</h1>
      </header>

      {/* Controls row */}
      <div className="border-t border-gray-800" />

      {/* Main two-column layout */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-4 h-full min-h-0">
          {/* Left: Work table (35%) */}
          <section className="h-full min-h-0 overflow-hidden">
            <WorkTable />
          </section>

          {/* Right: Metrics above Radar (65%) */}
          <aside className="h-full min-h-0 overflow-hidden flex flex-col">
            <MetricsBar />
            <div className="flex-1 min-h-0 overflow-hidden">
              <RadarCanvas />
            </div>
            <div className="mt-3">
              <h2 className="text-lg font-semibold mb-2 px-1">Master Control Panel</h2>
              <div className="rounded-md border border-gray-800 bg-gray-900">
                <ControlBar />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
