import requests

def fetch_neo_data(neo_id, api_key):
    url = f"https://api.nasa.gov/neo/rest/v1/neo/{neo_id}?api_key={api_key}"
    r = requests.get(url)
    r.raise_for_status()
    return r.json()
