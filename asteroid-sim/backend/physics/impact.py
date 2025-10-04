import math

def compute_impact_effects(diameter, velocity, density, angle, location):
    """Compute realistic impact consequences."""
    mass = (4/3) * math.pi * (diameter/2)**3 * density
    energy = 0.5 * mass * velocity**2
    energy_tnt = energy / 4.184e9  # joules to tons TNT

    # Scaling laws (from Holsapple & Collins 2018)
    crater_diameter = 1.161 * (energy**0.294)
    crater_depth = crater_diameter / 5
    seismic_mag = (2/3) * math.log10(energy) - 3.2
    blast_radius = (energy**(1/3)) * 0.001

    effects = {
        "impact_location": location,
        "mass_kg": mass,
        "energy_joules": energy,
        "energy_tnt": energy_tnt,
        "crater": {
            "diameter_m": crater_diameter,
            "depth_m": crater_depth
        },
        "blast": {
            "radius_m": blast_radius,
            "overpressure_kpa": 101 * (energy**0.1)
        },
        "seismic": {
            "magnitude_eq": seismic_mag
        }
    }
    return effects
