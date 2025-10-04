# 🌍 Asteroid Impact Simulator

**Explore asteroid impact scenarios** using real NASA NEO data and USGS geological datasets.  
Visualize orbital paths, impacts, and mitigation strategies in 3D.

## 🚀 Features
- Real-time NASA NEO API integration
- Orbital mechanics simulation
- Deflection scenario modeling (Δv)
- Crater & blast physics estimation
- Interactive 3D (Three.js) + 2D maps (Leaflet)
- Flask backend for data + physics

## 🧩 Tech Stack
| Layer | Technology |
|--------|-------------|
| Frontend | HTML, CSS, JavaScript, Three.js, Leaflet |
| Backend | Python (Flask, Requests, NumPy) |
| Data | NASA NEO API, USGS elevation & seismic data |

## 🧰 Setup

```bash
git clone https://github.com/<your-username>/asteroid-impact-simulator.git
cd asteroid-impact-simulator/backend
pip install -r requirements.txt
export NASA_API_KEY="your_api_key"
python app.py
