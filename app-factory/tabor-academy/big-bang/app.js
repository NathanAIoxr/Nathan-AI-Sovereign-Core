"use strict";

const button = document.querySelector("#ignite");
const stage = document.querySelector("#burst");
const status = document.querySelector("#ignition-status");
const paths = document.querySelector("#paths-title");
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

function openPaths() {
  button.removeAttribute("aria-busy");
  status.textContent = "The six Academy paths are ready.";
  paths.focus({ preventScroll: true });
  paths.scrollIntoView({ block: "start", behavior: motion.matches ? "instant" : "smooth" });
}

function explode() {
  if (button.getAttribute("aria-busy") === "true") return;
  const context = motion.matches ? null : stage.getContext("2d");
  if (!context) {
    openPaths();
    return;
  }
  button.setAttribute("aria-busy", "true");
  status.textContent = "Big Bang started.";
  const bounds = stage.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  stage.width = Math.round(bounds.width * scale);
  stage.height = Math.round(bounds.height * scale);
  context.scale(scale, scale);
  const hues = ["255,195,135", "255,115,132", "229,189,255", "255,242,213"];
  const particles = Array.from({ length: 180 }, (_, index) => {
    const angle = Math.random() * 2 * Math.PI;
    return {
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      distance: (0.24 + Math.random() * 0.64) * Math.hypot(bounds.width, bounds.height),
      radius: 1 + Math.random() * 2.8,
      color: hues[index % hues.length]
    };
  });
  const x = bounds.width / 2;
  const y = bounds.height * .57;
  const started = performance.now();

  function draw(time) {
    const progress = Math.min((time - started) / 1350, 1);
    context.clearRect(0, 0, bounds.width, bounds.height);
    if (motion.matches || progress >= 1) {
      openPaths();
      return;
    }
    const spread = 1 - (1 - progress) ** 2;
    for (const particle of particles) {
      const offset = particle.distance * spread;
      context.fillStyle = "rgba(" + particle.color + "," + ((1 - progress) ** 1.45) + ")";
      context.beginPath();
      context.arc(x + particle.dx * offset, y + particle.dy * offset, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);
}

button.hidden = false;
button.addEventListener("click", explode);
