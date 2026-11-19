export const dishes = {
  chicken: "Fried chicken", potatoes: "Mashed potatoes", gravy: "Brown gravy",
  roll: "Yeast roll", beef: "Roast beef", mac: "Mac and cheese",
  beans: "Green beans", pudding: "Banana pudding", cobbler: "Peach cobbler"
};

export const portraits = {
  preacher: {
    label: "IFB Preacher",
    plates: [
      { order: ["chicken","chicken","potatoes","potatoes","gravy","roll"], method: "Stack the chicken first. Bank the potatoes against it, pour gravy into the middle and mop up with the roll." },
      { order: ["beef","beef","mac","roll","pudding","cobbler"], method: "Meat first, sides next, then pudding and cobbler in the last open space." }
    ]
  },
  wife: {
    label: "Preacher’s Wife",
    plates: [
      { order: ["beef","beans","potatoes","gravy","roll"], method: "Divide the plate into sections. Gravy goes over the potatoes. Alternate bites from each side." },
      { order: ["chicken","mac","roll","cobbler"], method: "Keep the cobbler at the rim, away from the chicken juices. Save it for the last bite." }
    ]
  }
};

export function score(attempt, order) {
  return order.length === attempt.length && order.every((food, index) => food === attempt[index]);
}

export function tally(role) {
  return portraits[role].plates.reduce((total, plate) => total + plate.order.length, 0);
}

export function receipt(tip, service) {
  const cents = 3600;
  const gratuity = Math.round(cents * tip / 100);
  return { cents, gratuity, total: cents + gratuity, requests: service === "together" ? 1 : 3 };
}

if (typeof document !== "undefined") {
  const get = id => document.getElementById(id);
  const money = cents => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format(cents/100);
  const button = (label, action) => {
    const node = document.createElement("button");
    node.type = "button";
    node.textContent = label;
    node.addEventListener("click", action);
    return node;
  };
  let role = "preacher";
  let plate = 0;
  let stack = [];
  function reset(next) {
    role = next;
    plate = 0;
    stack = [];
    get("status").textContent = "";
    get("ledger").replaceChildren();
    draw();
  }
  const roles = Object.fromEntries(Object.entries(portraits).map(([id, item]) => {
    const itemButton = button(item.label, () => reset(id));
    get("roles").append(itemButton);
    return [id, itemButton];
  }));
  const menu = Object.fromEntries(Object.entries(dishes).map(([id, name]) => {
    const foodButton = button(name, () => {
      stack.push(id);
      get("status").textContent = "";
      draw();
    });
    get("menu").append(foodButton);
    return [id, foodButton];
  }));
  function draw() {
    const target = portraits[role].plates[plate];
    for (const [id, item] of Object.entries(roles)) item.setAttribute("aria-pressed", String(id === role));
    get("dish-title").textContent = target ? "Plate " + (plate + 1) : "Both plates served";
    get("method").textContent = target?.method ?? "The server brings the check.";
    get("target").replaceChildren(...(target?.order ?? []).map(id => {
      const badge = document.createElement("span");
      badge.textContent = dishes[id];
      return badge;
    }));
    get("stack").replaceChildren(...stack.map(id => {
      const item = document.createElement("li");
      item.textContent = dishes[id];
      return item;
    }));
    for (const item of Object.values(menu)) {
      item.disabled = !target;
      item.setAttribute("aria-disabled", String(!target || stack.length >= target.order.length));
    }
    get("undo").disabled = !stack.length;
    get("serve").disabled = !target;
    get("checkout").hidden = Boolean(target);
    get("amount").textContent = portraits[role].label + " served " + tally(role) + " portions across two plates. The fictional table bill covers both adults.";
  }
  get("menu").addEventListener("click", event => {
    if (event.target.matches('button[aria-disabled="true"]')) {
      event.stopPropagation();
    }
  }, true);
  get("undo").addEventListener("click", () => {
    stack.pop();
    get("status").textContent = "Last portion removed.";
    draw();
  });
  get("serve").addEventListener("click", () => {
    const target = portraits[role].plates[plate];
    if (!score(stack, target.order)) {
      get("status").textContent = "Match every portion in the order shown above.";
      return;
    }
    plate += 1;
    stack = [];
    get("status").textContent = plate === 2 ? "Both plates served. Settle the check below." : "Plate one served. Build plate two.";
    draw();
    if (plate === 2) get("service").focus();
  });
  get("close-check").addEventListener("click", () => {
    const result = receipt(Number(get("tip").value), get("service").value);
    const lines = [
      "IFB Preacher · 6 + 6 = 12 portions",
      "Preacher’s Wife · 5 + 4 = 9 portions",
      "12 + 9 = 21 portions at the table",
      "Buffet subtotal · " + money(result.cents),
      "Real tip · " + money(result.gratuity),
      "Total before tax · " + money(result.total),
      "Server trips for these requests · " + result.requests,
      result.gratuity === 0 ? "That piece of paper added $0.00." : "The receipt records " + money(result.gratuity) + " for the server."
    ];
    get("ledger").replaceChildren(...lines.map(line => {
      const row = document.createElement("p");
      row.textContent = line;
      return row;
    }));
  });
  draw();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register(new URL("sw.js", import.meta.url)).catch(console.error);
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    const install = get("install-button");
    install.hidden = false;
    install.addEventListener("click", async () => {
      await event.prompt();
      install.hidden = true;
    }, {once:true});
  });
}
