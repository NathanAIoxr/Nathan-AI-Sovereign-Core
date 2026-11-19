export const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const headwear = [
  "Alchemist’s Hood","Beacon Cap","Coral Crown","Diver’s Helmet","Echo Circlet","Frost Bonnet","Gale Brim","Harbor Hood","Ivory Visor","Jade Cap","Kite Crown","Lantern Hood","Mirror Circlet","North Star Cap","Orbit Brim","Pearl Helmet","Quartz Crown","Riddle Bonnet","Spiral Hood","Tide Crown","Umber Cap","Vesper Visor","Wave Brim","X-Ray Hood","Yule Cap","Zenith Crown"
];
export const materials = ["Brass","Silk","Amber","Oak","Coral","Moonstone","Aurora","Obsidian"];
export const realms = [
  {name:"Above", copy:"Cross the floating sky-forges and clear the forced labels from the wind bridges.", turns:["π","φ"], reverse:false},
  {name:"Here", copy:"Begin at the surface market, where the first box tries to tell you what you have to be.", turns:["π","φ"], reverse:false},
  {name:"There", copy:"The first crossroads guards a mirrored sign. Choose to read it from the other end.", turns:["φ","π"], reverse:true},
  {name:"Over There", copy:"Turn the Crown Forge from a circle into a spiral and break the market’s labels.", turns:["π","φ"], reverse:false},
  {name:"Below", copy:"Dive to a fictional Doggerland vault. The North Sea landscape is real. The crowns and vault are part of the game.", turns:["φ","π"], reverse:true},
  {name:"Nowhere", copy:"The Mirror Fortress gives back the labels you came in with. Reverse the letter order at the gate.", turns:["π","φ"], reverse:true}
];

export function pairAt(realm, letter, material, winter = false) {
  if (winter) return {id:"winter", hat:"Santa’s crimson winter cap", hatette:"Solstice Crown / Yule-Ette"};
  return {
    id:[realm,letter,material].join("."),
    hat:materials[material]+" "+headwear[letter],
    hatette:materials[material]+" "+headwear[letter]+" Hatette"
  };
}
export const catalogSize = realms.length * alphabet.length * materials.length * 2 + 2;

export function canOpen(realm, turns, reverse, claims) {
  return reverse === realms[realm].reverse &&
    turns.length === 2 && turns.every((turn,index) => turn === realms[realm].turns[index]) &&
    claims.some(id => id.startsWith(realm + "."));
}

export function spinWord(word) {
  const base = word.trim().toLowerCase();
  const known = {dude:"dudette",boy:"boyette",girl:"girlette",hat:"hatette",pal:"palette",king:"kingette"};
  if (!base) return "";
  return Object.hasOwn(known,base) ? known[base] : base.replace(/e$/u,"") + "ette";
}

export function restoreProgress(raw) {
  let saved;
  try { saved = JSON.parse(raw); } catch { saved = null; }
  const claims = new Set(Array.isArray(saved?.claims) ? saved.claims.filter(id => typeof id === "string") : []);
  const gates = new Set(Array.isArray(saved?.gates) ? saved.gates.filter(id => Number.isInteger(id) && realms[id]) : []);
  const current = Number.isInteger(saved?.current) && realms[saved.current] ? saved.current : 1;
  return { claims, gates, current };
}

if (typeof document !== "undefined") {
  const get = id => document.getElementById(id);
  const storageKey = "sorting-hats-hatettes-progress-v1";
  let raw;
  try { raw = localStorage.getItem(storageKey); } catch { raw = null; }
  const { claims, gates, current: savedRealm } = restoreProgress(raw);
  let current = savedRealm;
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify({claims:[...claims],gates:[...gates],current})); } catch {}
  };
  let turns = [];
  const option = (text,value) => new Option(text,String(value));
  function renderLetters(letter = "0") {
    const codes = [...alphabet].map((char,index) => [char,index]);
    if (get("direction").selectedIndex === 1) codes.reverse();
    get("letter").replaceChildren(...codes.map(([char,index]) => option(char,index)));
    get("letter").value = letter;
  }
  const realmButtons = realms.map((realm,index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = realm.name;
    button.addEventListener("click", () => {
      current = index;
      turns = [];
      get("status").textContent = "";
      save();
      draw();
    });
    get("realms").append(button);
    return button;
  });
  get("material").replaceChildren(...materials.map(option));
  renderLetters();
  const selected = () => pairAt(current,Number(get("letter").value),Number(get("material").value),get("winter").checked);
  function draw() {
    const realm = realms[current];
    const {id,hat,hatette} = selected();
    get("realm-name").textContent = realm.name;
    get("realm-copy").textContent = realm.copy;
    get("history").hidden = current !== 4;
    get("pair").textContent = hat + " ↔ " + hatette;
    get("claim").disabled = claims.has(id);
    get("claim").textContent = claims.has(id) ? "Pair claimed" : "Claim this pair";
    for (const [index,button] of realmButtons.entries()) {
      button.setAttribute("aria-pressed",String(index === current));
      button.textContent = realms[index].name + (gates.has(index) ? " ✓" : "");
    }
    get("clue").textContent = "Claim a pair from " + realm.name + ", set " + (realm.reverse ? "Z to A" : "A to Z") + ", and tune " + realm.turns.join(" → ") + ".";
    get("dial").textContent = "Dial ▸ " + (turns.join(" → ") || "Ready");
    get("progress").textContent = claims.size + " pairs claimed · " + gates.size + " of " + realms.length + " gates opened";
  }
  get("direction").addEventListener("change", () => {renderLetters(get("letter").value); draw();});
  for (const id of ["letter","material","winter"]) get(id).addEventListener("change",draw);
  get("claim").addEventListener("click",() => {claims.add(selected().id);save();draw();});
  for (const [id,symbol] of [["pi","π"],["phi","φ"]]) {
    get(id).addEventListener("click",() => {turns = [...turns,symbol].slice(-2);draw();});
  }
  get("gate").addEventListener("click",() => {
    if (!canOpen(current,turns,get("direction").selectedIndex === 1,[...claims])) {
      get("status").textContent = "The gate is locked. Check your realm’s pair, letter direction and last two turns.";
      return;
    }
    gates.add(current);
    save();draw();
    get("status").textContent = gates.size === realms.length ? "All six gates cleared. DONE." : "Gate open. The forced labels are cleared in " + realms[current].name + ".";
  });
  const flip = () => {
    const word = get("word").value.trim();
    const spun = spinWord(word);
    get("flipped").textContent = spun ? word + " ↔ " + spun : "Enter a word to spin.";
  };
  get("spin").addEventListener("click",flip);
  get("word").addEventListener("keydown",event => {if(event.key === "Enter") flip();});
  draw();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register(new URL("sw.js", import.meta.url)).catch(console.error);
  window.addEventListener("beforeinstallprompt",event => {
    event.preventDefault();
    const install = get("install-button");
    install.hidden = false;
    install.addEventListener("click",async () => {
      await event.prompt();
      install.hidden = true;
    },{once:true});
  });
}
