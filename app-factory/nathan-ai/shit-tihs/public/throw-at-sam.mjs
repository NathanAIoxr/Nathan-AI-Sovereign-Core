const stage = document.querySelector('#stage');
const count = document.querySelector('#splat-count');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let splats = 0;

function showCount() {
  count.textContent = 'Splats: ' + splats;
}

async function impact() {
  splats += 1;
  showCount();
  if (reducedMotion.matches) return;

  const splat = document.createElement('span');
  splat.className = 'splat';
  stage.append(splat);
  try {
    await splat.animate([
      { transform: 'scale(.4)', opacity: 1 },
      { transform: 'scale(1.6)', opacity: 1, offset: .24 },
      { transform: 'scale(1.8)', opacity: 0 }
    ], 550).finished;
  } finally {
    splat.remove();
  }
}

async function throwClod() {
  if (reducedMotion.matches) {
    await impact();
    return;
  }

  const clod = document.createElement('span');
  clod.className = 'clod';
  stage.append(clod);
  const { width, height } = stage.getBoundingClientRect();
  try {
    await clod.animate([
      { transform: 'translate(' + (width * .67) + 'px, ' + (height * .15) + 'px) rotate(160deg)' },
      { transform: 'translate(' + (width * .31) + 'px, ' + (-height * .13) + 'px) rotate(70deg)', offset: .53 },
      { transform: 'translate(0, 0) rotate(0deg)' }
    ], { duration: 440, easing: 'ease-out' }).finished;
  } finally {
    clod.remove();
  }
  if (!clod.dataset.reset) await impact();
}

document.querySelector('#throw').addEventListener('click', throwClod);
document.querySelector('#reset').addEventListener('click', () => {
  for (const clod of stage.querySelectorAll('.clod')) clod.dataset.reset = 'true';
  for (const effect of stage.querySelectorAll('.clod, .splat')) effect.remove();
  splats = 0;
  showCount();
});
