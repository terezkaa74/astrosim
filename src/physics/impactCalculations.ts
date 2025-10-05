import { BENNU_DATA } from './bennuData';

export interface SimulationParams {
  diameter: number;
  velocity: number;
  deflectionForce: number;
}

export interface ImpactResult {
  willImpact: boolean;
  missDistance: number;
  impactEnergy: number;
  craterDiameter: number;
  destructionRadius: number;
  outcome: string;
  details: string[];
}

export function calculateImpactEnergy(mass: number, velocity: number, angle: number): number {
  const angleRad = angle * Math.PI / 180;
  const verticalComponent = velocity * Math.sin(angleRad);
  const horizontalComponent = velocity * Math.cos(angleRad);

  const verticalEnergy = 0.5 * mass * Math.pow(verticalComponent * 1000, 2);
  const horizontalEnergy = 0.5 * mass * Math.pow(horizontalComponent * 1000, 2) * 0.3;

  return verticalEnergy + horizontalEnergy;
}

export function energyToMegatons(joules: number): number {
  return joules / 4.184e15;
}

export function calculateMass(diameter: number, density: number = BENNU_DATA.density): number {
  const radius = (diameter / 2) * 1000;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  return volume * density;
}

export function calculateCraterDiameter(
  diameter: number,
  velocity: number,
  impactAngle: number,
  density: number
): number {
  const projectileDiameter = diameter * 1000;
  const angleRad = impactAngle * Math.PI / 180;
  const effectiveVelocity = velocity * Math.sin(angleRad);
  const targetDensity = 2500;

  const angleFactor = Math.pow(Math.sin(angleRad), 1/3);

  const craterDiameter = 1.161 * angleFactor * Math.pow(
    (projectileDiameter * Math.pow(density / targetDensity, 1/3) *
    Math.pow(effectiveVelocity, 0.44) * Math.pow(9.8, -0.22)),
    0.78
  );

  return craterDiameter / 1000;
}

export function calculateDeflection(
  force: number,
  timeBeforeImpact: number
): number {
  const deltaV = force / 100;
  const timeSeconds = timeBeforeImpact * 365.25 * 24 * 3600;
  const displacement = deltaV * timeSeconds;
  return displacement / 1000;
}

export function simulateImpact(params: SimulationParams, timeBeforeImpact: number = 10): ImpactResult {
  const mass = calculateMass(params.diameter);
  const deflectionDistance = calculateDeflection(params.deflectionForce, timeBeforeImpact);

  const baseTrajectory = 0;
  const finalMissDistance = baseTrajectory + deflectionDistance;

  const IMPACT_THRESHOLD_KM = 2000;
  const willImpact = finalMissDistance < IMPACT_THRESHOLD_KM;

  const DEFAULT_IMPACT_ANGLE = 45;
  const impactEnergy = calculateImpactEnergy(mass, params.velocity, DEFAULT_IMPACT_ANGLE);
  const impactMegatons = energyToMegatons(impactEnergy);

  let outcome = '';
  let details: string[] = [];

  if (!willImpact) {
    outcome = `Asteroid missed Earth by ${finalMissDistance.toFixed(0)} kilometers.`;
    details = [
      `Deflection force of ${params.deflectionForce.toFixed(2)} cm/s successfully altered trajectory`,
      `Total displacement: ${deflectionDistance.toFixed(0)} km over ${timeBeforeImpact} years`,
      `Earth's population of 8 billion people saved`,
      `Asteroid continues on modified orbit through solar system`
    ];
  } else {
    const craterDiameter = calculateCraterDiameter(
      params.diameter,
      params.velocity,
      DEFAULT_IMPACT_ANGLE,
      BENNU_DATA.density
    );

    const destructionRadius = craterDiameter * 10;

    if (impactMegatons < 100) {
      outcome = `Regional impact event - ${impactMegatons.toFixed(0)} megatons of TNT equivalent.`;
      details = [
        `Impact crater: ${craterDiameter.toFixed(1)} km diameter`,
        `Destruction radius: ${destructionRadius.toFixed(0)} km`,
        `Seismic magnitude: ${(4.0 + Math.log10(impactMegatons) * 0.67).toFixed(1)}`,
        `Regional devastation with significant casualties`,
        `Atmospheric dust causes temporary climate effects`
      ];
    } else if (impactMegatons < 10000) {
      outcome = `Continental-scale catastrophe - ${impactMegatons.toFixed(0)} megatons of TNT equivalent.`;
      details = [
        `Impact crater: ${craterDiameter.toFixed(1)} km diameter`,
        `Destruction radius: ${destructionRadius.toFixed(0)} km`,
        `Multiple countries affected`,
        `Global climate disruption for several years`,
        `Agricultural collapse in impact hemisphere`,
        `Estimated casualties: hundreds of millions`
      ];
    } else {
      outcome = `Global extinction-level event - ${impactMegatons.toFixed(0)} megatons of TNT equivalent.`;
      details = [
        `Impact crater: ${craterDiameter.toFixed(1)} km diameter`,
        `Destruction radius: ${destructionRadius.toFixed(0)} km`,
        `Global firestorms from ejecta re-entry`,
        `Impact winter lasting 5-10 years`,
        `Collapse of global food chain`,
        `Mass extinction of 75%+ of species`,
        `End of human civilization as we know it`
      ];
    }

    return {
      willImpact,
      missDistance: finalMissDistance,
      impactEnergy,
      craterDiameter,
      destructionRadius,
      outcome,
      details
    };
  }

  return {
    willImpact,
    missDistance: finalMissDistance,
    impactEnergy,
    craterDiameter: 0,
    destructionRadius: 0,
    outcome,
    details
  };
}
