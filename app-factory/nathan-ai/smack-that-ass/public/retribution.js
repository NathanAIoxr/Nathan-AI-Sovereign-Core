"use strict";

const groups = [
  {
    name: "Church leadership",
    roles: [
      { name: "Pope", color: "#ebe1cf" },
      { name: "Cardinal", color: "#9c3935" },
      { name: "Archbishop", color: "#684873" },
      { name: "Bishop", color: "#506577" },
    ],
  },
  {
    name: "Clergy and titles",
    roles: [
      { name: "Monsignor", color: "#6a4c59" },
      { name: "Priest", color: "#484f4a" },
      { name: "Deacon", color: "#5b5044" },
    ],
  },
  {
    name: "Religious orders",
    roles: [
      { name: "Mother Superior", color: "#3d4953" },
      { name: "Nun", color: "#3f414b" },
    ],
  },
];

const byId = (id) => document.getElementById(id);
const roleList = byId("role-list");
const roleSelect = byId("role-select");
const strike = byId("strike");
const status = byId("status");
const targetLabel = byId("target-label");
const handChoice = byId("choose-hand");
const faceChoice = byId("choose-face");
const roles = new Map();
let selectedRole = "Nun";
let targetArea = "hand";
let impactTimer;

for (const group of groups) {
  const section = document.createElement("section");
  section.className = "role-group";
  const heading = document.createElement("h3");
  heading.textContent = group.name;
  const buttons = document.createElement("div");
  buttons.className = "roles";
  const options = document.createElement("optgroup");
  options.label = group.name;
  for (const role of group.roles) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "role";
    button.textContent = role.name;
    button.addEventListener("click", () => {
      selectedRole = role.name;
      updateTarget();
    });
    buttons.append(button);
    options.append(new Option(role.name, role.name));
    roles.set(role.name, { ...role, button });
  }
  section.append(heading, buttons);
  roleList.append(section);
  roleSelect.append(options);
}

function updateTarget() {
  clearTimeout(impactTimer);
  delete strike.dataset.impact;
  status.textContent = "";
  roleSelect.value = selectedRole;
  byId("selected-role").textContent = selectedRole;
  for (const role of roles.values()) {
    role.button.setAttribute("aria-pressed", String(role.name === selectedRole));
  }
  handChoice.setAttribute("aria-pressed", String(targetArea === "hand"));
  faceChoice.setAttribute("aria-pressed", String(targetArea === "face"));
  const areaLabel = targetArea === "face" ? "masked face" : "hand";
  targetLabel.textContent = "Slap " + areaLabel;
  strike.setAttribute("aria-label", "Slap the " + selectedRole.toLowerCase() + "’s " + areaLabel);
  drawTarget(roles.get(selectedRole).color);
}

function registerSlap() {
  clearTimeout(impactTimer);
  strike.dataset.impact = strike.dataset.impact === "a" ? "b" : "a";
  status.textContent = targetArea === "hand" ? "Hand slapped." : "Mask slapped.";
  impactTimer = setTimeout(() => {
    delete strike.dataset.impact;
    status.textContent = "";
  }, 850);
}

roleSelect.addEventListener("change", () => {
  selectedRole = roleSelect.value;
  updateTarget();
});
handChoice.addEventListener("click", () => {
  targetArea = "hand";
  updateTarget();
});
faceChoice.addEventListener("click", () => {
  targetArea = "face";
  updateTarget();
});
strike.addEventListener("click", registerSlap);
window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const control = event.target.closest?.("button, a, input, select, textarea, [contenteditable]");
  if (control && control !== strike) return;
  event.preventDefault();
  if (!event.repeat) registerSlap();
});

function drawTarget(cloth) {
  const ctx = byId("figure").getContext("2d");
  if (!ctx) return;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, 400, 320);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  function paint(path, fill, stroke = "#241c18", width = 4) {
    const shape = new Path2D(path);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill(shape);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke(shape);
    }
  }

  if (targetArea === "face") {
    const mask = "M119 98 Q121 48 161 31 Q200 14 240 31 Q279 48 281 98 L269 180 Q256 227 233 245 Q200 267 167 245 Q144 227 131 180 Z";
    paint("M65 293 Q92 258 145 238 L168 218 H232 L255 238 Q310 261 335 293 Z", cloth);
    paint(mask, "#8f7160", null);
    ctx.save();
    ctx.translate(-4, -8);
    paint(mask, "#deccb6", "#2a201a", 5);
    paint("M123 83 Q153 30 200 30 L200 247 Q172 248 152 217 Q132 183 127 147 Z", "#f0e3ce", null);
    paint("M200 33 V244 M133 114 Q156 98 180 106 M220 106 Q245 98 268 114 M170 190 Q200 201 230 190", null, "#a78d76", 2);
    paint("M134 69 Q157 43 183 42 M218 222 Q239 211 249 180", null, "#fbedd7", 3);
    ctx.restore();
    paint("M166 247 L200 276 L233 247", null, "#e5cfad", 3);
    return;
  }

  const hand = "M143 236 Q131 212 124 189 L97 144 Q87 128 99 119 Q109 111 123 121 L143 140 L137 58 Q136 44 149 42 Q163 40 168 55 L181 122 L184 34 Q185 18 200 20 Q215 21 216 37 L220 117 L230 50 Q233 35 247 38 Q261 41 260 56 L252 129 L266 86 Q272 72 285 77 Q297 83 292 97 L271 162 Q273 192 258 218 Q250 231 246 247 L169 255 Z";
  ctx.save();
  ctx.translate(7, 7);
  paint(hand, "#2a211b", null);
  ctx.restore();
  paint(hand, "#dcb398", "#2a211b", 5);
  paint("M147 218 Q141 188 126 165 L106 137 Q99 124 109 123 M156 62 L173 133 M200 39 L201 119 M247 57 L234 124 M277 93 L263 136", null, "#f2d5bb", 4);
  paint("M144 141 Q163 142 173 155 M174 168 Q192 143 232 146 M161 210 Q176 197 194 199 M226 217 Q247 194 252 168", null, "#9b6952", 3);
  paint("M152 236 Q193 255 248 236 L267 301 H141 Z", cloth);
  paint("M149 260 Q196 276 256 257", null, "#e8d4b9", 3);
}

updateTarget();
