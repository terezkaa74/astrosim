import { Settings } from 'lucide-react';

interface SimulationControlsProps {
  diameter: number;
  velocity: number;
  deflectionForce: number;
  timeBeforeImpact: number;
  onDiameterChange: (value: number) => void;
  onVelocityChange: (value: number) => void;
  onDeflectionChange: (value: number) => void;
  onTimeChange: (value: number) => void;
}

export default function SimulationControls({
  diameter,
  velocity,
  deflectionForce,
  timeBeforeImpact,
  onDiameterChange,
  onVelocityChange,
  onDeflectionChange,
  onTimeChange
}: SimulationControlsProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="text-blue-400" size={24} />
        <h3 className="text-xl font-bold text-white">Simulation Parameters</h3>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 font-medium">Asteroid Diameter</label>
            <span className="text-blue-400 font-mono font-bold">{diameter.toFixed(3)} km</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.001"
            value={diameter}
            onChange={(e) => onDiameterChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0.1 km</span>
            <span className="text-slate-400">Bennu: 0.492 km</span>
            <span>2.0 km</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 font-medium">Impact Velocity</label>
            <span className="text-blue-400 font-mono font-bold">{velocity.toFixed(1)} km/s</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="0.1"
            value={velocity}
            onChange={(e) => onVelocityChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>5 km/s</span>
            <span className="text-slate-400">Bennu: 12.7 km/s</span>
            <span>30 km/s</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 font-medium">Deflection Force (Δv)</label>
            <span className="text-blue-400 font-mono font-bold">{deflectionForce.toFixed(2)} cm/s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.01"
            value={deflectionForce}
            onChange={(e) => onDeflectionChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0 cm/s (No deflection)</span>
            <span>10 cm/s</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            This represents the velocity change imparted by a kinetic impactor or nuclear device
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-slate-300 font-medium">Warning Time</label>
            <span className="text-blue-400 font-mono font-bold">{timeBeforeImpact} years</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={timeBeforeImpact}
            onChange={(e) => onTimeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1 year</span>
            <span>50 years</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            More time allows smaller deflection forces to accumulate larger trajectory changes
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">Real Bennu Data</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>Mass: 7.33×10¹⁰ kg</div>
          <div>Density: 1,190 kg/m³</div>
          <div>Rotation: 4.3 hours</div>
          <div>Type: Carbonaceous</div>
        </div>
      </div>
    </div>
  );
}
