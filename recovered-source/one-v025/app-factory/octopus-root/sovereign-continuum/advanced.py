"""SOVEREIGN CONTINUUM / DEEP ROOT: pure-Python numerical reference experiments.

Models only. No physical teleportation, neural measurement, biomedical connection,
consciousness reading, high-current equipment, or live machine control.
Python standard library only.
"""
import cmath
import hashlib
import json
import math

TAU = 2.0 * math.pi


def _normalized(values):
    norm = math.sqrt(sum(abs(v) ** 2 for v in values))
    if norm == 0:
        raise ValueError("Zero quantum-state norm")
    return [v / norm for v in values]


def _gate_h(state, bit):
    """Single-qubit transform for an 8-component state; bit 0 is the leftmost qubit."""
    result = [0j] * 8
    shift = 2 - bit
    for i in range(8):
        if ((i >> shift) & 1) == 0:
            j = i | (1 << shift)
            result[i] = (state[i] + state[j]) / math.sqrt(2)
            result[j] = (state[i] - state[j]) / math.sqrt(2)
    return result


def _gate_cnot(state, control, target):
    out = [0j] * 8
    cs, ts = 2 - control, 2 - target
    for i, amp in enumerate(state):
        j = i ^ (1 << ts) if ((i >> cs) & 1) else i
        out[j] = amp
    return out


def mirror_state_transfer(alpha=1 / math.sqrt(2), beta=1 / math.sqrt(2)):
    """Ideal textbook three-qubit state-transfer circuit, simulated on a computer.

    Measurement branches are explicitly enumerated, not performed on live qubits.
    Fidelity 1 in ideal math does NOT transfer matter, people or neurons.
    """
    a, b = _normalized([complex(alpha), complex(beta)])
    state = [0j] * 8
    state[0], state[4] = a, b
    state = _gate_h(state, 1)
    state = _gate_cnot(state, 1, 2)
    state = _gate_cnot(state, 0, 1)
    state = _gate_h(state, 0)
    branches = []
    for m0 in range(2):
        for m1 in range(2):
            i = 4 * m0 + 2 * m1
            bob = _normalized([state[i], state[i + 1]])
            if m1:
                bob = [bob[1], bob[0]]
            if m0:
                bob = [bob[0], -bob[1]]
            fidelity = abs(a.conjugate() * bob[0] + b.conjugate() * bob[1]) ** 2
            branches.append({"measurement": f"{m0}{m1}",
                             "probability": abs(state[i]) ** 2 + abs(state[i + 1]) ** 2,
                             "fidelity": fidelity})
    return branches


def _dft(vec, inverse=False):
    """Slow, inspectable transform; suitable for 16-64 synthetic samples only."""
    n = len(vec)
    if not n or n > 128:
        raise ValueError("DFT length must be 1..128")
    sign = 1 if inverse else -1
    factor = 1 / n if inverse else 1
    return [factor * sum(v * cmath.exp(sign * 2j * math.pi * k * j / n)
                         for j, v in enumerate(vec)) for k in range(n)]


def wave_packet_step(n=32, dt=0.05, width=4.0, momentum_mode=3):
    """Periodic free-particle Fourier step, dimensionless hbar = m = dx = 1."""
    if not 8 <= n <= 128 or width <= 0 or dt < 0:
        raise ValueError("Invalid wave-grid setup")
    psi = [math.exp(-((j - n / 3) ** 2) / (2 * width ** 2))
           * cmath.exp(2j * math.pi * momentum_mode * j / n)
           for j in range(n)]
    psi = _normalized(psi)
    spectrum = _dft(psi)
    for k in range(n):
        freq = 2 * math.pi * (k if k <= n // 2 else k - n) / n
        spectrum[k] *= cmath.exp(-0.5j * freq * freq * dt)
    after = _dft(spectrum, inverse=True)
    return {"before_norm": sum(abs(v)**2 for v in psi),
            "after_norm": sum(abs(v)**2 for v in after),
            "wave": after}


def membrane_step(voltage=-65.0, m=0.0529, h=0.596, n=0.3177,
                  applied_current=0.0, dt=0.01):
    """One classical ionic-current membrane-step illustration, in mV and ms.

    Not real nerve recording; not suitable for stimulation or patient decisions.
    """
    if dt <= 0 or dt > 0.1:
        raise ValueError("Use small positive dt <= 0.1ms")
    def stable(v):
        return 0.1 * v / (-math.expm1(-v / 10)) if abs(v) > 1e-8 else 1.0
    am = stable(voltage + 40)
    bm = 4 * math.exp(-(voltage + 65)/18)
    ah = 0.07 * math.exp(-(voltage + 65)/20)
    bh = 1 / (1 + math.exp(-(voltage + 35)/10))
    an = 0.01 * (voltage + 55) / (-math.expm1(-(voltage + 55)/10)) if abs(voltage + 55)>1e-8 else 0.1
    bn = 0.125 * math.exp(-(voltage + 65)/80)
    i_na = 120 * (m ** 3) * h * (voltage - 50)
    i_k = 36 * (n ** 4) * (voltage + 77)
    i_l = 0.3 * (voltage + 54.387)
    return {"voltage": voltage + dt * (applied_current - i_na - i_k - i_l),
            "m": m + dt * (am * (1 - m) - bm * m),
            "h": h + dt * (ah * (1 - h) - bh * h),
            "n": n + dt * (an * (1 - n) - bn * n)}


def synthetic_spectrum(frequency_hz=8.0, sampling_hz=64.0, samples=64):
    """Spectral peak of a generated sine wave, NOT measured brain activity."""
    if not 8 <= samples <= 128 or sampling_hz <= 0 or frequency_hz < 0 or frequency_hz >= sampling_hz / 2:
        raise ValueError("Invalid synthetic signal sample plan")
    x = [math.sin(TAU * frequency_hz * i / sampling_hz) for i in range(samples)]
    powers = [abs(v)**2 for v in _dft(x)[:samples // 2]]
    peak = max(range(1, len(powers)), key=lambda i: powers[i])
    return {"peak_hz": peak * sampling_hz / samples, "peak_power": powers[peak]}


def anomaly_frobenius(reference, observation):
    """Frobenius distance between two same-shape matrices."""
    if not reference or len(reference) != len(observation):
        raise ValueError("Matrix dimensions differ or empty")
    count = len(reference[0])
    if not count or any(len(row) != count for row in reference + observation):
        raise ValueError("Matrix rows must share dimensions")
    return math.sqrt(sum((float(x)-float(y))**2
                         for a, b in zip(reference, observation)
                         for x, y in zip(a, b)))


def receipt_digest(data):
    """Deterministic local bytes digest. Not identity proof or authorization."""
    raw = json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


if __name__ == "__main__":
    print("IDEAL TRANSFER BRANCHES", mirror_state_transfer())
    print("NORM-CONSERVING WAVE DEMO", {k:v for k,v in wave_packet_step().items() if k!='wave'})
    print("SYNTHETIC SPECTRAL PEAK", synthetic_spectrum())
    print("SAMPLE ANOMALY DISTANCE", anomaly_frobenius([[1,2]], [[2,4]]))
    print("LOCAL RECEIPT DIGEST", receipt_digest({"middle":"c","family":"void"}))
