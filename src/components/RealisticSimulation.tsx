import { useState } from 'react';
import { Play, RotateCcw, Info } from 'lucide-react';
import SimulationControls from './SimulationControls';
import TrajectoryVisualization from './TrajectoryVisualization';
import ImpactResults from './ImpactResults';
import { simulateImpact, SimulationParams, ImpactResult } from '../physics/impactCalculations';
import { BENNU_DATA } from '../physics/bennuData';

export default function RealisticSimulation() {
  const [params, setParams] = useState<SimulationParams>({
    diameter: BENNU_DATA.diameter,
    velocity: 12.7,
    deflectionForce: 2.5
  });

  const [timeBeforeImpact, setTimeBeforeImpact] = useState(10);
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [hasRun, setHasRun] = useState(false);

  const handleReset = () => {
    setParams({
      diameter: BENNU_DATA.diameter,
      velocity: 12.7,
      deflectionForce: 2.5
    });
    setTimeBeforeImpact(10);
    setHasRun(false);
    setShowInfo(true);
    setResult(null);
  };

  const handleRunSimulation = () => {
    setShowInfo(false);
    setHasRun(true);
    const newResult = simulateImpact(params, timeBeforeImpact);
    setResult(newResult);
  };

  return (
    <div className="space-y-6">
      {showInfo && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Info className="text-blue-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-white font-bold text-lg mb-2">
                Realistic Bennu Impact Simulation
              </h3>
              <p className="text-blue-200 mb-3 leading-relaxed">
                This simulation uses real-world physics and data from NASA's OSIRIS-REx mission to model
                asteroid Bennu's potential impact with Earth. Adjust parameters to see how different scenarios
                affect the outcome.
              </p>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-900/30 p-3 rounded">
                  <div className="text-blue-300 font-semibold mb-1">How It Works</div>
                  <ul className="text-blue-200 space-y-1 text-xs">
                    <li>• Adjust asteroid size, velocity, and deflection force</li>
                    <li>• See real-time trajectory calculations</li>
                    <li>• View scientifically accurate impact predictions</li>
                  </ul>
                </div>
                <div className="bg-blue-900/30 p-3 rounded">
                  <div className="text-blue-300 font-semibold mb-1">Physics Models</div>
                  <ul className="text-blue-200 space-y-1 text-xs">
                    <li>• Kinetic energy: E = ½mv²</li>
                    <li>• Deflection: Δx = (Δv × t)</li>
                    <li>• Crater scaling laws from impact studies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <SimulationControls
          diameter={params.diameter}
          velocity={params.velocity}
          deflectionForce={params.deflectionForce}
          timeBeforeImpact={timeBeforeImpact}
          onDiameterChange={(value) => setParams({ ...params, diameter: value })}
          onVelocityChange={(value) => setParams({ ...params, velocity: value })}
          onDeflectionChange={(value) => setParams({ ...params, deflectionForce: value })}
          onTimeChange={setTimeBeforeImpact}
        />

        {hasRun && result && (
          <TrajectoryVisualization
            deflectionDistance={result.missDistance}
            willImpact={result.willImpact}
          />
        )}

        {!hasRun && (
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Play size={64} className="mx-auto mb-4 text-blue-400 opacity-50" />
              <p className="text-slate-400 text-lg">
                Adjust parameters and click "Run Simulation" to begin
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={handleRunSimulation}
          className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
        >
          <Play size={24} />
          Run Simulation
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg shadow-lg transition-all"
        >
          <RotateCcw size={24} />
          Reset to Bennu Defaults
        </button>
      </div>

      {hasRun && result && !showInfo && (
        <ImpactResults result={result} />
      )}

      <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">Scientific Context</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-blue-400 font-semibold mb-2">🎯 DART Mission (2022)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              NASA successfully altered asteroid Dimorphos's orbit by 33 minutes, proving kinetic
              impact deflection works in practice.
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-blue-400 font-semibold mb-2">🔭 Detection Systems</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              NASA tracks 30,000+ near-Earth asteroids. The goal is to find all objects larger
              than 140m that could threaten Earth.
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-blue-400 font-semibold mb-2">⚡ Impact Effects</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              A 500m asteroid impact releases energy equivalent to thousands of nuclear weapons,
              causing regional to global devastation depending on size and location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
