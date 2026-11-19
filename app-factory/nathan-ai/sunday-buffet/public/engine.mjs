export const MENU = [
  { id: "chicken", name: "Fried chicken", unit: "1 piece", kcal: 320, section: "Buffet" },
  { id: "beef", name: "Roast beef", unit: "3 oz", kcal: 210, section: "Buffet" },
  { id: "mash", name: "Mashed potatoes", unit: "½ cup", kcal: 140, section: "Buffet" },
  { id: "gravy", name: "Brown gravy", unit: "¼ cup", kcal: 45, section: "Buffet" },
  { id: "mac", name: "Mac and cheese", unit: "½ cup", kcal: 220, section: "Buffet" },
  { id: "roll", name: "Yeast roll", unit: "1 roll", kcal: 115, section: "Buffet" },
  { id: "cornbread", name: "Hot cornbread", unit: "1 square", kcal: 180, section: "Buffet" },
  { id: "ranch", name: "Ranch", unit: "2 tbsp", kcal: 130, section: "Buffet" },
  { id: "pudding", name: "Banana pudding", unit: "½ cup", kcal: 240, section: "Dessert" },
  { id: "cobbler", name: "Peach cobbler", unit: "½ cup", kcal: 250, section: "Dessert" },
  { id: "tea", name: "Sweet tea", unit: "12 fl oz", kcal: 150, section: "Drinks" }
];

export const DINERS = {
  preacher: { name: "The preacher", how: "Chicken first, gravy down the middle. On the second pass he returns for another piece of chicken and heads straight to dessert." },
  wife: { name: "The preacher’s wife", how: "Roast beef leads the first plate. She makes her own second trip for mac, a second serving of beef and dessert." }
};

const house = {
  preacher: [{ chicken: 1, beef: 1, mash: 2, gravy: 1, mac: 1, roll: 2 }, { chicken: 1, pudding: 1, cobbler: 1 }, { tea: 2 }],
  wife: [{ chicken: 1, beef: 1, mash: 1, gravy: 1, mac: 1, roll: 1 }, { beef: 1, mac: 1, pudding: 1, cobbler: 1 }, { tea: 1 }]
};

export function preset(name = "house") {
  if (name === "empty") return { preacher: [{}, {}, {}], wife: [{}, {}, {}] };
  const plates = structuredClone(house);
  if (name === "tall") {
    plates.preacher = [
      { chicken: 2, beef: 2, mash: 2, gravy: 3, mac: 3, roll: 3, ranch: 1, cornbread: 2 },
      { pudding: 2, cobbler: 1 },
      { tea: 2 }
    ];
  }
  return plates;
}

export const MAX_PORTIONS = 20;

export function total(plates) {
  return plates.reduce((calories, plate) => calories + MENU.reduce((sum, item) =>
    sum + (plate[item.id] ?? 0) * item.kcal, 0), 0);
}

export function changePortion(plate, id, delta) {
  const count = Math.max(0, Math.min(MAX_PORTIONS, (plate[id] ?? 0) + delta));
  if (count) plate[id] = count;
  else delete plate[id];
}

export function restorePlates(saved) {
  const plates = preset("empty");
  for (const diner of Object.keys(DINERS)) {
    for (const [index, plate] of plates[diner].entries()) {
      for (const { id } of MENU) {
        const value = saved?.[diner]?.[index]?.[id];
        if (Number.isInteger(value) && value > 0 && (id === "tea") === (index === 2)) {
          plate[id] = Math.min(value, MAX_PORTIONS);
        }
      }
    }
  }
  return plates;
}

export function receipt(subtotalCents, percent) {
  const tip = Math.round(subtotalCents * percent / 100);
  return { subtotal: subtotalCents, tip, total: subtotalCents + tip };
}

export const CHECK = 4820;
export const SCENES = [
  { time: "12:10 PM", title: "The ranch request", body: "The server has two hot plates in her hands. Your table wants another ranch.", choices: [
    { label: "Snap now. She can hear you.", reply: "She heard you. You pulled her attention away from the table getting its food.", care: 0, tasks: 2 },
    { label: "Wait for her to set the plates down.", reply: "She finishes the delivery and brings the ranch on her next pass.", care: 2, tasks: 1 },
    { label: "Check the buffet before asking.", reply: "The ranch is at the salad bar. You handle it yourself.", care: 3, tasks: 0 }
  ] },
  { time: "12:24 PM", title: "The cornbread clock", body: "The kitchen says two minutes for the next tray of hot cornbread. The line is three tables deep.", choices: [
    { label: "Demand a manager.", reply: "The server stops to find a manager. The cornbread still needs two minutes.", care: 0, tasks: 3 },
    { label: "Give the kitchen its two minutes.", reply: "The next tray comes out and everybody gets hot cornbread.", care: 3, tasks: 0 },
    { label: "Ask for one update when she passes.", reply: "She checks once and gives you the timing on her way back.", care: 2, tasks: 1 }
  ] },
  { time: "12:52 PM", title: "The table turnover", body: "Napkins and crackers are on the table and the floor. The host has another party waiting.", choices: [
    { label: "Leave everything and sit another 20 minutes.", reply: "The host keeps the next party waiting. The server has a full reset ahead.", care: 0, tasks: 3 },
    { label: "Gather the dry trash and clear the aisle.", reply: "The server still sanitizes the table. You spared her the loose trash and freed the seats.", care: 3, tasks: 0 },
    { label: "Hand over the check and head out.", reply: "The seats open up. The floor and table still need a full cleanup.", care: 1, tasks: 2 }
  ] },
  { time: "1:00 PM", title: "The folded bill", body: "The check is $48.20 before tax in this example. A tract folded like cash sits beside the receipt.", choices: [
    { label: "Leave the tract as the tip.", reply: "The tract opens to paper. The tip on the ledger is zero.", care: 0, tasks: 0, percent: 0 },
    { label: "Leave a 10% tip.", reply: "The ledger shows a $4.82 tip.", care: 1, tasks: 0, percent: 10 },
    { label: "Leave a 20% tip.", reply: "The ledger shows a $9.64 tip. The receipt accounts for every cent.", care: 3, tasks: 0, percent: 20 }
  ] }
];

export function score(choices) {
  return choices.reduce((result, index, scene) => {
    const choice = SCENES[scene]?.choices[index];
    if (!choice) return result;
    result.care += choice.care;
    result.tasks += choice.tasks;
    if (choice.percent !== undefined) result.tip = receipt(CHECK, choice.percent).tip;
    return result;
  }, { care: 0, tasks: 0, tip: 0 });
}
