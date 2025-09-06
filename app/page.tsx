import WorkTable from '../components/WorkTable';
import ControlBar from '../components/ControlBar';
import RadarCanvas from '../components/RadarCanvas';
import GlobalQueue from '../components/GlobalQueue';
import ProjectIdDisplay from '../components/ProjectIdDisplay';
import ProjectDescription from '../components/ProjectDescription';
import OperatorGroups from '../components/OperatorGroups';
import TopOverview from '../components/TopOverview';
import TimelineStatusBar from '../components/TimelineStatusBar';

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-4">
        <h1 className="text-2xl tracking-tighter font-bold text-gray-500 text-spacing-px">AGENT TRAFFIC CONTROL</h1>
        <p className="mt-1 text-[10px] leading-none text-gray-500">
          <a
            href="https://github.com/gkamradt/agenttrafficcontrol"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 italic underline"
          >
            OPEN SOURCE
          </a>
          <span className="px-1">•</span>
          <a
            href="https://x.com/gregkamradt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 italic underline"
          >
            BY GREG
          </a>
        </p>
      </header>

      {/* Controls row */}
      <div className="border-t border-gray-800" />

      {/* Main layout */}
      <main className="flex-1 overflow-hidden p-4">
        {/* Desktop layout (unchanged) */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-[30%_70%] gap-4 h-full min-h-0">
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
              <div className="flex-1 min-h-0 overflow-auto">
                <OperatorGroups />
              </div>
            </div>

            {/* Work/Agent table (bottom, 75% height) */}
            <div className="min-h-0 overflow-hidden">
              <WorkTable />
            </div>
          </section>

          {/* RIGHT COLUMN: rows -> [Top (1fr), Radar area (7fr), Master Control Panel (auto)] */}
          <aside className="h-full min-h-0 overflow-hidden grid grid-rows-[1fr_7fr_auto] gap-3">
            {/* Top row (same height as Monitoring row). Keep MetricsBar here. */}
            <div className="min-h-0 overflow-hidden bg-black">
              <TopOverview />
            </div>

            {/* Radar row with Global Q header and 10%/90% split below */}
            <div className="min-h-0 overflow-hidden flex flex-col">
              {/* Full-width header bar with yellow tab, like Monitoring */}
              <div className="flex items-center" style={{ backgroundColor: '#130f04ff' }}>
                <div style={{ width: '8%', backgroundColor: '#c79325' }}>
                  <h2 className="pl-2 pr-2 font-bold text-black">GLOBAL QUEUE</h2>
                </div>
              </div>
              {/* Two-column area: 10% ActionItems | 90% Radar */}
              <div className="min-h-0 overflow-hidden grid" style={{ gridTemplateColumns: '8% 92%' }}>
                {/* Global Queue (left, full radar height) */}
                <div className="border-r border-[#352b19ff] bg-black min-h-0 overflow-hidden">
                  <GlobalQueue />
                </div>
                {/* Radar (right) */}
                <div className="min-h-0 overflow-hidden bg-black">
                  <RadarCanvas />
                </div>
              </div>
            </div>

            {/* Master Control Panel (bottom) */}
            <div className="mt-1">
              <div className="flex items-center bg-[#130f04ff]">
                <h2 className="bg-[#c79325] pl-2 pr-2 font-bold text-black">MASTER CONTROL PANEL</h2>
              </div>
              <div className="border border-gray-800 bg-black">
                <div className="px-2 pt-2">
                  <TimelineStatusBar />
                </div>
                <ControlBar />
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile layout */}
        <div className="block lg:hidden h-full min-h-0 overflow-auto">
          <div className="flex flex-col gap-3 p-1">
            {/* Top line metrics (compact, hide completion chart) */}
            <div className="min-h-0">
              <TopOverview compact hideCompletion />
            </div>

            {/* Radar (no global queue) */}
            <div className="min-h-0">
              <div className="flex items-center bg-[#130f04ff]">
                <h2 className="bg-[#c79325] pl-2 pr-2 font-bold text-black">RADAR</h2>
              </div>
              <div className="border border-[#352b19ff] bg-black" style={{ height: 260 }}>
                <RadarCanvas />
              </div>
            </div>

            {/* Work items table (compact + mini text, capped height with internal scroll) */}
            <div className="min-h-0">
              <div className="flex items-center bg-[#130f04ff]">
                <h2 className="bg-[#c79325] pl-2 pr-2 font-bold text-black">WORK ITEMS</h2>
              </div>
              <div className="min-h-0 overflow-hidden">
                <WorkTable compact mini maxHeight={390} columns={['id','work','tokens','eta']} />
              </div>
            </div>

            {/* Project details (ID + Description) */}
            <div className="min-h-0">
              <div className="flex items-center bg-[#130f04ff]">
                <h2 className="bg-[#c79325] pl-2 pr-2 font-bold text-black">PROJECT</h2>
              </div>
              <div className="grid grid-cols-[35%_1fr] border border-[#352b19ff] bg-black">
                <div className="border-r border-[#352b19ff] p-2">
                  <div className="text-xs text-[#d79326ff] mb-1">Project ID</div>
                  <div className="text-sm text-[#a4a4a4ff]"><ProjectIdDisplay /></div>
                </div>
                <div className="p-2">
                  <div className="text-xs text-[#c89225ff] mb-1">Project Description</div>
                  <div className="text-sm text-[#a4a4a4ff]"><ProjectDescription /></div>
                </div>
              </div>
            </div>

            {/* Master Control Panel */}
            <div className="min-h-0">
              <div className="flex items-center bg-[#130f04ff]">
                <h2 className="bg-[#c79325] pl-2 pr-2 font-bold text-black">MASTER CONTROL PANEL</h2>
              </div>
              <div className="border border-gray-800 bg-black">
                <div className="px-2 pt-2">
                  <TimelineStatusBar />
                </div>
                <ControlBar />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
