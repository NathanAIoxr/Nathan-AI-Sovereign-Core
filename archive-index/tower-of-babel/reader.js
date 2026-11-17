(() => {
  const normalize = text => text.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const filters = document.querySelector("#exhibit-filters");
  const query = document.querySelector("#query");
  const category = document.querySelector("#category");
  const counter = document.querySelector("#result-count");
  const exhibits = [...document.querySelectorAll("[data-exhibit]")].map(el => ({
    el, text: normalize(el.textContent),
  }));
  const exhibitById = new Map(exhibits.map(({el}) => [el.id.toLowerCase(), el]));
  const groups = [...document.querySelectorAll(".exhibit-group")];

  function filterExhibits() {
    const terms = normalize(query.value).trim().split(/\s+/).filter(Boolean);
    let matches = 0;
    for (const {el, text} of exhibits) {
      const shown = (!category.value || el.dataset.exhibit === category.value) &&
        terms.every(term => text.includes(term.replace(/^#(?=[a-e]\d{2}$)/, "")));
      el.hidden = !shown;
      matches += Number(shown);
    }
    for (const group of groups) group.hidden = !group.querySelector("[data-exhibit]:not([hidden])");
    counter.textContent = matches ? `${matches} of ${exhibits.length} exhibits` : "No matching exhibits";
  }

  const attachment = document.querySelector("#original-attachment");
  function revealTarget() {
    const id = location.hash.slice(1);
    if (id === attachment.id) attachment.open = true;
    const exhibit = exhibitById.get(id.toLowerCase());
    if (!exhibit) return;
    if (exhibit.hidden) {
      query.value = "";
      category.value = "";
      filterExhibits();
    }
    if (id !== exhibit.id) history.replaceState(null, "", "#" + exhibit.id);
    requestAnimationFrame(() => exhibit.scrollIntoView());
  }

  filters.hidden = false;
  query.addEventListener("input", filterExhibits);
  category.addEventListener("change", filterExhibits);
  filters.addEventListener("submit", event => event.preventDefault());
  filters.addEventListener("reset", () => requestAnimationFrame(filterExhibits));
  window.addEventListener("hashchange", revealTarget);
  document.addEventListener("click", event => {
    const link = event.target.closest("a[href^='#']");
    if (link && link.hash === location.hash) revealTarget();
  });
  filterExhibits();
  revealTarget();

  const reverse = document.querySelector("#reverse");
  const letterGroup = document.querySelector(".letters");
  const letterNote = document.querySelector("#letter-status");
  reverse.hidden = false;
  let word = "GOD";
  reverse.addEventListener("click", () => {
    const next = [...word].reverse().join("");
    const letters = [...next].map(char => {
      const tile = document.createElement("span");
      tile.className = "letter";
      tile.textContent = char;
      return tile;
    });
    letterGroup.replaceChildren(...letters);
    letterGroup.classList.add("flip-signal");
    letterNote.textContent = `${word} → ${next} · a letter-by-letter reversal`;
    reverse.firstChild.textContent = `Reverse ${next} `;
    word = next;
  });

  const timeline = document.querySelector("#timeline");
  const details = document.querySelector("#timeline-detail");
  const title = details.querySelector("strong");
  const note = details.querySelector("p");
  const exhibitLink = details.querySelector("a");
  const dateButtons = [...timeline.querySelectorAll("a")].map(link => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = link.textContent;
    button.addEventListener("click", () => selectDate(button, link.dataset));
    link.replaceWith(button);
    return {button, source: link.dataset};
  });

  function selectDate(button, source) {
    for (const entry of dateButtons) entry.button.setAttribute("aria-pressed", String(button === entry.button));
    title.textContent = source.title;
    note.textContent = source.note;
    exhibitLink.href = "#" + source.exhibitId;
    exhibitLink.textContent = "Open exhibit " + source.exhibitId;
  }

  details.hidden = false;
  selectDate(dateButtons[0].button, dateButtons[0].source);

  const progress = document.querySelector(".read-progress");
  const navigation = [...document.querySelectorAll(".section-nav a, .chapter-contents a")].map(link => ({
    link, target: document.getElementById(link.hash.slice(1)),
  })).filter(item => item.target);
  const main = document.querySelector("#main");
  const nav = document.querySelector(".section-nav");
  let frame = 0;

  function updateReadingState() {
    frame = 0;
    const navHeight = nav.offsetHeight;
    const visibleHeight = window.innerHeight - navHeight;
    const mainRect = main.getBoundingClientRect();
    const distance = Math.max(0, mainRect.height - visibleHeight);
    const covered = Math.max(0, navHeight - mainRect.top);
    progress.value = distance ? Math.min(100, (covered / distance) * 100) : 100;
    for (const selector of [".section-nav", ".chapter-contents"]) {
      const links = navigation.filter(({link}) => link.closest(selector));
      const current = links.findLast(({target}) => target.getBoundingClientRect().top <= navHeight + 28);
      for (const item of links) {
        if (item === current) item.link.setAttribute("aria-current", "location");
        else item.link.removeAttribute("aria-current");
      }
    }
  }

  function scheduleReadingState() {
    if (!frame) frame = requestAnimationFrame(updateReadingState);
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function syncMotion() {
    progress.hidden = reducedMotion.matches;
    scheduleReadingState();
  }
  reducedMotion.addEventListener("change", syncMotion);
  window.addEventListener("scroll", scheduleReadingState, {passive: true});
  window.addEventListener("resize", scheduleReadingState);
  attachment.addEventListener("toggle", scheduleReadingState);
  syncMotion();
})();
