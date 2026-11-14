import math
from typing import Dict, List, Tuple

# Earth radius constants
EARTH_RADIUS_MILES = 3958.7613
EARTH_RADIUS_KM = 6371.0088


class GeoSpatialAlignmentEngine:
    """
    Combines great-circle ('as the crow flies') distance/bearing calculations,
    2D affine map transformations (rotation, scaling, translation), and
    multi-point geometric triangle analysis for comparing historical or
    clustered map layouts.
    """

    def __init__(self, locations: Dict[str, Tuple[float, float]] = None):
        # Store coordinates as { "Name": (latitude, longitude) }
        self.locations = locations if locations is not None else {}

    def add_location(self, name: str, lat: float, lon: float) -> None:
        """Registers a geographic coordinate (in decimal degrees)."""
        self.locations[name] = (lat, lon)

    @staticmethod
    def haversine_distance(
        coord1: Tuple[float, float],
        coord2: Tuple[float, float],
        unit: str = "miles",
    ) -> float:
        """
        Calculates the great-circle ('as the crow flies') distance between
        two (lat, lon) coordinate pairs.
        """
        lat1, lon1 = map(math.radians, coord1)
        lat2, lon2 = map(math.radians, coord2)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

        radius = EARTH_RADIUS_KM if unit.lower() == "km" else EARTH_RADIUS_MILES
        return radius * c

    @staticmethod
    def initial_bearing(
        coord1: Tuple[float, float], coord2: Tuple[float, float]
    ) -> float:
        """
        Calculates the initial compass bearing (0 to 360 degrees) from
        coord1 to coord2 along a great-circle path.
        """
        lat1, lon1 = map(math.radians, coord1)
        lat2, lon2 = map(math.radians, coord2)
        dlon = lon2 - lon1

        x = math.sin(dlon) * math.cos(lat2)
        y = math.cos(lat1) * math.sin(lat2) - (
            math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        )

        bearing = math.degrees(math.atan2(x, y))
        return (bearing + 360.0) % 360.0

    def analyze_triangle(
        self, point_a: str, point_b: str, point_c: str
    ) -> Dict[str, object]:
        """
        Computes side lengths, scale-invariant side ratios, and internal angles
        (using the Law of Cosines) for a 3-city cluster.
        """
        c_a = self.locations[point_a]
        c_b = self.locations[point_b]
        c_c = self.locations[point_c]

        # Side lengths opposite to vertices A, B, and C
        side_a = self.haversine_distance(c_b, c_c)  # B to C
        side_b = self.haversine_distance(c_a, c_c)  # A to C
        side_c = self.haversine_distance(c_a, c_b)  # A to B

        # Internal angles in degrees via Law of Cosines
        angle_a = math.degrees(
            math.acos(
                max(
                    -1.0,
                    min(
                        1.0,
                        (side_b**2 + side_c**2 - side_a**2)
                        / (2 * side_b * side_c),
                    ),
                )
            )
        )
        angle_b = math.degrees(
            math.acos(
                max(
                    -1.0,
                    min(
                        1.0,
                        (side_a**2 + side_c**2 - side_b**2)
                        / (2 * side_a * side_c),
                    ),
                )
            )
        )
        angle_c = 180.0 - (angle_a + angle_b)

        # Normalize ratios against the shortest side to check similarity across scales
        min_side = min(side_a, side_b, side_c)
        ratios = sorted(
            [
                round(side_a / min_side, 4),
                round(side_b / min_side, 4),
                round(side_c / min_side, 4),
            ]
        )

        return {
            "vertices": (point_a, point_b, point_c),
            "distances_miles": {
                f"{point_a} <-> {point_b}": round(side_c, 2),
                f"{point_b} <-> {point_c}": round(side_a, 2),
                f"{point_a} <-> {point_c}": round(side_b, 2),
            },
            "internal_angles_deg": {
                point_a: round(angle_a, 2),
                point_b: round(angle_b, 2),
                point_c: round(angle_c, 2),
            },
            "normalized_side_ratios": ratios,
        }

    @staticmethod
    def transform_map_coordinates(
        points: List[Tuple[float, float]],
        scale_factor: float = 1.0,
        rotation_degrees: float = 0.0,
        anchor: Tuple[float, float] = (0.0, 0.0),
        translation: Tuple[float, float] = (0.0, 0.0),
    ) -> List[Tuple[float, float]]:
        """
        Applies an affine transformation (scale, 360-degree rotation, and shift)
        to expand, shrink, or re-orient a map layer around an anchor point.
        """
        theta = math.radians(rotation_degrees)
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        ax, ay = anchor
        tx, ty = translation

        transformed = []
        for x, y in points:
            # 1. Translate relative to anchor
            dx = (x - ax) * scale_factor
            dy = (y - ay) * scale_factor

            # 2. Rotate across the 360-degree spectrum
            rx = dx * cos_t - dy * sin_t
            ry = dx * sin_t + dy * cos_t

            # 3. Restore anchor and apply target shift
            transformed.append((round(rx + ax + tx, 6), round(ry + ay + ty, 6)))

        return transformed

    def fit_overlay_to_target(
        self,
        source_p1: str,
        source_p2: str,
        target_p1: str,
        target_p2: str,
    ) -> Dict[str, float]:
        """
        Reverse-engineers the exact scale factor and rotation angle needed to
        align a two-point baseline from a source map onto a target map.
        """
        s1, s2 = self.locations[source_p1], self.locations[source_p2]
        t1, t2 = self.locations[target_p1], self.locations[target_p2]

        dist_source = self.haversine_distance(s1, s2)
        dist_target = self.haversine_distance(t1, t2)

        bearing_source = self.initial_bearing(s1, s2)
        bearing_target = self.initial_bearing(t1, t2)

        scale_needed = dist_target / dist_source
        rotation_needed = (bearing_target - bearing_source + 360.0) % 360.0

        return {
            "source_distance_miles": round(dist_source, 2),
            "target_distance_miles": round(dist_target, 2),
            "required_scale_multiplier": round(scale_needed, 4),
            "required_rotation_degrees": round(rotation_needed, 2),
        }


# =====================================================================
# EXAMPLE EXECUTION & VERIFICATION
# =====================================================================
if __name__ == "__main__":
    engine = GeoSpatialAlignmentEngine()

    # 1. Register key coordinates (Latitude, Longitude)
    engine.add_location("Athens, LA", 32.6581, -93.0278)
    engine.add_location("Bethlehem, NC", 35.8161, -81.2961)
    engine.add_location("Memphis, TN", 35.1495, -90.0490)

    engine.add_location("Athens, Greece", 37.9838, 23.7275)
    engine.add_location("Bethlehem, West Bank", 31.7054, 35.2024)
    engine.add_location("Memphis, Egypt", 29.8447, 31.2508)

    # 2. Verify straight-line distance & bearing (Athens, LA -> Bethlehem, NC)
    dist_la_nc = engine.haversine_distance(
        engine.locations["Athens, LA"], engine.locations["Bethlehem, NC"]
    )
    bearing_la_nc = engine.initial_bearing(
        engine.locations["Athens, LA"], engine.locations["Bethlehem, NC"]
    )
    print(f"Athens, LA to Bethlehem, NC: {dist_la_nc:.1f} miles | Bearing: {bearing_la_nc:.1f}°")

    # 3. Analyze the US Triangle (Athens, LA - Bethlehem, NC - Memphis, TN)
    us_triangle = engine.analyze_triangle("Athens, LA", "Bethlehem, NC", "Memphis, TN")
    print("\nUS Cluster Triangle Profile:", us_triangle)

    # 4. Analyze the Ancient World Triangle (Athens - Bethlehem - Memphis)
    ancient_triangle = engine.analyze_triangle(
        "Athens, Greece", "Bethlehem, West Bank", "Memphis, Egypt"
    )
    print("\nAncient Cluster Triangle Profile:", ancient_triangle)

    # 5. Reverse-engineer the scale and rotation needed to overlay the US pair
    #    onto the Ancient Mediterranean pair
    alignment_params = engine.fit_overlay_to_target(
        source_p1="Athens, LA",
        source_p2="Bethlehem, NC",
        target_p1="Athens, Greece",
        target_p2="Bethlehem, West Bank",
    )
    print("\nReverse-Engineered Alignment Parameters:", alignment_params)
