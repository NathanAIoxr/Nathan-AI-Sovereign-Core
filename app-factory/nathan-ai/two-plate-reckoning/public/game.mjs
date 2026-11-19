export const dishes = {
  chicken: "Fried chicken", potatoes: "Mashed potatoes", gravy: "Brown gravy",
  roll: "Yeast roll", beef: "Roast beef", mac: "Mac and cheese",
  beans: "Green beans", pudding: "Banana pudding", cobbler: "Peach cobbler",
  okra: "Fried okra", cornbread: "Hot cornbread", corn: "Creamed corn"
};

export const church = "Lonesome Gravy Fork Independent Baptist";
export const portraits = {
  preacher: {
    label: "Rev. Buford Gravywell",
    role: "IFB preacher",
    plates: [
      { order: ["chicken","chicken","chicken","potatoes","potatoes","gravy","gravy","okra","roll","roll"], method: "Stack three pieces of chicken first. Bank the potatoes against them, pour two ladles of gravy down the middle, wedge in the okra and mop up with both rolls." },
      { order: ["beef","beef","beef","mac","mac","cornbread","roll","pudding","cobbler"], method: "Eat the roast beef hot, alternate it with the mac, sweep up with the cornbread and roll, then go back and forth between pudding and cobbler." }
    ]
  },
  wife: {
    label: "Lottie Mae Gravywell",
    role: "Preacher’s wife",
    plates: [
      { order: ["beef","beef","beans","beans","potatoes","gravy","okra","cornbread","roll"], method: "Divide the beef and beans into sections. Put one ladle of gravy over the potatoes. Alternate forkfuls and snap the cornbread in half for the last of the gravy." },
      { order: ["chicken","chicken","mac","corn","roll","pudding","cobbler","cobbler"], method: "Put the two pieces of chicken together. Use the roll to divide the creamed corn from the pudding. Put two scoops of cobbler at the rim and save them for last." }
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
    get("receipt-meme").hidden = true;
    draw();
  }
  const roles = Object.fromEntries(Object.entries(portraits).map(([id, item]) => {
    const itemButton = button(item.label + " · " + item.role, () => reset(id));
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
    get("portion-progress").textContent = target ? stack.length + " / " + target.order.length + " portions added" : tally(role) + " portions served across two plates";
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
    const counts = Object.keys(portraits).map(tally);
    const plateLines = Object.entries(portraits).map(([id, person]) =>
      person.label + " · " + person.plates.map(plate => plate.order.length).join(" + ") + " = " + tally(id) + " portions"
    );
    const lines = [
      ...plateLines,
      counts.join(" + ") + " = " + counts.reduce((total,count) => total + count,0) + " portions at the table",
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
    document.dispatchEvent(new CustomEvent("buffet:receipt", {detail:{gratuity:result.gratuity}}));
    get("receipt-meme").hidden = false;
  });
  get("receipt-meme").addEventListener("click", () => {
    document.dispatchEvent(new Event("buffet:receipt-meme"));
    document.getElementById("meme-template").focus();
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
