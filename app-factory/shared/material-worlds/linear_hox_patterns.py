"""Optional study helpers for Nathan Tabor's Tabor Decimal System.
Biology/cosmology inspired game abstractions; not biological simulations.
No runtime game integration or paid resource gates are introduced here.
"""
import math


def _nonnegative(value, name):
    if type(value) not in (int, float):
        raise ValueError(name + " must be a finite nonnegative number")
    try:
        value = float(value)
    except OverflowError:
        raise ValueError(name + " is too large") from None
    if not math.isfinite(value) or value < 0:
        raise ValueError(name + " must be a finite nonnegative number")
    return value


class LinearHoxFamilyPipeline:
    """Deterministic toy rules; the name does not imply a shared physical law."""

    def __init__(self):
        self.v_segments = ("V1", "V2", "V3")
        self.d_segments = ("D1", "D2")
        self.j_segments = ("J1", "J2")

    def gradient_strength(self, distance, decay=0.13, amplitude=1.0):
        """Generic exponential falloff in explicitly chosen game distance units.
        This is spatial falloff, not elapsed time or a head-to-tail embryo model.
        """
        distance = _nonnegative(distance, "distance")
        decay = _nonnegative(decay, "decay")
        amplitude = _nonnegative(amplitude, "amplitude")
        return amplitude * math.exp(-decay * distance)

    @staticmethod
    def _select(segments, index):
        if type(index) is not int or not 0 <= index < len(segments):
            raise ValueError("segment index is outside its catalogue")
        return segments[index]

    def assemble_profile(self, v_index, j_index, d_index=None):
        """Choose V+J, or V+D+J. No contiguous slice or biological claim.
        The finite toy catalogues yield six VJ and twelve VDJ profiles.
        Junctional diversity, rearrangement constraints, and selection are omitted.
        """
        v = self._select(self.v_segments, v_index)
        j = self._select(self.j_segments, j_index)
        if d_index is None:
            return (v, j)
        return (v, self._select(self.d_segments, d_index), j)

    @staticmethod
    def map_positions(count, spacing=1.0, origin=0.0):
        """Optional evenly spaced game nodes; this does not simulate BAO."""
        if type(count) is not int or not 0 <= count <= 4096:
            raise ValueError("count must be an integer from zero through 4096")
        spacing = _nonnegative(spacing, "spacing")
        if spacing == 0:
            raise ValueError("spacing must be positive")
        if type(origin) not in (int, float):
            raise ValueError("origin must be finite")
        try:
            origin = float(origin)
        except OverflowError:
            raise ValueError("origin is too large") from None
        if not math.isfinite(origin):
            raise ValueError("origin must be finite")
        positions = tuple(origin + i * spacing for i in range(count))
        if any(not math.isfinite(p) for p in positions):
            raise ValueError("map coordinates overflow")
        if any(a >= b for a, b in zip(positions, positions[1:])):
            raise ValueError("spacing is too small at this coordinate precision")
        return positions
