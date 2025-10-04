import math

MU_SUN = 1.32712440018e20  # m³/s²

def orbital_elements_to_state(orb):
    """Convert NASA orbital parameters to Cartesian position/velocity."""
    a = float(orb["semi_major_axis"]) * 1.496e11
    e = float(orb["eccentricity"])
    i = math.radians(float(orb["inclination"]))
    node = math.radians(float(orb["ascending_node_longitude"]))
    argp = math.radians(float(orb["argument_of_perihelion"]))
    M = math.radians(float(orb["mean_anomaly"]))
    E = solve_kepler(M, e)
    nu = 2 * math.atan2(math.sqrt(1+e)*math.sin(E/2), math.sqrt(1-e)*math.cos(E/2))
    r = a * (1 - e * math.cos(E))
    h = math.sqrt(MU_SUN * a * (1 - e**2))

    x_p = r * math.cos(nu)
    y_p = r * math.sin(nu)
    vx_p = -(MU_SUN / h) * math.sin(nu)
    vy_p = (MU_SUN / h) * (e + math.cos(nu))

    R = rotation_matrix(i, node, argp)
    r_vec = matmul(R, [x_p, y_p, 0])
    v_vec = matmul(R, [vx_p, vy_p, 0])
    return r_vec, v_vec

def rotation_matrix(i, Ω, ω):
    """Compute 3D rotation matrix for orbital frame."""
    cosO, sinO, cosi, sini, cosw, sinw = map(math.cos, [Ω, Ω, i, i, ω, ω])
    return [
        [cosO*cosw - sinO*sinw*cosi, -cosO*sinw - sinO*cosw*cosi, sinO*sini],
        [sinO*cosw + cosO*sinw*cosi, -sinO*sinw + cosO*cosw*cosi, -cosO*sini],
        [sinw*sini, cosw*sini, cosi]
    ]

def matmul(M, v):
    return [sum(M[i][j]*v[j] for j in range(3)) for i in range(3)]

def solve_kepler(M, e, tol=1e-9):
    E = M if e < 0.8 else math.pi
    for _ in range(100):
        dE = (M - (E - e*math.sin(E))) / (1 - e*math.cos(E))
        E += dE
        if abs(dE) < tol: break
    return E

def propagate_orbit_rk4(r0, v0, num_steps=500, dt=3600*6, deflection=None):
    """Runge-Kutta 4th order propagation with optional deflection."""
    rx, ry, rz = r0
    vx, vy, vz = v0
    t = 0
    traj = []
    total_time = num_steps * dt

    def_time = None
    dv = [0, 0, 0]
    if deflection:
        def_time = total_time * deflection.get("time_frac", 0.5)
        dv = deflection.get("delta_v", [0, 0, 0])

    for step in range(num_steps):
        r = [rx, ry, rz]
        v = [vx, vy, vz]
        ax, ay, az = accel(r)

        # RK4 Integration
        k1v, k1r = [ax, ay, az], v
        k2v, k2r = accel(addv(r, scalev(k1r, dt/2))), addv(v, scalev(k1v, dt/2))
        k3v, k3r = accel(addv(r, scalev(k2r, dt/2))), addv(v, scalev(k2v, dt/2))
        k4v, k4r = accel(addv(r, scalev(k3r, dt))), addv(v, scalev(k3v, dt))

        rx, ry, rz = addv(r, scalev(addv(addv(k1r, scalev(addv(k2r, k3r), 2)), k4r), dt/6))
        vx, vy, vz = addv(v, scalev(addv(addv(k1v, scalev(addv(k2v, k3v), 2)), k4v), dt/6))

        t += dt
        if deflection and abs(t - def_time) < dt/2:
            vx += dv[0]; vy += dv[1]; vz += dv[2]

        dist = math.sqrt(rx**2 + ry**2 + rz**2)
        impact = abs(dist - 1.496e11) < 5e9  # simple Earth intercept
        traj.append({"t": t, "x": rx, "y": ry, "z": rz, "impact": impact})
    return traj

def accel(r):
    rmag = math.sqrt(sum(x**2 for x in r))
    return [-MU_SUN*x/(rmag**3) for x in r]

def addv(a, b): return [a[i] + b[i] for i in range(3)]
def scalev(a, s): return [x*s for x in a]
