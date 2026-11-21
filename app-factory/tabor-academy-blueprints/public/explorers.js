export const glossary = {
  viscosity: ["How much a fluid resists flowing or changing shape as it moves.", "Honey flows more slowly than water when you tip a jar.", "fluid"],
  impedance: ["How much a system opposes a repeating current or vibration.", "A speaker rated 8 ohms puts a different load on an amplifier than one rated 4 ohms.", "speaker"],
  resistance: ["How strongly a part opposes a flow. In a circuit it limits current for a given voltage.", "A flashlight bulb's filament resists current and heats up.", "flashlight"],
  drag: ["A force from moving through air or water that pushes against the motion.", "Hold your hand flat against the wind, then turn it sideways.", "air lift wing"],
  leverage: ["Using distance from a pivot to change the turning force you can apply.", "A long door handle turns more easily than pushing near the hinge.", "pivot hinge lever"],
  capillarity: ["Liquid moving in a narrow space because it sticks to surfaces and to itself.", "A paper towel pulls up water from a spill.", "wick xylem"],
  buoyancy: ["The upward force a fluid exerts on something in it.", "A life jacket displaces water while adding relatively little weight.", "float buoyancy"],
  torque: ["The turning effect of a force about a pivot or axle.", "A longer wrench can loosen a nut with the same push.", "pivot rotation"],
  diffusion: ["Particles spreading from where they are more concentrated to where they are less concentrated.", "The smell of an orange spreads after you peel it.", "gill exchange"],
};

export const flows = [
  { name: "Motor ↔ Generator", left: "Electrical energy", right: "Shaft rotation", forward: "Motor", reverse: "Generator",
    detail: "Some electric machines can work in both directions with suitable wiring and controls." },
  { name: "Pump ↔ Turbine", left: "Shaft rotation", right: "Water flow and pressure", forward: "Pump", reverse: "Turbine",
    detail: "A reversible pump-turbine is designed to switch between those jobs." },
  { name: "Speaker ↔ Microphone", left: "Electrical signal", right: "Sound pressure", forward: "Moving-coil speaker", reverse: "Moving-coil microphone",
    detail: "The same coil-and-magnet principle works both ways. Dedicated devices are built for their own job." },
];

export const scales = [
  ["Ant", 60, "Ants carry loads on legs supported by an external skeleton."],
  ["House cat", 95, "Cats bend their limbs and use muscles to absorb landing forces."],
  ["Elephant", 135, "Elephants have thick bones and relatively upright limbs for support on land."],
  ["Blue whale", 170, "Water supports much of a whale’s weight. Its limbs and spine help it move through water."],
];

export const mysteries = [
  { ids: [2, 7], clue: "What does a broad surface do to the air moving around it?", answer: "Both use surfaces interacting with air. A bird can actively control its wings, while a maple samara descends and may spin passively." },
  { ids: [3, 1], clue: "What keeps a moving part bending around a particular region?", answer: "Both constrain how connected parts move. A door swings on a pin, while an animal joint uses bone surfaces, muscles and other tissues." },
  { ids: [8, 16], clue: "What has to happen for flowing water to keep moving?", answer: "Both move water along a path when there is a driving difference. Gravity drives downslope streamflow. Hydraulic pistons use pressure differences in a confined fluid." },
  { ids: [5, 29], clue: "How does height change the way water can do work?", answer: "Water pressure varies with depth. That pressure difference supports a floating object. A raised reservoir can drive flow through a turbine." },
  { ids: [4, 22], clue: "Why does the shape of a solid part matter when you push on it?", answer: "Geometry changes how a solid part carries force. Pliers use arms and a pivot for leverage. Bone architecture distributes loads through tissue." },
];

const synonyms = [
  ["hinge", "hinged", "pivot", "bend", "bending", "bendable", "joint", "joints", "knuckle"],
  ["lock", "locks", "latch", "ratchet", "one-way", "backward", "interlock"],
  ["float", "floating", "buoyancy", "buoyant", "displace", "lift"],
  ["wick", "wicks", "capillary", "capillarity", "absorb", "absorption"],
  ["motor", "generator", "electricity", "current", "electrical"],
  ["stream", "streams", "waterway", "creek", "river"],
  ["drag", "airflow", "wind", "air", "glide", "flight", "wing"],
];
const ignored = new Set(["a", "an", "the", "of", "what", "that", "their", "to", "do", "does", "how", "why", "can", "so", "things", "they", "it", "and", "for", "in", "with"]);
const words = text => (String(text).toLowerCase().match(/[a-z0-9-]+/g) ?? []).filter(word => !ignored.has(word));

export function rankedLessons(rows, query) {
  const terms = [...new Set(words(query))];
  if (!terms.length) return [];
  return rows.map(row => {
    const heading = new Set(words([row.item_a_label, row.item_b_label, row.item_c_label, row.domain].join(" ")));
    const text = new Set(words(Object.values(row).join(" ")));
    let score = 0;
    for (const term of terms) {
      if (heading.has(term)) score += 6;
      else if (text.has(term)) score += 3;
      else if (synonyms.some(group => group.includes(term) && group.some(word => text.has(word)))) score += 1;
    }
    return { row, score };
  }).filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.row.id - b.row.id)
    .slice(0, 12).map(result => result.row);
}
