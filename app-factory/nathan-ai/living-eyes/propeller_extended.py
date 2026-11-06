#!/usr/bin/env python3
"""Additive 48/96/192/384 view engine built on the author's unchanged 24-axis Python class.
A coordinate-view simulator, not biological life, sentience or autonomous surveillance.
"""
import math
from originals.nathan_24_axis_propeller_original import NathanAI24AxisPropellerEngine

COUNTS = {"canonical": 48, "mirror": 96, "counter": 192, "full": 384}

def flip_vertical(point):
    return (point[0], -point[1])

def flip_mirror(point):
    return (-point[0], point[1])

def half_turn(point):
    return (-point[0], -point[1])

class NathanAIExtendedPropellerEngine(NathanAI24AxisPropellerEngine):
    """Preserves 24 source tracks, adds 24 vertical inversions then mirror/rotation views."""
    def __init__(self):
        super().__init__()
        self.ticks = 0

    def next_frame(self, velocity=1.5, mode="full", lock=False, cycle=180):
        if mode not in COUNTS:
            raise ValueError("mode must be canonical, mirror, counter, or full")
        if not math.isfinite(velocity) or velocity < 0 or velocity > 20:
            raise ValueError("velocity outside 0..20")
        if not isinstance(cycle, int) or cycle < 4 or cycle % 2:
            raise ValueError("cycle must be even >= 4")
        source = self.update_propeller_matrix(velocity, inversion_active=False)
        self.ticks += 1
        amplitude = 0.0 if lock else abs(math.cos(math.pi * (self.ticks % cycle) / cycle))
        mirror_options = (False,) if mode == "canonical" else (False, True)
        turn_options = (False, True) if mode == "full" else (False,)
        points = []
        for item in source:
            idx = item["axis_id"]
            assigned = "CW" if idx % 2 == 0 else "CCW"
            directions = ("CW", "CCW") if mode in ("counter", "full") else (assigned,)
            for inverted in (False, True):
                for mirrored in mirror_options:
                    for direction in directions:
                        for turned in turn_options:
                            phase = self.clockwise_phase if direction == "CW" else self.counter_clockwise_phase
                            angle = (self.base_angles[idx] + phase) % 360.0
                            p = (math.cos(math.radians(angle)) * amplitude,
                                 math.sin(math.radians(angle)) * amplitude)
                            if inverted:
                                p = flip_vertical(p)
                            if mirrored:
                                p = flip_mirror(p)
                            if turned:
                                p = half_turn(p)
                            if lock or amplitude < 1e-10:
                                p = (0.0, 0.0)
                            points.append({
                                "id": f"axis-{idx:02d}/inv{int(inverted)}/mirror{int(mirrored)}/{direction}/turn{int(turned)}",
                                "source_axis": idx, "rotation": direction,
                                "inverted": inverted, "mirrored": mirrored, "half_turn": turned,
                                "angle_deg": round(angle, 6), "x": round(p[0], 6), "y": round(p[1], 6)
                            })
        assert len(points) == COUNTS[mode]
        return {
            "schema": "nathan-ai.living-eyes.python.v1", "mode": mode,
            "primary_tracks": self.total_axes, "view_count": len(points),
            "equator": [self.EQUATOR, self.EQUATOR],
            "converged": all(p["x"] == 0 and p["y"] == 0 for p in points),
            "points": points
        }

if __name__ == "__main__":
    import json
    engine = NathanAIExtendedPropellerEngine()
    print(json.dumps(engine.next_frame(15, mode="canonical"), indent=2))
