import os
import math
from flask import Flask, request, jsonify, send_from_directory
import requests
from functools import lru_cache

app = Flask(__name__, static_folder="../frontend", static_url_path="/")

NASA_API_KEY = os.environ.get("NASA_API_KEY")
if NASA_API_KEY is None:
    raise RuntimeError("NASA_API_KEY environment variable not set")

MU_SUN = 1.32712440018e20  # m^3/s^2

@lru_cache(maxsize=128)
def fetch_neo(neo_id):
    url = f"https://api.nasa.gov/neo/rest/v1/neo/{neo_id}?api_key={NASA_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()

@app.route("/api/neo/<neo_id>")
def api_neo(neo_id):
    data = fetch_neo(neo_id)
    return jsonify(data)

@app.route("/api/simulate", methods=["POST"])
def api_simulate():
    body = request.get_json()
    neo_id = body.get("neo_id")
    deflection = body.get("deflection", None)

    neo = fetch_neo(neo_id)
    orb = neo["orbital_data"]
    r0, v0 = orbital_elements_to_state(orb)

    traj = propagate_kepler(r0, v0, deflection)
    impact = detect_impact(traj)
    return jsonify({"trajectory": traj, "impact": impact})

@app.route("/api/effects", methods=["POST"])
def api_effects():
    b = request.get_json()
    impact = b.get("impact")
    D = b.get("diameter")
    v = b.get("velocity")
    rho = b.get("density", 3000)
    theta = b.get("impact_angle", 90)

    mass = (4/3) * math.pi * (D/2)**3 * rho
    E = 0.5 * mass * v**2

    crater = compute_crater(D, v, rho, theta)
    blast = compute_blast(E)
    seismic = compute_seismic(E)
    tsunami = None

    return jsonify({
        "mass": mass,
        "energy_J": E,
        "crater": crater,
        "blast": blast,
        "seismic": seismic,
        "tsunami": tsunami
    })

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

def orbital_elements_to_state(orb):
    a_au = float(orb["semi_major_axis"])
    e = float(orb["eccentricity"])
    i_deg = float(orb["inclination"])
    node_deg = float(orb["ascending_node_longitude"])
    argp_deg = float(orb["argument_of_perihelion"])
    M_deg = float(orb["mean_anomaly"])

    a = a_au * 1.495978707e11
    i = math.radians(i_deg)
    omega = math.radians(argp_deg)
    raan = math.radians(node_deg)
    M = math.radians(M_deg)

    E = solve_kepler(M, e)
    nu = 2 * math.atan2(math.sqrt(1+e)*math.sin(E/2), math.sqrt(1-e)*math.cos(E/2))
    r = a * (1 - e * math.cos(E))

    x_p = r * math.cos(nu)
    y_p = r * math.sin(nu)
    mu = MU_SUN
    h = math.sqrt(mu * a * (1 - e*e))
    vx_p = - (mu / h) * math.sin(nu)
    vy_p = (mu / h) * (e + math.cos(nu))

    cos_O = math.cos(raan)
    sin_O = math.sin(raan)
    cos_i = math.cos(i)
    sin_i = math.sin(i)
    cos_w = math.cos(omega)
    sin_w = math.sin(omega)

    R11 = cos_O * cos_w - sin_O * sin_w * cos_i
    R12 = -cos_O * sin_w - sin_O * cos_w * cos_i
    R13 = sin_O * sin_i
    R21 = sin_O * cos_w + cos_O * sin_w * cos_i
    R22 = -sin_O * sin_w + cos_O * cos_w * cos_i
    R23 = -cos_O * sin_i
    R31 = sin_w * sin_i
    R32 = cos_w * sin_i
    R33 = cos_i

    x = R11 * x_p + R12 * y_p
    y = R21 * x_p + R22 * y_p
    z = R31 * x_p + R32 * y_p

    vx = R11 * vx_p + R12 * vy_p
    vy = R21 * vx_p + R22 * vy_p
    vz = R31 * vx_p + R32 * vy_p

    return ([x, y, z], [vx, vy, vz])

def solve_kepler(M, e, tol=1e-8):
    if e < 0.8:
        E = M
    else:
        E = math.pi
    for _ in range(100):
        f = E - e * math.sin(E) - M
        fp = 1 - e * math.cos(E)
        dE = -f / fp
        E += dE
        if abs(dE) < tol:
            break
    return E

def propagate_kepler(r0, v0, deflection=None, num_steps=500, dt=3600*24*3):
    traj = []
    rx, ry, rz = r0
    vx, vy, vz = v0

    total_time = dt * num_steps
    def_time = None
    dv = None
    if deflection:
        time_frac = deflection.get("time_frac", 0.5)
        def_time = total_time * time_frac
        dv = deflection.get("delta_v", [0,0,0])

    t = 0.0
    for step in range(num_steps + 1):
        traj.append({"t": t, "x": rx, "y": ry, "z": rz})
        if deflection and abs(t - def_time) < dt/2:
            vx += dv[0]
            vy += dv[1]
            vz += dv[2]
        r = math.sqrt(rx*rx + ry*ry + rz*rz)
        ax = - MU_SUN * rx / (r**3)
        ay = - MU_SUN * ry / (r**3)
        az = - MU_SUN * rz / (r**3)
        vx += ax * dt
        vy += ay * dt
        vz += az * dt
        rx += vx * dt
        ry += vy * dt
        rz += vz * dt
        t += dt

    return traj

def detect_impact(traj):
    AU = 1.495978707e11
    for p in traj:
        r = math.sqrt(p["x"]**2 + p["y"]**2 + p["z"]**2)
        if abs(r - AU) < 1e9:
            lat = math.degrees(math.asin(p["z"]/r))
            lon = math.degrees(math.atan2(p["y"], p["x"]))
            return {"lat": lat, "lon": lon, "t": p["t"]}
    return None

def compute_crater(D, v, rho, theta):
    mass = (4/3) * math.pi * (D/2)**3 * rho
    E = 0.5 * mass * v**2
    k = 0.1
    D_cr = k * (E ** (1/3))
    depth = D_cr / 5
    return {"diameter_m": D_cr, "depth_m": depth}

def compute_blast(E):
    alpha = 1e-3
    r1 = alpha * (E ** (1/3))
    r2 = 2 * r1
    return {"radius1": r1, "radius2": r2}

def compute_seismic(E):
    M = (2/3) * math.log10(E) - 3.2
    return {"magnitude": M}

if __name__ == "__main__":
    app.run(debug=True)
