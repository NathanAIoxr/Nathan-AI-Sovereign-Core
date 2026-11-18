const form = document.querySelector("#timing-form");
const status = document.querySelector("#run-status");
const result = document.querySelector("#run-result");
const metrics = document.querySelector("#run-metrics");
const steps = document.querySelector("#run-steps");
const rows = document.querySelector("#run-rows");
const source = document.querySelector("#live-sources");
const runLink = document.querySelector("#run-json");
const format = new Intl.NumberFormat("en", { maximumFractionDigits: 4 });
const element = (tag, content) => Object.assign(document.createElement(tag), { textContent: content });

document.querySelectorAll(".track-links a").forEach(link => link.addEventListener("click", () => {
  document.querySelector(link.getAttribute("href")).open = true;
}));

form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  result.hidden = true;
  status.textContent = "Checking connected projects…";
  const url = "/api/run?" + new URLSearchParams(new FormData(form));
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error ?? "Verification failed.");
    const cards = [
      ["Source pulses", format.format(data.rhythm.pulseCount)],
      ["Elapsed ticks", format.format(data.timer.totalTicks)],
      ["Brood phases", data.rhythm.broods.map(brood => brood.phase + " / " + brood.cycleYears).join(" · ")],
      ["Next shared year", String(data.rhythm.nextSharedYear)]
    ];
    metrics.replaceChildren(...cards.map(([label, value]) => {
      const card = document.createElement("div");
      card.append(element("dt", label), element("dd", value));
      return card;
    }));
    steps.replaceChildren(...data.steps.map(step => element("li", step.name + " · " + step.result)));
    rows.replaceChildren(...data.timer.edges.map(edge => {
      const row = document.createElement("tr");
      for (const value of [edge.pulse, edge.ticksSincePrevious, edge.elapsedTicks, edge.errorNumerator / data.inputs.bpm]) {
        row.append(element("td", format.format(value)));
      }
      return row;
    }));
    source.textContent = `Rhythm Matrix atlas: ${data.rhythm.atlasRecords} records. 2X+: ${data.computer.fields}-field fixture restored. True Cloud: ${data.cloud.state}.`;
    runLink.href = url;
    result.hidden = false;
    status.textContent = "Timing run verified.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
