import { AlertTriangle, CheckCircle, Zap, Skull } from 'lucide-react';
import { ImpactResult } from '../physics/impactCalculations';
import { energyToMegatons } from '../physics/impactCalculations';

interface ImpactResultsProps {
  result: ImpactResult;
}

export default function ImpactResults({ result }: ImpactResultsProps) {
  const megatons = energyToMegatons(result.impactEnergy);

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        {result.willImpact ? (
          <>
            <AlertTriangle className="text-red-500" size={32} />
            <h3 className="text-2xl font-bold text-white">Impact Analysis</h3>
          </>
        ) : (
          <>
            <CheckCircle className="text-green-500" size={32} />
            <h3 className="text-2xl font-bold text-white">Mission Success</h3>
          </>
        )}
      </div>

      <div className={`p-4 rounded-lg mb-6 ${
        result.willImpact ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'
      }`}>
        <p className={`text-lg font-semibold ${
          result.willImpact ? 'text-red-300' : 'text-green-300'
        }`}>
          {result.outcome}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 p-4 rounded-lg">
          <div className="text-slate-400 text-sm mb-1">Impact Energy</div>
          <div className="text-white text-xl font-bold flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            {megatons.toFixed(0)} MT
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {(result.impactEnergy / 1e15).toFixed(2)} × 10¹⁵ J
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg">
          <div className="text-slate-400 text-sm mb-1">Miss Distance</div>
          <div className={`text-xl font-bold ${
            result.willImpact ? 'text-red-400' : 'text-green-400'
          }`}>
            {Math.abs(result.missDistance).toFixed(0)} km
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {result.willImpact ? 'Direct impact' : 'Safe passage'}
          </div>
        </div>

        {result.willImpact && (
          <>
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-slate-400 text-sm mb-1">Crater Diameter</div>
              <div className="text-white text-xl font-bold flex items-center gap-2">
                <Skull size={20} className="text-orange-400" />
                {result.craterDiameter.toFixed(1)} km
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {(result.craterDiameter * 1000).toFixed(0)} meters
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-lg col-span-2 md:col-span-3">
              <div className="text-slate-400 text-sm mb-1">Destruction Radius</div>
              <div className="text-red-400 text-xl font-bold">
                {result.destructionRadius.toFixed(0)} km
              </div>
              <div className="text-slate-500 text-xs mt-1">
                Area of severe damage and blast effects
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          Detailed Analysis
        </h4>
        {result.details.map((detail, index) => (
          <div
            key={index}
            className="bg-slate-900 p-3 rounded border-l-4 border-blue-500 text-slate-300"
          >
            {detail}
          </div>
        ))}
      </div>

      {!result.willImpact && (
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Scientific Note:</strong> This deflection demonstrates the principle behind NASA's DART mission,
            which successfully altered asteroid Dimorphos's orbit in 2022. Early detection and small velocity changes
            can prevent catastrophic impacts through accumulated trajectory changes over time.
          </p>
        </div>
      )}

      {result.willImpact && megatons > 10000 && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">
            <strong>Extinction Warning:</strong> An impact of this magnitude would cause global climate disruption,
            mass extinctions, and the collapse of human civilization. This scenario underscores why planetary defense
            is critical - early detection and deflection missions are humanity's best defense against cosmic threats.
          </p>
        </div>
      )}
    </div>
  );
}
