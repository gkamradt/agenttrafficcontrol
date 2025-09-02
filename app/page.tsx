import WorkTable from '../components/WorkTable';
import MetricsBar from '../components/MetricsBar';
import ControlBar from '../components/ControlBar';
import RadarCanvas from '../components/RadarCanvas';
import ProjectIdDisplay from '../components/ProjectIdDisplay';
import ProjectDescription from '../components/ProjectDescription';
import OperatorGroups from '../components/OperatorGroups';

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-2xl font-bold text-gray-500">Agent Traffic Control</h1>
      </header>

      {/* Controls row */}
      <div className="border-t border-gray-800" />

      {/* Main two-column layout */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-4 h-full min-h-0">
          {/* LEFT COLUMN: 3 rows -> [Monitoring (auto), Operator Actions (auto), Work/Agent table (1fr = remaining space)] */}
          <section className="min-h-0 overflow-hidden grid grid-rows-[auto_auto_1fr]">
            {/* Monitoring table (top) with three internal rows */}
            <div className="min-h-0 overflow-hidden flex flex-col">

              <div className="flex items-center bg-[#130f04ff]">
                <h2 className="bg-[#c79325] pl-2 pr-2 font-bold text-black">MONITORING TABLE</h2>
              </div>

              <div className="grid grid-cols-[20%_1fr] gap-0 border border-[#352b19ff]" style={{ minHeight: 'auto' }}>
                {/* Column 1: 2 parts wide */}
                <div className="border-r border-[#352b19ff] p-3">
                  <div className="text-xs text-[#d79326ff] mb-1">Project ID</div>
                  <div className="text-sm text-[#a4a4a4ff]"><ProjectIdDisplay /></div>
                </div>
                {/* Column 2: 1 part wide */}
                <div className="p-3">
                  <div className="text-xs text-[#c89225ff] mb-1">Project Description</div>
                  <div className="text-sm text-[#a4a4a4ff]"><ProjectDescription /></div>
                </div>
              </div>
            </div>

            {/* Operator Action Items (middle) */}
            <div className="min-h-0 overflow-hidden border border-[#352b19ff] bg-black border-b-0 flex flex-col">
              <div className="flex items-center border-b-3 border-[#352b19ff]">
                <h2 className="text-lg text-[#d79326ff] pl-2 pr-2">OPERATOR ACTION ITEMS</h2>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-2">
                <OperatorGroups />
              </div>
            </div>

            {/* Work/Agent table (bottom, 75% height) */}
            <div className="min-h-0 overflow-hidden">
              <WorkTable />
            </div>
          </section>

          {/* RIGHT COLUMN: rows -> [Top (1fr, matches left Monitoring row), Radar area (7fr), Master Control Panel (auto)] */}
          <aside className="h-full min-h-0 overflow-hidden grid grid-rows-[1fr_7fr_auto] gap-3">
            {/* Top row (same height as Monitoring row). Keep MetricsBar here. */}
            <div className="min-h-0 overflow-hidden border border-gray-800 bg-black">
              <MetricsBar />
            </div>

            {/* Radar area split into two subcolumns: [10% Global Queue | 90% Radar] */}
            <div className="min-h-0 overflow-hidden grid grid-cols-[10%_90%] gap-3">
              {/* Global Queue (thin left column) */}
              <div className="border border-gray-800 bg-black flex items-center justify-center">
                <div className="text-xs text-gray-300">
                  Global Queue
                </div>
              </div>
              {/* Radar (right, main) */}
              <div className="min-h-0 overflow-hidden">
                <RadarCanvas />
              </div>
            </div>

            {/* Master Control Panel (bottom) */}
            <div className="mt-1">
              <h2 className="text-lg font-semibold mb-2 px-1">Master Control Panel</h2>
              <div className="border border-gray-800 bg-black">
                <ControlBar />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
