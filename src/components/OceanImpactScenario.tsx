import { useState } from 'react';
import { Play, Waves, AlertTriangle as AlertTriangle } from 'lucide-react';
import TrajectoryVisualization from './TrajectoryVisualization';

export default function OceanImpactScenario() {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Waves className="text-blue-400 flex-shrink-0 mt-1" size={32} />
          <div>
            <h3 className="text-white font-bold text-2xl mb-2">
              Deep Ocean Impact Scenario
            </h3>
            <p className="text-blue-200 mb-2">
              <strong>Location:</strong> Atlantic Ocean (33°N, 65°W) - between New York and Bermuda
            </p>
            <p className="text-blue-200">
              <strong>Water Depth:</strong> 5,000-6,000 meters
            </p>
          </div>
        </div>
      </div>

      {!isSimulating && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Play size={64} className="mx-auto mb-4 text-blue-400 opacity-50" />
            <p className="text-slate-400 text-lg">
              Click "Run Simulation" to see the ocean impact scenario
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
                    <strong>Severe Damage:</strong> 45 km radius - 100% fatalities
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-slate-300">
                    <strong>Moderate Damage:</strong> 95 km radius - widespread casualties
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-300 font-semibold mb-2">Crater Formation</div>
              <div className="space-y-2 text-sm text-slate-300">
                <div><strong>Diameter:</strong> 6.2 kilometers wide</div>
                <div><strong>Depth:</strong> 800 meters deep</div>
                <div><strong>Ejecta Blanket:</strong> Extends 100 km from impact</div>
                <div className="text-xs text-slate-400 mt-2">Crater visible from space, deeper than deepest canyon</div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-300 font-semibold mb-2">Seismic Effects</div>
              <div className="space-y-2 text-sm text-slate-300">
                <div><strong>Magnitude:</strong> 7.8 on Richter scale</div>
                <div><strong>Strong Shaking:</strong> 200 km radius</div>
                <div><strong>Felt Radius:</strong> 500 km</div>
                <div><strong>Duration:</strong> 2-5 minutes of intense ground motion</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Waves className="text-blue-400" size={24} />
              Tsunami Formation
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-blue-500">
                <div className="text-blue-400 font-semibold mb-2">Initial Wave Height</div>
                <div className="text-white text-3xl font-bold">500 meters</div>
                <div className="text-slate-400 text-xs mt-1">At impact point</div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg">
                <div className="text-slate-300 font-semibold mb-2">Wave Propagation</div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div><strong>Open Ocean Height:</strong> 1-2 meters</div>
                  <div><strong>Travel Speed:</strong> 800 km/h</div>
                  <div><strong>Coastal Amplification:</strong> 20-50x height increase</div>
                  <div><strong>Final Coastal Wave:</strong> 10-20 meters high</div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-orange-500">
                <div className="text-orange-400 font-semibold mb-2">Coastal Inundation</div>
                <div className="text-white text-2xl font-bold mb-2">5-15 kilometers inland</div>
                <div className="text-slate-400 text-xs">Depends on terrain elevation and slope</div>
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
          className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:scale-100"
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
                IMPACT EVENT - Catastrophic Tsunami
              </h3>
              <div className="space-y-2 text-red-200 text-sm">
                <p>
                  <strong>Affected Coastlines:</strong> Eastern North America, Caribbean Islands, Western Europe,
                  Northwestern Africa
                </p>
                <p>
                  <strong>Estimated Casualties:</strong> Millions in coastal cities within 1,000 km
                </p>
                <p>
                  <strong>Economic Impact:</strong> Trillions in damages to coastal infrastructure
                </p>
                <p className="text-red-300 font-semibold mt-4">
                  Major cities at risk: New York, Miami, Boston, Halifax, London, Lisbon, Casablanca
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
            <div className="text-blue-400 font-semibold mb-2">Immediate (1-6 months)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Dust cloud formation blocks sunlight, tsunami waves devastate coastlines, initial global temperature drop
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-blue-400 font-semibold mb-2">Short-term (6-24 months)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Maximum cooling effect, crop failures in affected regions, disruption of ocean currents
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-blue-400 font-semibold mb-2">Medium-term (2-5 years)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Gradual clearing of dust, slow recovery of marine ecosystems, coastal rebuilding begins
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded">
            <div className="text-blue-400 font-semibold mb-2">Long-term (5-10 years)</div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Return to normal climate patterns, permanent changes to coastlines, lasting economic impacts
            </p>
          </div>
        </div>
        </div>
      )}

      {isSimulating && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Atmospheric Effects</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-300 font-semibold mb-3">Scaling Factors</div>
            <div className="space-y-2 text-sm text-slate-300">
              <div><strong>Dust Injection:</strong> 1,000 tons per megaton TNT</div>
              <div><strong>Residence Time:</strong> 1-3 years for sub-micron particles</div>
              <div><strong>Temperature Reduction:</strong> 1°C per 10¹⁵ grams of dust</div>
              <div><strong>Ozone Depletion:</strong> 30-50% for Bennu-scale impact</div>
            </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg">
            <div className="text-slate-300 font-semibold mb-3">Global Consequences</div>
            <div className="space-y-2 text-sm text-slate-300">
              <div>• Significant global cooling for 2-3 years</div>
              <div>• Agricultural disruption worldwide</div>
              <div>• Increased UV radiation from ozone loss</div>
              <div>• Disruption of weather patterns</div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
