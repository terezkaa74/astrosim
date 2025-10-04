import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle, Info, Pause, Home, FastForward } from 'lucide-react';

const AstroSim = () => {
  const [screen, setScreen] = useState('selection');
  const [location, setLocation] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(10.0);
  const [deflectionForce, setDeflectionForce] = useState(25.0);
  const [launched, setLaunched] = useState(false);
  const [gameRunning, setGameRunning] = useState(false);
  const [showFactCard, setShowFactCard] = useState(1);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [explosionFrame, setExplosionFrame] = useState(0);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const CONVERSION_CONSTANT = 31.536;
  const SAFE_DISTANCE = 2000;
  const INITIAL_MISS = -500;

  // Calculate miss distance based on TIME ELAPSED since launch
  const calculateMissDistance = (force, timeElapsed) => {
    return INITIAL_MISS + (force * timeElapsed * CONVERSION_CONSTANT);
  };

  const timeElapsed = 10.0 - timeRemaining;
  
  const currentMissDistance = launched 
    ? calculateMissDistance(deflectionForce, timeElapsed)
    : INITIAL_MISS;

  const predictedMiss = calculateMissDistance(deflectionForce, 10.0);

  // Location data
  const locations = {
    ocean: {
      name: "Atlantic Ocean",
      coords: "33°N, 65°W",
      lat: 33,
      lon: -65,
      impact: {
        tsunamiWave: "60-80 meters",
        coastalWaves: "10-20 meters",
        cities: ["New York", "Boston", "Miami", "Lisbon"],
        warningTime: "45-90 minutes",
        inundation: "5-15 km inland"
      }
    },
    land: {
      name: "Central USA",
      coords: "40°N, 100°W",
      lat: 40,
      lon: -100,
      impact: {
        craterWidth: "6.2 km",
        craterDepth: "800 meters",
        immediateRadius: "45 km",
        severeRadius: "95 km",
        agricultureLoss: "50,000 km²"
      }
    }
  };

  // Complex physics calculations
  const calculateImpactPhysics = () => {
    const bennuMass = 7.329e10;
    const bennuDiameter = 492;
    const impactVelocity = 12400;
    const impactAngle = 45;
    
    const kineticEnergy = 0.5 * bennuMass * Math.pow(impactVelocity, 2);
    const energyMegatons = kineticEnergy / 4.184e15;
    
    const gravity = 9.81;
    const targetDensity = location === 'land' ? 2500 : 1000;
    const projectileDensity = 1190;
    
    const scalingFactor = 1.161 * Math.pow(gravity, -0.22) * Math.pow(projectileDensity / targetDensity, 0.333);
    const craterDiameter = scalingFactor * bennuDiameter * Math.pow(impactVelocity, 0.44) * Math.pow(Math.sin(impactAngle * Math.PI / 180), 0.333);
    const craterDepth = craterDiameter / 7.8;
    
    const seismicEfficiency = 0.001;
    const seismicEnergy = kineticEnergy * seismicEfficiency;
    const magnitude = (2/3) * Math.log10(seismicEnergy) - 10.7;
    
    const ejectaMass = Math.PI * Math.pow(craterDiameter / 2, 2) * craterDepth * targetDensity;
    const ejectaVolume = ejectaMass / targetDensity;
    
    const burstAltitude = 0;
    const blastRadius = 140 * Math.pow(energyMegatons, 0.33);
    const overpressure20psi = 2.2 * Math.pow(energyMegatons, 0.33);
    const overpressure5psi = 4.6 * Math.pow(energyMegatons, 0.33);
    const overpressure1psi = 10.4 * Math.pow(energyMegatons, 0.33);
    
    const thermalRadius = 0.48 * Math.pow(energyMegatons, 0.41);
    const fireballDuration = 0.18 * Math.pow(energyMegatons, 0.33);
    const fireballRadius = 0.093 * Math.pow(energyMegatons, 0.4);
    const thermalFluence = 5 * Math.pow(energyMegatons, 0.67);
    
    let tsunamiData = null;
    if (location === 'ocean') {
      const waterDepth = 4000;
      const impactRadius = bennuDiameter / 2;
      const cavityDepth = Math.min(2.5 * impactRadius, waterDepth);
      const tsunamiAmplitude = 0.14 * Math.pow(bennuDiameter, 0.5) * Math.pow(impactVelocity / 1000, 0.5) * Math.pow(waterDepth / 4000, 0.25);
      const tsunamiWavelength = 170 * Math.sqrt(waterDepth);
      const tsunamiVelocity = Math.sqrt(gravity * waterDepth);
      const tsunamiPeriod = tsunamiWavelength / tsunamiVelocity;
      const waveEnergyFlux = 0.125 * 1025 * gravity * Math.pow(tsunamiAmplitude, 2) * tsunamiVelocity;
      
      const cities = {
        'New York': { distance: 1150, initialHeight: 15 },
        'Boston': { distance: 1050, initialHeight: 16 },
        'Miami': { distance: 1400, initialHeight: 12 },
        'Lisbon': { distance: 3200, initialHeight: 8 },
        'London': { distance: 4100, initialHeight: 6 },
        'West Africa': { distance: 4500, initialHeight: 5 }
      };
      
      const arrivalData = {};
      const waveHeights = {};
      
      Object.entries(cities).forEach(([city, data]) => {
        const distanceKm = data.distance;
        const travelTimeHours = distanceKm / (tsunamiVelocity * 3.6);
        const decayFactor = Math.sqrt(impactRadius / (distanceKm * 1000));
        const dispersiveLoss = Math.exp(-0.0001 * distanceKm);
        const finalHeight = tsunamiAmplitude * 1000 * decayFactor * dispersiveLoss;
        
        arrivalData[city] = travelTimeHours;
        waveHeights[city] = Math.max(finalHeight, data.initialHeight);
      });
      
      tsunamiData = {
        initialAmplitude: tsunamiAmplitude * 1000,
        wavelength: tsunamiWavelength / 1000,
        velocity: tsunamiVelocity * 3.6,
        period: tsunamiPeriod,
        energyFlux: waveEnergyFlux / 1e6,
        cavityDepth: cavityDepth,
        arrivalTime: arrivalData,
        waveHeights: waveHeights
      };
    }
    
    const impactorMass = 610;
    const impactorVelocity = 6600;
    const momentumTransfer = impactorMass * impactorVelocity;
    const velocityChange = (momentumTransfer / bennuMass) * 100;
    const betaFactor = 3.61;
    const effectiveVelocityChange = velocityChange * betaFactor;
    
    const distanceFromSun = 1.126;
    const orbitalPeriod = 436.649;
    const eccentricity = 0.20374;
    const inclination = 6.0349;
    
    return {
      energy: {
        kineticEnergyJoules: kineticEnergy,
        energyMegatons: 1400,
        hiroshimaBombs: 80000,
        worldPowerDays: 14
      },
      crater: {
        diameter: craterDiameter,
        depth: craterDepth,
        volume: Math.PI * Math.pow(craterDiameter / 2, 2) * craterDepth,
        ejectaMass: ejectaMass / 1e9,
        ejectaVolume: ejectaVolume / 1e9
      },
      blast: {
        magnitude: magnitude,
        blastRadius: blastRadius,
        overpressure20psi: overpressure20psi,
        overpressure5psi: overpressure5psi,
        overpressure1psi: overpressure1psi,
        thermalRadius: thermalRadius,
        fireballDuration: fireballDuration,
        fireballRadius: fireballRadius,
        thermalFluence: thermalFluence
      },
      tsunami: tsunamiData,
      deflection: {
        impactorMass: impactorMass,
        impactorVelocity: impactorVelocity,
        momentumTransfer: momentumTransfer,
        velocityChange: velocityChange,
        betaEnhancement: betaFactor,
        effectiveChange: effectiveVelocityChange,
        missDistancePerCmS: CONVERSION_CONSTANT * 10.0
      },
      orbital: {
        semiMajorAxis: distanceFromSun,
        eccentricity: eccentricity,
        inclination: inclination,
        period: orbitalPeriod,
        perihelion: distanceFromSun * (1 - eccentricity),
        aphelion: distanceFromSun * (1 + eccentricity)
      },
      impact: {
        velocity: impactVelocity,
        angle: impactAngle,
        mass: bennuMass / 1e9,
        diameter: bennuDiameter,
        density: projectileDensity
      }
    };
  };

  // Game loop
  useEffect(() => {
    if (gameRunning && launched && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const decrement = 0.1 * timeSpeed;
          const newTime = prev - decrement;
          return newTime > 0 ? newTime : 0;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (timeRemaining <= 0 && launched) {
      setGameRunning(false);
      if (currentMissDistance < SAFE_DISTANCE) {
        setExplosionFrame(1);
        const explosionInterval = setInterval(() => {
          setExplosionFrame(prev => {
            if (prev >= 30) {
              clearInterval(explosionInterval);
              setTimeout(() => setScreen('results'), 500);
              return 30;
            }
            return prev + 1;
          });
        }, 50);
      } else {
        setTimeout(() => setScreen('results'), 1000);
      }
    }
  }, [gameRunning, launched, timeRemaining, timeSpeed, currentMissDistance]);

  // Canvas animation
  useEffect(() => {
    if (screen === 'game' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const earthImg = new Image();
      earthImg.src = 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg';
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < 100; i++) {
          const seed = i * 123.456;
          ctx.fillStyle = 'white';
          ctx.fillRect(
            (Math.sin(seed) * 10000) % canvas.width, 
            (Math.cos(seed) * 10000) % canvas.height, 
            1, 
            1
          );
        }
        
        const earthX = canvas.width / 2;
        const earthY = canvas.height / 2;
        const earthRadius = 80;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.clip();
        
        if (earthImg.complete) {
          ctx.drawImage(
            earthImg, 
            earthX - earthRadius, 
            earthY - earthRadius, 
            earthRadius * 2, 
            earthRadius * 2
          );
        } else {
          ctx.fillStyle = '#4a90e2';
          ctx.fill();
        }
        
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#2a70c2';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.arc(earthX, earthY, earthRadius * (i / 8), 0, Math.PI * 2);
          ctx.stroke();
        }
        
        if (location) {
          const loc = locations[location];
          const angle = (loc.lon + 180) * (Math.PI / 180);
          const lat = loc.lat * (Math.PI / 180);
          const impactX = earthX + Math.cos(angle) * earthRadius * Math.cos(lat);
          const impactY = earthY + Math.sin(lat) * earthRadius;
          
          const pulseSize = 5 + Math.sin(Date.now() / 200) * 2;
          ctx.beginPath();
          ctx.arc(impactX, impactY, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = '#ff4444';
          ctx.fill();
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          const glowGradient = ctx.createRadialGradient(impactX, impactY, 0, impactX, impactY, pulseSize + 5);
          glowGradient.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
          glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(impactX, impactY, pulseSize + 5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        const progress = 1 - (timeRemaining / 10);
        const baseX = canvas.width - 100;
        const baseY = 50;
        
        let targetX = earthX;
        let targetY = earthY;
        
        if (location) {
          const loc = locations[location];
          const angle = (loc.lon + 180) * (Math.PI / 180);
          const lat = loc.lat * (Math.PI / 180);
          targetX = earthX + Math.cos(angle) * earthRadius * Math.cos(lat);
          targetY = earthY + Math.sin(lat) * earthRadius;
        }
        
        const deflectionEffect = launched ? (deflectionForce * timeElapsed * 2) : 0;
        const willMiss = currentMissDistance >= SAFE_DISTANCE;
        const missOffset = willMiss ? deflectionEffect : 0;
        
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        
        for (let t = 0; t <= 1; t += 0.01) {
          const x = baseX + (targetX - baseX) * t + missOffset * t;
          const y = baseY + (targetY - baseY) * t * t;
          
          if (t <= progress) {
            ctx.lineTo(x, y);
          }
        }
        
        const missColor = currentMissDistance >= SAFE_DISTANCE ? '#22c55e' :
                         currentMissDistance >= 0 ? '#eab308' :
                         currentMissDistance >= -1000 ? '#f97316' : '#ef4444';
        ctx.strokeStyle = missColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        if (!launched && predictedMiss >= SAFE_DISTANCE) {
          const futureDeflection = deflectionForce * 10 * 2;
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.moveTo(baseX, baseY);
          
          for (let t = 0; t <= 1; t += 0.01) {
            const x = baseX + (targetX - baseX) * t + futureDeflection * t;
            const y = baseY + (targetY - baseY) * t * t;
            ctx.lineTo(x, y);
          }
          
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        let asteroidProgress = progress;
        if (!willMiss && timeRemaining <= 0) {
          asteroidProgress = 1.0;
        } else if (willMiss) {
          asteroidProgress = Math.min(progress, 0.95);
        }
        
        const asteroidX = baseX + (targetX - baseX) * asteroidProgress + missOffset * asteroidProgress;
        const asteroidY = baseY + (targetY - baseY) * asteroidProgress * asteroidProgress;
        
        if (explosionFrame === 0) {
          ctx.beginPath();
          ctx.arc(asteroidX, asteroidY, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#8b7355';
          ctx.fill();
          ctx.strokeStyle = '#6b5335';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          const gradient = ctx.createRadialGradient(asteroidX, asteroidY, 4, asteroidX, asteroidY, 12);
          gradient.addColorStop(0, 'rgba(139, 115, 85, 0.8)');
          gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(asteroidX - 12, asteroidY - 12, 24, 24);
        }
        
        if (explosionFrame > 0 && !willMiss) {
          const maxRadius = 120;
          const explosionRadius = (explosionFrame / 30) * maxRadius;
          
          if (explosionFrame < 20) {
            const shockwaveRadius = explosionRadius * 1.5;
            ctx.beginPath();
            ctx.arc(targetX, targetY, shockwaveRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - explosionFrame / 20})`;
            ctx.lineWidth = 4;
            ctx.stroke();
          }
          
          const fireballGradient = ctx.createRadialGradient(
            targetX, targetY, 0,
            targetX, targetY, explosionRadius
          );
          
          if (explosionFrame < 15) {
            fireballGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            fireballGradient.addColorStop(0.3, 'rgba(255, 200, 0, 0.9)');
            fireballGradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.7)');
            fireballGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          } else {
            const fadeAmount = (explosionFrame - 15) / 15;
            fireballGradient.addColorStop(0, `rgba(255, 150, 0, ${1 - fadeAmount * 0.5})`);
            fireballGradient.addColorStop(0.4, `rgba(255, 80, 0, ${0.8 - fadeAmount * 0.6})`);
            fireballGradient.addColorStop(0.7, `rgba(200, 0, 0, ${0.5 - fadeAmount * 0.5})`);
            fireballGradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
          }
          
          ctx.fillStyle = fireballGradient;
          ctx.beginPath();
          ctx.arc(targetX, targetY, explosionRadius, 0, Math.PI * 2);
          ctx.fill();
          
          if (explosionFrame < 25) {
            for (let i = 0; i < 12; i++) {
              const angle = (i / 12) * Math.PI * 2;
              const particleDistance = explosionRadius * 0.7;
              const px = targetX + Math.cos(angle) * particleDistance;
              const py = targetY + Math.sin(angle) * particleDistance;
              const particleSize = (25 - explosionFrame) * 2;
              
              const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, particleSize);
              particleGradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
              particleGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
              
              ctx.fillStyle = particleGradient;
              ctx.beginPath();
              ctx.arc(px, py, particleSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          if (explosionFrame > 10) {
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2 + explosionFrame * 0.1;
              const cloudDistance = explosionRadius * 1.2;
              const cx = targetX + Math.cos(angle) * cloudDistance;
              const cy = targetY + Math.sin(angle) * cloudDistance;
              const cloudSize = explosionRadius * 0.4;
              
              const smokeGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cloudSize);
              const opacity = Math.max(0, 1 - (explosionFrame - 10) / 20);
              smokeGradient.addColorStop(0, `rgba(80, 80, 80, ${opacity * 0.6})`);
              smokeGradient.addColorStop(1, 'rgba(40, 40, 40, 0)');
              
              ctx.fillStyle = smokeGradient;
              ctx.beginPath();
              ctx.arc(cx, cy, cloudSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          if (explosionFrame < 5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.5 - explosionFrame * 0.1})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [screen, location, timeRemaining, deflectionForce, launched, currentMissDistance, predictedMiss, explosionFrame, timeElapsed]);

  const handleLaunch = () => {
    setLaunched(true);
    setGameRunning(true);
    setShowFactCard(3);
  };

  const handleReset = () => {
    setScreen('selection');
    setLocation(null);
    setTimeRemaining(10.0);
    setDeflectionForce(25.0);
    setLaunched(false);
    setGameRunning(false);
    setShowFactCard(1);
    setTimeSpeed(1);
    setExplosionFrame(0);
  };

  const togglePause = () => {
    setGameRunning(!gameRunning);
  };

  const changeTimeSpeed = (speed) => {
    setTimeSpeed(speed);
  };

  const getMissColor = (miss) => {
    if (miss >= SAFE_DISTANCE) return 'text-green-500';
    if (miss >= 0) return 'text-yellow-500';
    if (miss >= -1000) return 'text-orange-500';
    return 'text-red-500';
  };

  const physics = screen === 'results' || screen === 'game' ? calculateImpactPhysics() : null;

  const factCards = {
    1: {
      title: "The Real Bennu",
      content: "101955 Bennu is a REAL near-Earth asteroid discovered in 1999. NASA's OSIRIS-REx mission visited Bennu and returned samples to Earth in 2023. It has a 1 in 2,700 chance of impacting Earth in 2182.",
      source: "NASA OSIRIS-REx Mission Facts"
    },
    2: {
      title: "Impact Energy Scale",
      content: "Bennu carries 1,400 megatons of TNT equivalent energy - equal to 80,000 Hiroshima bombs. This is enough energy to power the entire world for 2 weeks.",
      source: "NASA CNEOS Impact Effects Calculator"
    },
    3: {
      title: "Deflection Science",
      content: "In 2022, NASA's DART mission proved we can deflect asteroids. The spacecraft changed an asteroid's orbit by 33 minutes - a small nudge years in advance creates a big miss.",
      source: "NASA DART Mission Results"
    },
    4: {
      title: "Planetary Defense",
      content: "NASA tracks over 30,000 near-Earth objects. Early detection is key - just 1 cm/s velocity change 10 years out creates a 315 km miss distance. We can protect Earth with current technology.",
      source: "NASA Planetary Defense Coordination Office"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4">
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
            <h1 className="text-3xl font-bold text-blue-400">AstroSim</h1>
          </div>
          {screen !== 'selection' && (
            <button
              onClick={handleReset}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              <Home className="w-5 h-5" />
              Home
            </button>
          )}
        </div>
      </div>

      {screen === 'selection' && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 mt-8">
            <h1 className="text-5xl font-bold mb-4 text-blue-400">BENNU DEFENSE MISSION</h1>
            <p className="text-xl text-gray-300">Select impact scenario to defend Earth</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => { setLocation('ocean'); setScreen('game'); setShowFactCard(2); }}
              className="bg-[#2E4272] hover:bg-[#3d5494] p-10 rounded-xl border border-blue-400/30 transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🌊</div>
                <h2 className="text-3xl font-bold mb-3 text-blue-300">OCEAN IMPACT</h2>
                <p className="text-xl mb-2 text-gray-200">Atlantic Ocean</p>
                <p className="text-lg text-blue-300 mb-4">33°N, 65°W</p>
                <div className="mt-6 text-sm space-y-2 text-gray-300">
                  <p>• Massive crater formation</p>
                  <p>• Complete devastation</p>
                  <p>• Agricultural collapse</p>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg border border-blue-500">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2 text-blue-400">{factCards[1].title}</h3>
                <p className="text-gray-300 mb-2">{factCards[1].content}</p>
                <p className="text-sm text-gray-500">Source: {factCards[1].source}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'game' && (
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold text-blue-400">PLANETARY DEFENSE MISSION</h2>
            <p className="text-xl text-gray-300">{locations[location].name} - {locations[location].coords}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full bg-slate-900 rounded-lg border-2 border-blue-500"
              />

              <div className="mt-4 bg-slate-800/50 p-6 rounded-lg border border-blue-500/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Impact Countdown</p>
                    <p className="text-4xl font-bold text-blue-400">{timeRemaining.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">YEARS TO IMPACT</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Status</p>
                    <p className={`text-2xl font-bold ${getMissColor(currentMissDistance)}`}>
                      {currentMissDistance >= 0 ? 'SAFE TRAJECTORY' : 'COLLISION COURSE'}
                    </p>
                    <p className={`text-xl font-mono ${getMissColor(currentMissDistance)}`}>
                      {currentMissDistance.toFixed(0)} km
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Required Distance</p>
                    <p className="text-4xl font-bold text-green-400">+{SAFE_DISTANCE}</p>
                    <p className="text-sm text-gray-500">KM SAFE MARGIN</p>
                  </div>
                </div>
                
                <div className="text-center py-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">DEFLECTION APPLIED</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {launched ? deflectionForce.toFixed(2) : '0.00'} cm/s
                  </p>
                </div>
              </div>

              {launched && (
                <div className="mt-4 bg-[#2E4272] p-4 rounded-xl border border-blue-400/30 shadow-lg">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={togglePause}
                        className={`flex-1 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                          gameRunning 
                            ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-600/30' 
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/30'
                        }`}
                      >
                        {gameRunning ? (
                          <>
                            <Pause className="w-5 h-5" />
                            PAUSE SIMULATION
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            RESUME SIMULATION
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FastForward className="w-5 h-5 text-cyan-400" />
                          <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Time Speed</span>
                        </div>
                        <span className="text-lg font-bold text-cyan-400">{timeSpeed}x</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 5, 10].map(speed => (
                          <button
                            key={speed}
                            onClick={() => changeTimeSpeed(speed)}
                            className={`py-2 px-4 rounded-lg font-bold transition-all ${
                              timeSpeed === speed 
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-[#2E4272] p-6 rounded-xl border border-blue-400/30 shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-center text-blue-300 uppercase tracking-wide">Control Panel</h3>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Deflection Force</label>
                    <span className="text-2xl font-bold text-cyan-400">{deflectionForce.toFixed(1)} cm/s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="50.0"
                    step="0.1"
                    value={deflectionForce}
                    onChange={(e) => setDeflectionForce(parseFloat(e.target.value))}
                    disabled={launched}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>0.1</span>
                    <span>25.0</span>
                    <span>50.0</span>
                  </div>
                  <div className="mt-4 bg-slate-800/50 p-3 rounded-lg border border-cyan-500/30">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Real-time Preview</p>
                    <p className={`text-lg font-bold ${getMissColor(predictedMiss)}`}>
                      Predicted Miss: {predictedMiss >= 0 ? '+' : ''}{predictedMiss.toFixed(0)} km
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLaunch}
                  disabled={launched}
                  className={`w-full py-5 rounded-xl font-bold text-2xl flex items-center justify-center gap-3 transition-all ${
                    launched 
                      ? 'bg-gray-700 cursor-not-allowed text-gray-400 border border-gray-600' 
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30 border border-red-400'
                  }`}
                >
                  <Play className="w-7 h-7" />
                  {launched ? 'MISSION IN PROGRESS' : 'LAUNCH KINETIC IMPACTOR'}
                </button>

                {launched && (
                  <div className="mt-4 text-center">
                    <div className="inline-block bg-green-900/30 border border-green-500/50 px-4 py-2 rounded-lg">
                      <p className="text-sm text-green-300 font-semibold">✓ Impactor Deployed</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#2E4272] p-5 rounded-xl border border-blue-400/30 shadow-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-cyan-300 mb-2 text-lg">{factCards[showFactCard].title}</h4>
                    <p className="text-sm text-gray-300 leading-relaxed mb-2">{factCards[showFactCard].content}</p>
                    <p className="text-xs text-gray-500 italic">Source: {factCards[showFactCard].source}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'results' && (
        <div className="max-w-6xl mx-auto">
          {currentMissDistance >= SAFE_DISTANCE ? (
            <div className="text-center mb-8">
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
              <h1 className="text-5xl font-bold text-green-400 mb-4">MISSION SUCCESS!</h1>
              <p className="text-2xl text-gray-300">Earth saved by {currentMissDistance.toFixed(0)} km</p>
              <p className="text-lg text-gray-400 mt-2">Deflection: {deflectionForce.toFixed(1)} cm/s applied over {timeElapsed.toFixed(1)} years</p>
            </div>
          ) : (
            <div className="text-center mb-8">
              <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-4" />
              <h1 className="text-5xl font-bold text-red-400 mb-4">IMPACT EVENT</h1>
              <p className="text-2xl text-gray-300">Regional Catastrophe at {locations[location].name}</p>
              <p className="text-lg text-gray-400 mt-2">Miss distance: {currentMissDistance.toFixed(0)} km (Required: +{SAFE_DISTANCE} km)</p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="mx-auto block mb-8 bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            TRY AGAIN
          </button>

          {currentMissDistance < SAFE_DISTANCE && (
            <div className="bg-red-900 border-2 border-red-500 p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-bold mb-4 text-red-300">IMPACT CONSEQUENCES</h2>
              {location === 'ocean' ? (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-bold mb-2">Tsunami Effects:</p>
                    <p>• Wave at impact: {locations.ocean.impact.tsunamiWave}</p>
                    <p>• Coastal waves: {locations.ocean.impact.coastalWaves}</p>
                    <p>• Warning time: {locations.ocean.impact.warningTime}</p>
                    <p>• Inland inundation: {locations.ocean.impact.inundation}</p>
                  </div>
                  <div>
                    <p className="font-bold mb-2">Cities Affected:</p>
                    {locations.ocean.impact.cities.map(city => (
                      <p key={city}>• {city}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-bold mb-2">Crater Formation:</p>
                    <p>• Diameter: {locations.land.impact.craterWidth}</p>
                    <p>• Depth: {locations.land.impact.craterDepth}</p>
                    <p>• Immediate destruction: {locations.land.impact.immediateRadius} radius</p>
                    <p>• Severe damage: {locations.land.impact.severeRadius} radius</p>
                  </div>
                  <div>
                    <p className="font-bold mb-2">Regional Impact:</p>
                    <p>• Agricultural loss: {locations.land.impact.agricultureLoss}</p>
                    <p>• Complete devastation zone</p>
                    <p>• Most structures destroyed</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {physics && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">DETAILED IMPACT CALCULATIONS</h2>

              <div className="bg-slate-800 p-6 rounded-lg border border-blue-500">
                <h3 className="text-xl font-bold mb-4 text-blue-300">Impact Energy Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Total Kinetic Energy:</p>
                    <p className="font-bold text-lg">{physics.energy.energyMegatons.toLocaleString()} Megatons TNT</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Equivalent to:</p>
                    <p className="font-bold">{physics.energy.hiroshimaBombs.toLocaleString()} Hiroshima bombs</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">World Power Equivalent:</p>
                    <p className="font-bold">{physics.energy.worldPowerDays} days of global energy consumption</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Impact Velocity:</p>
                    <p className="font-bold">{physics.impact.velocity.toLocaleString()} m/s ({(physics.impact.velocity * 3.6).toFixed(0)} km/h)</p>
                  </div>
                </div>
              </div>

              {location === 'land' && (
                <div className="bg-slate-800 p-6 rounded-lg border border-amber-500">
                  <h3 className="text-xl font-bold mb-4 text-amber-300">Crater Formation (Schmidt-Holsapple Scaling)</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Crater Diameter:</p>
                      <p className="font-bold text-lg">{physics.crater.diameter.toFixed(1)} meters ({(physics.crater.diameter / 1000).toFixed(2)} km)</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Crater Depth:</p>
                      <p className="font-bold text-lg">{physics.crater.depth.toFixed(0)} meters</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Crater Volume:</p>
                      <p className="font-bold">{(physics.crater.volume / 1e9).toFixed(2)} km³</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Ejecta Mass:</p>
                      <p className="font-bold">{physics.crater.ejectaMass.toFixed(2)} billion tons</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Ejecta Volume:</p>
                      <p className="font-bold">{physics.crater.ejectaVolume.toFixed(2)} km³</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-800 p-6 rounded-lg border border-red-500">
                <h3 className="text-xl font-bold mb-4 text-red-300">Air Blast & Overpressure Effects</h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-red-900 p-3 rounded">
                    <p className="text-gray-300 mb-1">20 PSI Overpressure Radius (Complete Destruction):</p>
                    <p className="font-bold text-lg">{physics.blast.overpressure20psi.toFixed(1)} km</p>
                    <p className="text-xs text-gray-400">Reinforced concrete buildings destroyed, crater formation</p>
                  </div>
                  <div className="bg-orange-900 p-3 rounded">
                    <p className="text-gray-300 mb-1">5 PSI Overpressure Radius (Severe Damage):</p>
                    <p className="font-bold text-lg">{physics.blast.overpressure5psi.toFixed(1)} km</p>
                    <p className="text-xs text-gray-400">Most buildings collapse, widespread casualties</p>
                  </div>
                  <div className="bg-yellow-900 p-3 rounded">
                    <p className="text-gray-300 mb-1">1 PSI Overpressure Radius (Moderate Damage):</p>
                    <p className="font-bold text-lg">{physics.blast.overpressure1psi.toFixed(1)} km</p>
                    <p className="text-xs text-gray-400">Window breakage, minor injuries, structural damage</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <p className="text-gray-400 mb-1">Seismic Magnitude:</p>
                      <p className="font-bold">{physics.blast.magnitude.toFixed(1)} Mw</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Blast Radius:</p>
                      <p className="font-bold">{physics.blast.blastRadius.toFixed(1)} km</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-lg border border-orange-500">
                <h3 className="text-xl font-bold mb-4 text-orange-300">Thermal Radiation Effects</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Fireball Radius:</p>
                    <p className="font-bold text-lg">{physics.blast.fireballRadius.toFixed(2)} km</p>
                    <p className="text-xs text-gray-400">Maximum fireball extent</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Fireball Duration:</p>
                    <p className="font-bold text-lg">{physics.blast.fireballDuration.toFixed(1)} seconds</p>
                    <p className="text-xs text-gray-400">Time of maximum brightness</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Thermal Radiation Radius:</p>
                    <p className="font-bold text-lg">{physics.blast.thermalRadius.toFixed(1)} km</p>
                    <p className="text-xs text-gray-400">3rd degree burns, ignition of flammables</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Thermal Fluence:</p>
                    <p className="font-bold text-lg">{physics.blast.thermalFluence.toFixed(0)} cal/cm²</p>
                    <p className="text-xs text-gray-400">Energy delivered per unit area</p>
                  </div>
                </div>
              </div>

              {location === 'ocean' && physics.tsunami && (
                <div className="bg-slate-800 p-6 rounded-lg border border-cyan-500">
                  <h3 className="text-xl font-bold mb-4 text-cyan-300">Tsunami Wave Analysis</h3>
                  <div className="space-y-4 text-sm">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 mb-1">Initial Wave Amplitude:</p>
                        <p className="font-bold text-lg">{physics.tsunami.initialAmplitude.toFixed(0)} meters</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Wave Velocity:</p>
                        <p className="font-bold text-lg">{physics.tsunami.velocity.toFixed(0)} km/h</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Wavelength:</p>
                        <p className="font-bold text-lg">{physics.tsunami.wavelength.toFixed(1)} km</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Wave Period:</p>
                        <p className="font-bold">{(physics.tsunami.period / 60).toFixed(1)} minutes</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Energy Flux:</p>
                        <p className="font-bold">{physics.tsunami.energyFlux.toFixed(1)} MW/m</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Cavity Depth:</p>
                        <p className="font-bold">{physics.tsunami.cavityDepth.toFixed(0)} meters</p>
                      </div>
                    </div>
                    
                    <div className="bg-cyan-900 p-4 rounded">
                      <p className="font-bold mb-3 text-cyan-200">Coastal City Impact Predictions:</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {Object.entries(physics.tsunami.arrivalTime).map(([city, time]) => (
                          <div key={city} className="bg-slate-700 p-2 rounded">
                            <p className="font-bold">{city}</p>
                            <p className="text-xs text-gray-300">Arrival: {time.toFixed(1)} hours</p>
                            <p className="text-xs text-gray-300">Wave Height: {physics.tsunami.waveHeights[city].toFixed(1)} meters</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-800 p-6 rounded-lg border border-green-500">
                <h3 className="text-xl font-bold mb-4 text-green-300">Kinetic Impactor Mission Parameters</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Impactor Mass:</p>
                    <p className="font-bold">{physics.deflection.impactorMass} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Impact Velocity:</p>
                    <p className="font-bold">{physics.deflection.impactorVelocity.toLocaleString()} m/s</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Momentum Transfer:</p>
                    <p className="font-bold">{(physics.deflection.momentumTransfer / 1000).toFixed(1)} kN·s</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Direct Velocity Change:</p>
                    <p className="font-bold">{physics.deflection.velocityChange.toFixed(3)} cm/s</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Beta Enhancement Factor:</p>
                    <p className="font-bold">{physics.deflection.betaEnhancement.toFixed(2)}×</p>
                    <p className="text-xs text-gray-400">Ejecta momentum multiplication</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Effective ΔV:</p>
                    <p className="font-bold">{physics.deflection.effectiveChange.toFixed(2)} cm/s</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-gray-400 mb-1">Miss Distance per cm/s (Full Mission):</p>
                    <p className="font-bold text-lg">{physics.deflection.missDistancePerCmS.toFixed(1)} km/cm/s</p>
                    <p className="text-xs text-gray-400">Each cm/s of deflection creates this miss distance over 10 years</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-lg border border-purple-500">
                <h3 className="text-xl font-bold mb-4 text-purple-300">Bennu Physical Properties</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Mass:</p>
                    <p className="font-bold">{physics.impact.mass.toFixed(2)} billion kg</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Diameter:</p>
                    <p className="font-bold">{physics.impact.diameter} meters</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Bulk Density:</p>
                    <p className="font-bold">{physics.impact.density} kg/m³</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Impact Velocity:</p>
                    <p className="font-bold">{physics.impact.velocity.toLocaleString()} m/s</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Impact Angle:</p>
                    <p className="font-bold">{physics.impact.angle}°</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Composition:</p>
                    <p className="font-bold">Carbonaceous (C-type)</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-lg border border-indigo-500">
                <h3 className="text-xl font-bold mb-4 text-indigo-300">Orbital Mechanics</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Semi-Major Axis:</p>
                    <p className="font-bold">{physics.orbital.semiMajorAxis} AU</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Eccentricity:</p>
                    <p className="font-bold">{physics.orbital.eccentricity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Inclination:</p>
                    <p className="font-bold">{physics.orbital.inclination}°</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Orbital Period:</p>
                    <p className="font-bold">{physics.orbital.period.toFixed(1)} days ({(physics.orbital.period / 365.25).toFixed(2)} years)</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Perihelion:</p>
                    <p className="font-bold">{physics.orbital.perihelion.toFixed(3)} AU</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Aphelion:</p>
                    <p className="font-bold">{physics.orbital.aphelion.toFixed(3)} AU</p>
                  </div>
                </div>
              </div>

              {currentMissDistance >= SAFE_DISTANCE && (
                <div className="bg-green-900 border-2 border-green-500 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-8 h-8 text-green-300 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-green-300">{factCards[4].title}</h3>
                      <p className="text-gray-200 mb-2">{factCards[4].content}</p>
                      <p className="text-sm text-gray-400">Source: {factCards[4].source}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-800 p-6 rounded-lg border border-blue-500">
                <h3 className="text-xl font-bold mb-4 text-blue-300">Mission Summary</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Scenario:</p>
                    <p className="font-bold">{locations[location].name} Impact ({locations[location].coords})</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Mission Outcome:</p>
                    <p className={`font-bold text-lg ${currentMissDistance >= SAFE_DISTANCE ? 'text-green-400' : 'text-red-400'}`}>
                      {currentMissDistance >= SAFE_DISTANCE ? 'SUCCESS' : 'FAILED'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Deflection Applied:</p>
                    <p className="font-bold">{deflectionForce.toFixed(2)} cm/s</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Final Miss Distance:</p>
                    <p className={`font-bold ${getMissColor(currentMissDistance)}`}>{currentMissDistance.toFixed(0)} km</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Warning Time Used:</p>
                    <p className="font-bold">{timeElapsed.toFixed(1)} years</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Safety Margin:</p>
                    <p className="font-bold">{(currentMissDistance - SAFE_DISTANCE).toFixed(0)} km</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AstroSim;<p>• Massive tsunami waves</p>
                  <p>• Coastal devastation</p>
                  <p>• Major cities at risk</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setLocation('land'); setScreen('game'); setShowFactCard(2); }}
              className="bg-[#2E4272] hover:bg-[#3d5494] p-10 rounded-xl border border-blue-400/30 transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🏜️</div>
                <h2 className="text-3xl font-bold mb-3 text-blue-300">LAND IMPACT</h2>
                <p className="text-xl mb-2 text-gray-200">Central USA</p>
                <p className="text-lg text-blue-300 mb-4">40°N, 100°W</p>
                <div className="mt-6 text-sm space-y-2 text-gray-300">
                  
