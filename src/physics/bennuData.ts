export const BENNU_DATA = {
  name: '101955 Bennu',
  diameter: 0.492,
  mass: 7.33e10,
  density: 1190,
  rotationPeriod: 4.296,
  composition: 'B-type carbonaceous',
  absoluteMagnitude: 20.4,

  orbit: {
    period: 436.6,
    semiMajorAxis: 1.126,
    eccentricity: 0.20375,
    inclination: 6.0349,
    perihelion: 0.8969,
    aphelion: 1.3559
  }
} as const;

export const EARTH_DATA = {
  mass: 5.972e24,
  radius: 6371,
  escapeVelocity: 11.2,
  orbitalVelocity: 29.78
} as const;

export const PHYSICAL_CONSTANTS = {
  G: 6.67430e-11,
  AU: 1.496e8
} as const;
