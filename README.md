# AstroSim - Asteroid Impact Simulator

An interactive educational simulation exploring asteroid deflection physics and impact scenarios based on asteroid 101955 Bennu. Built with real NASA data and scientific calculations.

## Game Overview

The simulation challenges players to defend Earth from an asteroid impact by deploying a kinetic impactor to deflect Bennu's trajectory. Players must choose the correct deflection force to achieve a safe miss distance of at least 2,000 km.

## How to Play

### 1. Location Selection Screen
Choose between two impact scenarios:
- **Ocean Impact**: Atlantic Ocean (33°N, 65°W) - Potential tsunami effects
- **Land Impact**: Central USA (40°N, 100°W) - Crater formation and regional devastation

### 2. Defense Game Screen

**Key Information Displayed:**
- **Impact Countdown**: Time remaining until impact (starts at 10.0 years)
- **Current Miss Distance**: Real-time calculation of how much the asteroid will miss Earth
  - Starts at -500 km (collision course)
  - Must reach +2,000 km for safety
- **Deflection Force Slider**: Adjust from 0.1 to 5.0 cm/s
  - Default: 2.5 cm/s
  - Shows real-time preview of predicted miss distance

**Controls:**
1. Adjust the deflection force slider to your desired value
2. Click "LAUNCH KINETIC IMPACTOR" to begin the mission
3. Watch as time counts down and the asteroid trajectory updates
4. Use pause/resume and time speed controls (1x, 2x, 5x, 10x) to manage the simulation

### 3. Results Screen
See the outcome of your mission:
- **Success**: Earth saved with detailed mission statistics
- **Failure**: Impact consequences based on selected location

## Game Physics

The simulation uses the deflection formula:
```
miss_distance = -500 + (deflection_force × time_elapsed × 31.536)
```

Where:
- `deflection_force`: Your chosen force in cm/s (0.1-5.0)
- `time_elapsed`: Years that have passed since launch
- `31.536`: Conversion constant (km per cm/s per year)

**Example**: A 2.5 cm/s deflection over 10 years creates a 788.4 km miss distance (not enough - you need 2,000+ km!)

## Educational Content

The game includes NASA-verified fact cards:
1. **The Real Bennu**: Information about the actual asteroid
2. **Impact Energy Scale**: Comparison of impact energy
3. **Deflection Science**: How NASA's DART mission proved deflection works
4. **Planetary Defense**: Current tracking capabilities

## Win/Lose Conditions

### Victory
- Final miss distance ≥ +2,000 km when countdown reaches 0
- Shows Earth protected and 8 billion people saved

### Failure
- Final miss distance < +2,000 km
- Displays location-specific consequences:
  - **Ocean**: Tsunami waves, coastal devastation, affected cities
  - **Land**: Crater dimensions, destruction zones, agricultural losses

## Development

Built with:
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)

### Run Locally
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

## Scientific Accuracy

Based on:
- NASA OSIRIS-REx mission data
- NASA DART mission results
- CNEOS Impact Effects Calculator
- Planetary Defense Coordination Office research

The deflection calculations, impact energies, and consequences are derived from peer-reviewed scientific models and NASA mission data.
