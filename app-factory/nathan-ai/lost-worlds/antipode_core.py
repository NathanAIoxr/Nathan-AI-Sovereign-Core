"""Lost Worlds antipodal geometry — Nathan Tabor. Standard-library reference module.

Geometric proximity is not evidence of ancient settlement or migration.
"""
from math import radians, sin, cos, asin, sqrt

def antipode(latitude: float, longitude: float) -> tuple[float, float]:
    """Return opposite-Earth coordinates, normalized to [-180, 180)."""
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("Latitude/longitude outside geographic bounds")
    return round(-latitude, 6), round(((longitude + 360) % 360) - 180, 6)

def great_circle_km(a: tuple[float,float], b: tuple[float,float]) -> float:
    """Haversine separation of two geographic reference points."""
    la1,lo1=map(radians,a)
    la2,lo2=map(radians,b)
    h=sin((la2-la1)/2)**2+cos(la1)*cos(la2)*sin((lo2-lo1)/2)**2
    return round(12742*asin(min(1,sqrt(h))),1)

ORIGINS = {
    "Athens, Greece": (37.9838,23.7275),
    "Athens, Georgia, USA": (33.9519,-83.3576),
    "Memphis, Egypt": (29.85,31.25),
    "Memphis, Tennessee, USA": (35.1495,-90.049),
    "Bethlehem, West Bank": (31.7054,35.2024),
    "Bethlehem, New Zealand": (-37.69,176.11),
}
GEOLOGICAL_REFERENCE_POINTS = {
    "Ninetyeast Ridge": (-30,90),
    "Broken Ridge": (-31,97),
    "Zealandia": (-41,170),
    "Sundaland": (-2,108),
    "Doggerland": (54.5,3),
    "Tartessos region": (37.26,-6.94),
}
def candidate_links(origin: tuple[float,float], limit=5):
    """Rank reference-point distances to origin antipode; not polygon hits."""
    point=antipode(*origin)
    return sorted(
        [{"target":name,"distance_km":great_circle_km(point,coords)}
         for name,coords in GEOLOGICAL_REFERENCE_POINTS.items()],
        key=lambda x:x["distance_km"]
    )[:limit]
