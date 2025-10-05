import { useState } from 'react';
import { Play, Mountain, AlertTriangle as AlertTriangle, Flame } from 'lucide-react';
import TrajectoryVisualization from './TrajectoryVisualization';

export default function InlandImpactScenario() {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Mountain className="text-orange-400 flex-shrink-0 mt-1" size={32} />
          <div>
            <h3 className="text-white font-bold text-2xl mb-2">
              Inland Impact Scenario
            </h3>
            <p className="text-orange-200 mb-2">
              <strong>Location:</strong> Central United States (40°N, 100°W) - Agricultural heartland
            </p>
            <p className="text-orange-200">
              <strong>Terrain:</strong> Great Plains region, flat to gently rolling terrain
            </p>
          </div>
        </div>
      </div>

      {!isSimulating && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Play size={64} className="mx-auto mb-4 text-orange-400 opacity-50" />
            <p className="text-slate-400 text-lg">
              Click "Run Simulation" to see the inland impact scenario
            </p>
          </div>
        </div>
      )}

      {isSimulating && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={24} />
              Immediate Impact Effects
            </h3>
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-red-500">
              <div className="text-red-400 font-semibold mb-2">Total Energy Release</div>
              <div className="text-white text-3xl font-bold">1,400 Megatons TNT</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-300 font-semibold mb-3">Destruction Zones</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span className="text-slate-300">
                    <strong>Fireball Radius:</strong> 3.8 km - complete vaporization
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-slate-300">
                    <strong>Severe Damage:</strong> 45 km radius - all structures destroyed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-slate-300">
                    <strong>Moderate Damage:</strong> 95 km radius - most buildings collapse
                  </span>
                </div>
                <div className="text-slate-400 text-xs mt-2">
                  <strong>Total Destroyed Area:</strong> 6,300 square kilometers
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-300 font-semibold mb-2">Crater Formation</div>
              <div className="space-y-2 text-sm text-slate-300">
                <div><strong>Diameter:</strong> 6.2 kilometers wide</div>
                <div><strong>Depth:</strong> 800 meters deep</div>
                <div><strong>Ejecta Blanket:</strong> Extends 100 km from impact</div>
                <div className="text-xs text-slate-400 mt-2">Visible from space, deeper than deepest canyon</div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-300 font-semibold mb-2">Seismic Effects</div>
              <div className="space-y-2 text-sm text-slate-300">
                <div><strong>Magnitude:</strong> 7.8 on Richter scale</div>
                <div><strong>Strong Shaking:</strong> 200 km radius - structural damage</div>
                <div><strong>Felt Radius:</strong> 500 km - noticeable shaking</div>
                <div><strong>Duration:</strong> 2-5 minutes of intense ground motion</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="text-orange-400" size={24} />
              Land-Specific Effects
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-orange-500">
                <div className="text-orange-400 font-semibold mb-2">Ejecta Distribution</div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div><strong>At 10 km distance:</strong> 10 meters thick</div>
                  <div><strong>At 30 km distance:</strong> 1 meter thick</div>
                  <div><strong>At 100 km distance:</strong> Significant debris coverage</div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-red-500">
                <div className="text-red-400 font-semibold mb-2">Atmospheric Heating</div>
                <div className="text-white text-xl font-bold mb-2">Vegetation Ignition</div>
                <div className="text-slate-300 text-sm">
                  <strong>Fire Radius:</strong> 100 km from impact point
                </div>
                <div className="text-slate-400 text-xs mt-2">
                  Intense thermal radiation ignites forests, grasslands, and structures
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg">
                <div className="text-slate-300 font-semibold mb-2">Regional Impact</div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div>• Complete destruction of agricultural land</div>
                  <div>• Contamination from crater ejecta</div>
                  <div>• Mass displacement of population</div>
                  <div>• Infrastructure collapse within 200 km</div>
                </div>
              </div>
            </div>
          </div>

          <TrajectoryVisualization
            deflectionDistance={0}
            willImpact={true}
          />
        </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:scale-100"
        >
          <Play size={24} />
          {isSimulating ? 'Simulation Running' : 'Run Simulation'}
        </button>
      </div>

      {isSimulating && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={32} />
            <div>
              <h3 className="text-red-300 font-bold text-xl mb-3">
                IMPACT EVENT - Regional Catastrophe
              </h3>
              <div className="space-y-2 text-red-200 text-sm">
                <p>
                  <strong>Destroyed Area:</strong> 6,300 km² completely devastated
                </p>
                <p>
                  <strong>Affected States:</strong> Nebraska, Kansas, Colorado, Wyoming (partial devastation)
                </p>
                <p>
                  <strong>Agricultural Loss:</strong> Critical damage to North America's breadbasket
                </p>
                <p>
                  <strong>Estimated Casualties:</strong> Hundreds of thousands to millions depending on population density
                </p>
                <p className="text-red-300 font-semibold mt-4">
                  Major infrastructure: Interstate highways, railways, power grids completely destroyed within impact zone
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSimulating && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Environmental Effects Timeline</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-orange-400 font-semibold mb-2">Immediate (1-6 months)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Massive dust cloud formation, wildfires across region, initial global temperature drop
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-orange-400 font-semibold mb-2">Short-term (6-24 months)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Maximum cooling effect, global crop failures, food supply disruptions
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-orange-400 font-semibold mb-2">Medium-term (2-5 years)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Gradual clearing, recovery of surrounding regions, permanent loss of impact zone
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-orange-400 font-semibold mb-2">Long-term (5-10 years)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Climate normalization, crater becomes permanent geological feature, ecological succession
            </p>
          </div>
        </div>
        </div>
      )}

      {isSimulating && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Impact Scaling Formulas</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-300 font-semibold mb-3">Crater Scaling</div>
            <div className="space-y-2 text-sm text-slate-300">
              <div><strong>Diameter:</strong> 0.0001 × (energy in joules)^0.294</div>
              <div><strong>Depth:</strong> 0.33 × crater diameter</div>
              <div><strong>Ejecta Blanket:</strong> 5 × crater diameter</div>
            </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-300 font-semibold mb-3">Seismic Scaling</div>
            <div className="space-y-2 text-sm text-slate-300">
              <div><strong>Magnitude:</strong> 0.67 × log₁₀(energy in joules) - 5.87</div>
              <div><strong>Shaking Radius:</strong> 10^(0.5 × magnitude - 2) kilometers</div>
            </div>
          </div>
        </div>
        </div>
      )}

      {isSimulating && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Atmospheric Effects</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-300 font-semibold mb-3">Dust & Climate Effects</div>
            <div className="space-y-2 text-sm text-slate-300">
              <div><strong>Dust Injection:</strong> 1,000 tons per megaton TNT</div>
              <div><strong>Residence Time:</strong> 1-3 years stratospheric</div>
              <div><strong>Temperature Drop:</strong> 1°C per 10¹⁵ grams dust</div>
              <div><strong>Ozone Depletion:</strong> 30-50% reduction</div>
            </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-300 font-semibold mb-3">Global Consequences</div>
            <div className="space-y-2 text-sm text-slate-300">
              <div>• Multi-year global cooling period</div>
              <div>• Worldwide agricultural disruption</div>
              <div>• Food supply chain collapse</div>
              <div>• Economic depression</div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
