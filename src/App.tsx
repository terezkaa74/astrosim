import { useState } from 'react';
import { Waves, Mountain, Activity } from 'lucide-react';
import RealisticSimulation from './components/RealisticSimulation';
import OceanImpactScenario from './components/OceanImpactScenario';
import InlandImpactScenario from './components/InlandImpactScenario';

type Tab = 'realistic' | 'ocean' | 'inland';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('realistic');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            AstroSim
          </h1>
          <p className="text-slate-300 text-lg">
            Asteroid Bennu Impact Simulation
          </p>
        </header>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('realistic')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'realistic'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Activity size={20} />
            Realistic Simulation
          </button>
          <button
            onClick={() => setActiveTab('ocean')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'ocean'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Waves size={20} />
            Ocean Impact
          </button>
          <button
            onClick={() => setActiveTab('inland')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'inland'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Mountain size={20} />
            Inland Impact
          </button>
        </div>

        <main>
          {activeTab === 'realistic' && <RealisticSimulation />}
          {activeTab === 'ocean' && <OceanImpactScenario />}
          {activeTab === 'inland' && <InlandImpactScenario />}
        </main>

        <footer className="mt-12 text-center pb-6">
          <p className="text-slate-400 text-sm">
            Developed by <span className="text-blue-400 font-semibold">Tereza Gorgolova</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
