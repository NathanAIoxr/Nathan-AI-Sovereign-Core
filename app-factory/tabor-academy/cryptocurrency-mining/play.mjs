const genesis = "01000000" + "00".repeat(32) +
  "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c";

export function energyFor(hours) {
  const energy = 0.8 * hours;
  const cents = hours * 9.6;
  return { energy, cost: cents / 100, fits: hours >= 6 && cents <= 60 };
}

export function mirrorFor(direction, view) {
  const values = direction === "Backward" ? [4, 17, 7] : [7, 17, 4];
  const keep = value => direction === "Inverted" ? value > 10 : value <= 10;
  if (view === "This side") return values.join(" → ");
  if (view === "As the mirror") return values.map(value =>
    value + " " + (direction === "Inverted" ? ">" : "≤") + " 10 · " + (keep(value) ? "yes" : "no")
  ).join(" | ");
  return "Receipt · " + values.filter(keep).join(", ");
}

export async function genesisProof(change) {
  const header = change ? genesis.slice(0, -2) + "00" : genesis;
  const bytes = Uint8Array.from(header.match(/../g), part => Number.parseInt(part, 16));
  const bits = new DataView(bytes.buffer).getUint32(72, true);
  const target = BigInt(bits & 0x007fffff) << BigInt(8 * ((bits >>> 24) - 3));
  const first = await crypto.subtle.digest("SHA-256", bytes);
  const second = await crypto.subtle.digest("SHA-256", first);
  const hash = Array.from(new Uint8Array(second).reverse(), byte => byte.toString(16).padStart(2, "0")).join("");
  return { hash, passes: BigInt("0x" + hash) <= target };
}

export function voiceCommand(text) {
  if (/\b(hold on|pause|slow down|wait|learn about this)\b/i.test(text)) return "pause";
  if (/\b(continue|resume|keep going)\b/i.test(text)) return "resume";
  return null;
}

function setup(root) {
  const spec = JSON.parse(root.dataset.challenge);
  const stage = root.querySelector("[data-stage]");
  const feedback = root.querySelector("[data-feedback]");
  const finished = root.querySelector("[data-finished]");
  const pause = root.querySelector("[data-pause]");
  const hint = root.querySelector("[data-hint]");
  const hold = root.querySelector("[data-hold]");
  const resume = root.querySelector("[data-resume]");
  const focusStage = () => stage.querySelector("[data-task], button, input")?.focus();
  const tell = words => { feedback.textContent = words; };
  const finish = words => { tell(words); finished.hidden = false; };
  const element = (tag, words) => {
    const node = document.createElement(tag);
    node.textContent = words;
    return node;
  };
  const button = (title, action) => {
    const node = element("button", title);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  };
  const task = title => {
    const node = element("h3", title);
    node.tabIndex = -1;
    node.dataset.task = "";
    return node;
  };
  const number = (title, initial, min, max) => {
    const label = element("label", title);
    const input = document.createElement("input");
    Object.assign(input, { type: "number", min, max, step: 1, value: initial });
    label.append(input);
    return [label, input];
  };
  const setPause = open => {
    hint.hidden = !open;
    stage.hidden = open;
    pause.hidden = open;
    if (open) resume.focus();
    else focusStage();
  };
  hold.addEventListener("click", () => setPause(true));
  resume.addEventListener("click", () => setPause(false));

  if (spec.kind === "sort") {
    let index = 0;
    const card = task(spec.cards[index][0]);
    const choices = spec.bins.map((name, bin) => button(name, () => {
      const [, correct, reason] = spec.cards[index];
      if (bin !== correct) return tell("That placement doesn’t fit. Try another or choose Hold on.");
      index += 1;
      if (index === spec.cards.length) {
        card.textContent = "All " + index + " cards placed";
        choices.forEach(choice => { choice.disabled = true; });
        card.focus();
        return finish(reason + " Challenge complete.");
      }
      tell(reason);
      card.textContent = spec.cards[index][0];
      card.focus();
    }));
    stage.append(card, ...choices);
  }

  if (spec.kind === "target") {
    const [label, input] = number("Target", 20, 1, 100);
    let initial = false;
    const candidates = [70, 20, 5, 21, 2];
    stage.append(label, ...candidates.map(hash => button("Test hash " + hash, () => {
      if (!input.validity.valid || input.value === "") return tell("Enter a whole-number target from 1 to 100.");
      const target = input.valueAsNumber;
      const passes = hash <= target;
      const message = hash + (passes ? " passes" : " misses") + " against target " + target + ".";
      if (initial && passes && target <= 5) return finish(message + " You found a pass with a tighter target.");
      if (passes && target === 20) initial = true;
      tell(message + (initial ? " Try a target of 5 or less." : " Find a pass with the starting target of 20."));
    })));
  }

  if (spec.kind === "power") {
    const [label, input] = number("Run hours", 8, 1, 24);
    stage.append(label, button("Run the meter", () => {
      if (!input.validity.valid || input.value === "") return tell("Enter whole hours from 1 to 24.");
      const hours = input.valueAsNumber;
      const reading = energyFor(hours);
      const message = reading.energy.toFixed(2) + " kWh · $" + reading.cost.toFixed(3) + " before cent rounding.";
      if (reading.fits) return finish(message + " You met both limits.");
      tell(message + (hours < 6 ? " Add run time." : " Reduce the run time."));
    }));
  }

  if (spec.kind === "mirror") {
    const order = ["Forward", "Backward", "Inverted"];
    const views = ["This side", "As the mirror", "Other side"];
    const visited = new Set();
    const result = element("p", "Choose a direction, then a view.");
    let direction = order[0];
    const orders = order.map(name => {
      const control = button(name, () => {
        direction = name;
        orders.forEach(item => item.setAttribute("aria-pressed", String(item === control)));
        result.textContent = name + " selected. Choose a view.";
      });
      control.setAttribute("aria-pressed", String(name === direction));
      return control;
    });
    stage.append(...orders, element("h3", "Mirror view"), ...views.map(view => button(view, () => {
      visited.add(direction + view);
      result.textContent = direction + " · " + view + " · " + mirrorFor(direction, view);
      tell(visited.size + " of 9 views visited.");
      if (visited.size === 9) finish("All nine views checked. Forward and backward keep the same values. Inverted shows the rejects.");
    })), result);
  }

  if (spec.kind === "allocation") {
    const targets = [["Core Reserve Vault", 50], ["Jet-Siphon Expansion", 25],
      ["Node & Arm Operators", 15], ["Ecosystem & Liquidity", 10]];
    const fields = targets.map(([name]) => number(name, 25, 0, 100));
    stage.append(...fields.map(([label]) => label), button("Check allocation", () => {
      const values = fields.map(([, input]) => input.valueAsNumber);
      if (values.some(value => !Number.isInteger(value) || value < 0 || value > 100)) {
        return tell("Enter whole units from 0 to 100 in every field.");
      }
      const total = values.reduce((sum, units) => sum + units, 0);
      if (total !== 100) return tell(total + " units allocated. Set the total to 100.");
      if (targets.every(([, units], index) => values[index] === units)) {
        return finish("All four amounts match the Golden Goose design. The model used 100 classroom units.");
      }
      tell("The total is 100. Check the amount for each destination in Hold on.");
    }));
  }

  if (spec.kind === "proof") {
    const result = element("p", "");
    let original = false;
    const verify = async change => {
      try {
        const proof = await genesisProof(change);
        result.textContent = (change ? "Changed header · " : "Original header · ") + proof.hash;
        if (change && original && !proof.passes) return finish("That one-byte change produced a different hash above the target.");
        if (!change && proof.passes) original = true;
        tell(proof.passes ? "The hash meets the target. Try the changed header." :
          "The hash misses. Verify the original header first.");
      } catch {
        tell("The browser could not run SHA-256. Try the live verifier in the field notes.");
      }
    };
    stage.append(button("Hash the original", () => verify(false)), button("Change one byte and hash", () => verify(true)), result);
  }

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Recognition) {
    const mic = root.querySelector("[data-mic]");
    const voice = root.querySelector("[data-voice]");
    const voiceStatus = root.querySelector("[data-voice-status]");
    voice.hidden = false;
    mic.addEventListener("click", () => {
      const recognition = new Recognition();
      recognition.lang = "en-US";
      mic.disabled = true;
      voiceStatus.textContent = "Listening for one command.";
      recognition.onresult = event => {
        const command = voiceCommand(event.results[0][0].transcript);
        if (command) {
          setPause(command === "pause");
          voiceStatus.textContent = command === "pause" ? "Paused." : "Continued.";
        } else voiceStatus.textContent = "Try “Hold on” or “Continue.”";
      };
      recognition.onerror = () => { voiceStatus.textContent = "Speech unavailable. Use the buttons to pause or continue."; };
      recognition.onend = () => {
        mic.disabled = false;
        if (voiceStatus.textContent === "Listening for one command.") voiceStatus.textContent = "Listening ended.";
      };
      try { recognition.start(); }
      catch {
        mic.disabled = false;
        voiceStatus.textContent = "Speech unavailable. Use the buttons to pause or continue.";
      }
    });
  }
  root.dataset.ready = "true";
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-challenge]");
  if (root) setup(root);
}
