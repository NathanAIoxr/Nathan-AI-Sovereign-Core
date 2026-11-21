const gasConstant = 8.314462618;
const pressureScale = 133.322387415;

export const models = {
  thermal: {
    title: "Sealed thermal cycle", summary: "Ideal Stirling cycle with perfect regeneration. Results are per cycle.",
    fields: [
      ["gas_moles", "Gas amount (mol)", 0.01], ["hot_k", "Hot side (K)", 350], ["cold_k", "Cold side (K)", 300],
      ["volume_min_m3", "Minimum volume (m³)", 0.0003], ["volume_max_m3", "Maximum volume (m³)", 0.0006]
    ],
    calculate({ gas_moles: n, hot_k: hot, cold_k: cold, volume_min_m3: min, volume_max_m3: max }) {
      if (hot < cold) throw new RangeError("The hot-side temperature must be at least the cold-side temperature.");
      if (max <= min) throw new RangeError("Maximum volume must exceed minimum volume.");
      const scale = n * gasConstant * (Math.log(max) - Math.log(min));
      const heatIn = scale * hot;
      const heatOut = scale * cold;
      const work = heatIn - heatOut;
      const states = [[hot, min], [hot, max], [cold, max], [cold, min]].map(([t, v]) => ({
        temperature_k: t, volume_m3: v, pressure_absolute_pa: n * gasConstant * t / v
      }));
      return {
        metrics: [["Heat supplied", heatIn, "J"], ["Heat rejected", heatOut, "J"], ["Net work", work, "J"],
          ["Ideal efficiency", 100 * (1 - cold / hot), "%"], ["Internal energy change", 0, "J"],
          ["Energy balance residual", heatIn - heatOut - work, "J"]],
        states
      };
    }
  },
  hydraulic: {
    title: "Hydraulic pump", summary: "Steady pressure difference and flow. This model describes hydraulic power.",
    fields: [["flow_l_min", "Flow (L/min)", 5], ["pressure_difference_mmhg", "Pressure difference (mmHg)", 100],
      ["efficiency", "Pump efficiency (0–1)", 0.5]],
    calculate({ flow_l_min: flow, pressure_difference_mmhg: pressure, efficiency }) {
      if (efficiency > 1) throw new RangeError("Pump efficiency must be at most 1.");
      const output = flow * 1e-3 / 60 * pressure * pressureScale;
      const input = output / efficiency;
      return { metrics: [["Hydraulic output", output, "W"], ["Power input", input, "W"], ["Power loss", input - output, "W"]] };
    }
  },
  rotors: {
    title: "Counter-rotating shafts", summary: "Rigid coaxial rotors. Use signed speeds to show opposite directions.",
    fields: [["left_inertia_kg_m2", "Left inertia (kg·m²)", 0.01], ["right_inertia_kg_m2", "Right inertia (kg·m²)", 0.01],
      ["left_rpm", "Left speed (rpm)", 100], ["right_rpm", "Right speed (rpm)", -100]],
    calculate({ left_inertia_kg_m2: left, right_inertia_kg_m2: right, left_rpm, right_rpm }) {
      const [a, b] = [left_rpm, right_rpm].map(rpm => rpm * (2 * Math.PI / 60));
      return { metrics: [
        ["Stored rotational energy", (left * a ** 2 + right * b ** 2) / 2, "J"],
        ["Net axial angular momentum", left * a + right * b, "kg·m²/s"]
      ] };
    }
  }
};

export function runModel(id, values) {
  if (!Object.hasOwn(models, id)) throw new RangeError("Choose thermal, hydraulic or rotors.");
  const model = models[id];
  const inputs = Object.fromEntries(model.fields.map(([name, label, fallback]) => {
    const raw = values.get(name);
    const number = raw === null ? fallback : Number(raw);
    const signed = name.endsWith("_rpm");
    if (raw !== null && (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw) || raw.length > 32) ||
        !Number.isFinite(number) || Math.abs(number) > 1e12 || (!signed && number <= 0)) {
      throw new RangeError(label + " needs a valid " + (signed ? "signed" : "positive") + " number within the lab range.");
    }
    return [name, number];
  }));
  const output = model.calculate(inputs);
  if (output.metrics.some(([, value]) => !Number.isFinite(value)) ||
      output.states?.some(state => !Number.isFinite(state.pressure_absolute_pa))) {
    throw new RangeError("The result exceeds the lab's numerical range.");
  }
  return { model: id, inputs, ...output };
}
