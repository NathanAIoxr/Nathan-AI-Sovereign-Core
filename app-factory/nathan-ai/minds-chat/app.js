(function () {
  "use strict";

  const root = document.querySelector("[data-minds-chat]");
  if (!root) return;
  const dialog = root.closest("dialog");
  const open = document.querySelector("#open-minds");
  const assets = new URL(root.dataset.assets, location.href);
  const pages = new URL("https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/");
  const { createDirectory, pageSize, answer, evidenceLabels } = window.NathanMindsChat;
  const requestedMind = new URLSearchParams(location.search).get("mind");

  root.innerHTML = `
    <header class="minds-header">
      <h1 id="minds-heading">Minds</h1>
      <p data-summary role="status">Loading the Mind registry…</p>
      <p data-author hidden></p>
      <details data-lasso hidden>
        <summary>Lasso of Truth</summary>
        <p>Each answer uses reviewed records for the selected Mind. Open a citation to inspect the wording and context.</p>
        <blockquote data-method></blockquote>
        <ul data-collections></ul>
        <a data-lasso-prompts>Conductor prompts</a>
      </details>
    </header>
    <button type="button" data-retry hidden>Retry loading Minds</button>
    <div class="minds-columns" data-controls hidden>
      <section aria-label="Mind directory">
        <label>Browse
          <select data-view>
            <option value="named">Named Minds</option>
            <option value="addresses">Omni addresses</option>
          </select>
        </label>
        <div class="minds-fields" data-named>
          <label>Search Minds<input data-query type="search" placeholder="Jesus, Buddha, Opal…" maxlength="150"></label>
          <label>Mind family
            <select data-family>
              <option value="">All Mind families</option>
              <option value="humans">Historical people</option>
              <option value="deities">Gods and goddesses</option>
              <option value="goddesses">Goddesses</option>
              <option value="demons">Demons and spirits</option>
              <option value="angels">Angels</option>
              <option value="pantheon-identity">Omni God Core</option>
              <option value="mind-mode">Mind of Modes</option>
              <option value="literary-form">Creator forms</option>
              <option value="folklore-lens">Mythology and folklore</option>
              <option value="mirror-specification">Agents of Innocence</option>
              <option value="council-role">My Council</option>
              <option value="creator-role">Early Minds</option>
              <option value="author-profile">Nathan Tabor source records</option>
            </select>
          </label>
        </div>
        <div class="minds-fields" data-addresses hidden>
          <form data-jump>
            <label>Omni address<input name="address" inputmode="numeric" pattern="[0-9]{1,12}" maxlength="12" required></label>
            <button type="submit">Go to address</button>
          </form>
          <label>Size order
            <select data-order>
              <option value="desc">Largest to smallest</option>
              <option value="asc">Smallest to largest</option>
            </select>
          </label>
        </div>
        <p data-results role="status"></p>
        <ul class="minds-list" data-list></ul>
        <div class="minds-buttons"><button type="button" data-back>Previous</button><button type="button" data-next>Next</button></div>
      </section>
      <section aria-labelledby="minds-active">
        <h2 id="minds-active">Choose a Mind</h2>
        <p data-purpose></p>
        <p data-source></p>
        <div class="minds-buttons" data-evidence>
          <button type="button" data-view-kind="words" disabled>Words</button>
          <button type="button" data-view-kind="actions" disabled>Actions</button>
          <button type="button" data-view-kind="attributions" disabled>Attributions</button>
          <button type="button" data-view-kind="sources" disabled>Sources</button>
        </div>
        <div class="minds-log" role="log" aria-label="Mind conversation" data-log></div>
        <form data-ask>
          <label>Your question<textarea name="question" rows="3" maxlength="1500" required></textarea></label>
          <div class="minds-buttons"><button type="submit" data-send disabled>Ask Mind</button><button type="button" data-clear>Clear conversation</button></div>
        </form>
        <p class="minds-note">The Lasso of Truth runs in this tab. Unsupported questions return unknown.</p>
      </section>
    </div>
    <footer class="minds-links" data-links aria-label="Original Mind sources"></footer>`;

  const get = name => root.querySelector("[data-" + name + "]");
  const addressInput = get("jump").elements.address;
  const questionInput = get("ask").elements.question;
  const heading = root.querySelector("#minds-active");
  const selectState = { namedPage: 0, start: "", selected: null };
  let directory;
  let loading = false;

  function addLink(container, label, url) {
    const link = document.createElement("a");
    link.textContent = label;
    link.href = new URL(url, pages);
    container.append(link);
  }
  addLink(get("links"), "Mind of Minds atlas", "personal-intelligence/minds/mind-of-minds/");
  addLink(get("links"), "Omni God Core", "omni-god/");
  addLink(get("links"), "Agents of Innocence", "agents-of-innocence/");
  addLink(get("links"), "Complete Mind of John Nathan Tabor", "complete-mind/");
  addLink(get("links"), "MAKE AI YOURS", "personal-intelligence/");
  addLink(get("links"), "Academy Minds", "../tabor-academy/minds/");

  function select(record) {
    selectState.selected = record;
    heading.textContent = record.name;
    get("purpose").textContent = record.purpose;
    get("source").textContent = record.sourceId ? "Source: " + record.sourceId : "";
    if (record.id === "omni.opal-ai") addLink(get("source"), "Open Opal AI’s source record", "ai-mapping/");
    get("send").disabled = false;
    for (const button of get("evidence").querySelectorAll("button")) button.disabled = false;
    get("log").replaceChildren();
    for (const button of get("list").querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.mind === record.id));
    }
  }

  function virtualRecord(address) {
    return address.record ?? {
      id: "address." + address.index, name: "Omni address " + address.address, address: address.address,
      purpose: "The original namespace includes this address. Its individual name awaits a source record.",
      sourceId: "Omni God Core address space"
    };
  }

  function render() {
    if (!directory) return;
    const byAddress = get("view").value === "addresses";
    const ascending = get("order").value === "asc";
    get("named").hidden = byAddress;
    get("addresses").hidden = !byAddress;
    const list = get("list");
    let records;
    let description;
    if (byAddress) {
      const positions = directory.addressPage(selectState.start, ascending);
      records = positions.map(virtualRecord);
      const last = positions.at(-1).index;
      const edge = ascending ? directory.max : "0";
      description = "Addresses " + positions[0].index + " to " + last;
      get("back").disabled = positions[0].index === (ascending ? "0" : directory.max);
      get("next").disabled = last === edge;
    } else {
      const found = directory.list(get("query").value, get("family").value);
      const start = selectState.namedPage * pageSize;
      records = found.slice(start, start + pageSize);
      description = found.length ? (start + 1) + "–" + (start + records.length) + " of " + found.length + " named records" : "No Minds match";
      get("back").disabled = !start;
      get("next").disabled = start + records.length >= found.length;
    }
    get("results").textContent = description;
    list.replaceChildren();
    for (const record of records) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.mind = record.id;
      button.setAttribute("aria-pressed", String(selectState.selected?.id === record.id));
      button.textContent = record.id === directory.author.smallestMind && byAddress ?
        record.name + " · 0 · smallest in Nathan Tabor’s order" : record.name;
      button.addEventListener("click", () => select(record));
      item.append(button);
      if (record.group) {
        const group = document.createElement("small");
        group.textContent = record.group;
        item.append(group);
      }
      list.append(item);
    }
  }

  function paginate(forward) {
    if (get("view").value === "addresses") {
      const ascending = get("order").value === "asc";
      const delta = BigInt(pageSize) * (forward === ascending ? 1n : -1n);
      const next = BigInt(selectState.start) + delta;
      const max = BigInt(directory.max);
      selectState.start = (next < 0n ? 0n : next > max ? max : next).toString();
    } else {
      selectState.namedPage += forward ? 1 : -1;
    }
    render();
  }

  get("view").addEventListener("change", render);
  get("order").addEventListener("change", () => {
    selectState.start = get("order").value === "asc" ? "0" : directory.max;
    render();
  });
  for (const field of ["query", "family"]) {
    get(field).addEventListener("input", () => {
      selectState.namedPage = 0;
      render();
    });
  }
  get("back").addEventListener("click", () => paginate(false));
  get("next").addEventListener("click", () => paginate(true));
  get("jump").addEventListener("submit", event => {
    event.preventDefault();
    const address = directory.address(addressInput.value);
    if (!address) {
      addressInput.setCustomValidity("Enter an address from 0 to " + directory.max + ".");
      addressInput.reportValidity();
      return;
    }
    selectState.start = address.index;
    render();
    select(virtualRecord(address));
  });
  addressInput.addEventListener("input", () => addressInput.setCustomValidity(""));
  function showAnswer(question, view) {
    if (!selectState.selected) return;
    const log = get("log");
    const turn = document.createElement("article");
    const prompt = document.createElement("p");
    prompt.textContent = question;
    turn.append(prompt);
    const response = answer(directory, selectState.selected, view ? "" : question, view);
    if (response.summary) {
      const status = document.createElement("p");
      status.textContent = response.summary;
      turn.append(status);
    }
    for (const record of response.records) {
      const kind = document.createElement("strong");
      const content = document.createElement("p");
      const citation = document.createElement("p");
      kind.textContent = evidenceLabels[record.status];
      content.textContent = record.text;
      if (record.url) addLink(citation, record.source, record.url);
      else citation.textContent = record.source;
      turn.append(kind, content, citation);
    }
    log.append(turn);
    if (log.childElementCount > 24) log.firstElementChild.remove();
    turn.scrollIntoView({ block: "nearest" });
  }

  for (const button of get("evidence").querySelectorAll("button")) {
    button.addEventListener("click", () => showAnswer(button.textContent, button.dataset.viewKind));
  }
  get("ask").addEventListener("submit", event => {
    event.preventDefault();
    const question = questionInput.value.trim();
    if (!question) return;
    showAnswer(question);
    questionInput.value = "";
  });
  get("clear").addEventListener("click", () => get("log").replaceChildren());

  function getJSON(path) {
    return fetch(new URL(path, assets)).then(response => {
      if (!response.ok) throw new Error("Mind registry HTTP " + response.status);
      return response.json();
    });
  }
  async function load() {
    if (directory || loading) return;
    loading = true;
    get("retry").hidden = true;
    get("summary").textContent = "Loading the Mind registry…";
    try {
      const [catalog, source, mirror, lasso] = await Promise.all([
        getJSON(root.dataset.catalog ?? "../personal-intelligence/minds/mind-of-minds/catalog.json"),
        getJSON("sources.json"),
        getJSON(root.dataset.mirrors ?? "../agents-of-innocence/release-manifest.json"),
        getJSON("lasso-evidence.json")
      ]);
      directory = createDirectory(window.NathanOmniCore, catalog, source, mirror, lasso);
      selectState.start = directory.max;
      get("summary").textContent = directory.size.toLocaleString("en-US") +
        " named records · 126,000,000,000 addressable Omni positions";
      get("author").textContent = directory.author.name + " · Author’s ordering: “" + directory.author.sizeOrderQuote + "”";
      get("author").hidden = false;
      get("method").textContent = lasso.authorMethod;
      get("lasso-prompts").href = new URL("lasso-prompts.json", assets);
      get("collections").replaceChildren();
      for (const collection of lasso.collections) {
        const item = document.createElement("li");
        addLink(item, collection.title, collection.url);
        item.append(" — " + collection.detail);
        get("collections").append(item);
      }
      get("lasso").hidden = false;
      get("controls").hidden = false;
      render();
      const selected = requestedMind && directory.get(requestedMind);
      if (selected) select(selected);
    } catch {
      get("summary").textContent = "The Mind registry could not load.";
      get("retry").hidden = false;
    } finally {
      loading = false;
    }
  }

  get("retry").addEventListener("click", load);
  if (dialog) {
    function show() {
      if (!dialog.open) dialog.showModal();
      load();
    }
    open.addEventListener("click", show);
    if (location.hash === "#minds" || requestedMind) show();
    window.addEventListener("hashchange", () => {
      if (location.hash === "#minds") show();
    });
  } else {
    load();
  }
})();
