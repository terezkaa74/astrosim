from flask import Flask, request, jsonify, send_from_directory
from physics.orbit import propagate_orbit_rk4, orbital_elements_to_state
from physics.impact import compute_impact_effects
from nasa_api import fetch_neo_data
import os

app = Flask(__name__, static_folder="../frontend", static_url_path="/")

NASA_API_KEY = os.getenv("NASA_API_KEY")
if not NASA_API_KEY:
    raise ValueError("NASA_API_KEY environment variable not set")

@app.route("/api/orbit/<neo_id>")
def get_orbit(neo_id):
    """Fetch real NASA orbital data and return as state vectors."""
    data = fetch_neo_data(neo_id, NASA_API_KEY)
    r0, v0 = orbital_elements_to_state(data["orbital_data"])
    return jsonify({"r0": r0, "v0": v0, "orbital_data": data["orbital_data"]})

@app.route("/api/simulate", methods=["POST"])
def simulate():
    """Simulate asteroid propagation and deflection."""
    params = request.get_json()
    r0 = params["r0"]
    v0 = params["v0"]
    deflection = params.get("deflection", None)
    num_steps = params.get("num_steps", 1000)

    traj = propagate_orbit_rk4(r0, v0, num_steps=num_steps, deflection=deflection)
    impact = next((p for p in traj if p["impact"]), None)
    return jsonify({"trajectory": traj, "impact": impact})

@app.route("/api/impact", methods=["POST"])
def impact_analysis():
    """Compute crater, seismic, and atmospheric effects."""
    params = request.get_json()
    result = compute_impact_effects(
        diameter=params["diameter"],
        velocity=params["velocity"],
        density=params.get("density", 3000),
        angle=params.get("angle", 45),
        location=params["location"]
    )
    return jsonify(result)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    """Serve frontend"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
