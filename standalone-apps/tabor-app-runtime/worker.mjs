const client = function appClient(config) {
  const status = document.querySelector('#status');
  const tell = message => { status.textContent = message; };
  function download(name, contents, type) {
    const file = new Blob([contents], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  let prompt;
  const install = document.querySelector('#install');
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    prompt = event;
    install.hidden = false;
  });
  install.addEventListener('click', async () => {
    if (prompt) {
      await prompt.prompt();
      prompt = undefined;
      install.hidden = true;
    }
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register(config.path + 'sw.js').catch(() => {});

  if (config.id === 'kristian-plaque') {
    document.querySelector('#copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(config.quote); tell('Copied plaque text.'); }
      catch { tell('Select the plaque text to copy it, or use Download text.'); }
    });
    document.querySelector('#download').addEventListener('click', () => {
      download('KRISTIAN-plaque.txt', config.quote + '\n', 'text/plain;charset=utf-8');
    });
    return;
  }

  const key = 'tabor-app:' + config.id + ':edition:v1';
  const options = Array.from(document.querySelectorAll('[data-edition]'));
  let selected = config.editions[0];
  try {
    const previous = localStorage.getItem(key);
    const saved = previous === 'first' ? 'debut' : previous;
    selected = config.editions.find(edition => edition.id === saved) ?? selected;
  } catch {}
  function update() {
    for (const button of options) button.setAttribute('aria-pressed', String(button.dataset.edition === selected.id));
    document.querySelector('#edition-name').textContent = selected.label;
  }
  for (const button of options) button.addEventListener('click', () => {
    selected = config.editions.find(edition => edition.id === button.dataset.edition);
    update();
    tell('');
  });
  document.querySelector('#save').addEventListener('click', () => {
    try { localStorage.setItem(key, selected.id); tell('Saved ' + selected.label + ' on this device.'); }
    catch { tell('Browser storage is unavailable. Download the edition card to keep your selection.'); }
  });
  document.querySelector('#download').addEventListener('click', () => {
    download('TaborPoolBoys-' + selected.id + '.txt', ['TaborPoolBoys', selected.label, selected.subtitle, 'By Nathan Tabor'].join('\n') + '\n', 'text/plain;charset=utf-8');
  });
  update();
};
const offline = function offline(config) {
  const current = 'tabor-app:' + config.id + ':' + config.version;
  self.addEventListener('install', event => {
    event.waitUntil(caches.open(current).then(cache => cache.addAll(config.assets)));
  });
  self.addEventListener('activate', event => {
    event.waitUntil((async () => {
      const prefix = 'tabor-app:' + config.id + ':';
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== current).map(key => caches.delete(key)));
      await self.clients.claim();
    })());
  });
  self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin || !config.assets.includes(url.pathname)) return;
    event.respondWith((async () => {
      const cache = await caches.open(current);
      try {
        const res = await fetch(event.request);
        if (res.ok && !url.search) await cache.put(url.pathname, res.clone());
        return res;
      } catch {
        return await cache.match(url.pathname) ?? new Response('This page is offline.', { status: 503 });
      }
    })());
  });
};
const icon = async function pngIcon(size, mark, shade, bright) {
  const glyphs = {
    P: ["11110","10001","10001","11110","10000","10000","10000"],
    B: ["11110","10001","10001","11110","10001","10001","11110"],
    K: ["10001","10010","10100","11000","10100","10010","10001"],
  };
  const bytes = new Uint8Array((size + 1) * size);
  const unit = Math.floor(size / (mark.length === 1 ? 11 : 17));
  const labelWidth = (mark.length * 6 - 1) * unit;
  const offsetX = Math.floor((size - labelWidth) / 2);
  const offsetY = Math.floor((size - 7 * unit) / 2);
  for (let letter = 0; letter < mark.length; letter++) {
    const rows = glyphs[mark[letter]];
    for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) {
      if (rows[y][x] !== "1") continue;
      for (let dy = 0; dy < unit; dy++) {
        const start = (offsetY + y * unit + dy) * (size + 1) + 1 + offsetX + (letter * 6 + x) * unit;
        bytes.fill(1, start, start + unit);
      }
    }
  }
  const u32 = value => Uint8Array.of(value >>> 24, value >>> 16, value >>> 8, value);
  const palette = color => color.slice(1).match(/.{2}/g).map(value => parseInt(value, 16));
  const chunk = (name, payload) => {
    const body = new Uint8Array(4 + payload.length);
    body.set(new TextEncoder().encode(name));
    body.set(payload, 4);
    let crc = 0xffffffff;
    for (const byte of body) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return [u32(payload.length), body, u32(crc ^ 0xffffffff)];
  };
  const input = new Response(bytes).body.pipeThrough(new CompressionStream('deflate'));
  const data = new Uint8Array(await new Response(input).arrayBuffer());
  return new Blob([
    Uint8Array.of(137,80,78,71,13,10,26,10),
    ...chunk('IHDR', Uint8Array.of(...u32(size), ...u32(size), 8, 3, 0, 0, 0)),
    ...chunk('PLTE', Uint8Array.of(...palette(shade), ...palette(bright))),
    ...chunk('IDAT', data),
    ...chunk('IEND', new Uint8Array()),
  ]);
};
const escapeHtml = function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, letter => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[letter]);
};
const css = "\n*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--paper);font:1rem/1.6 \"Instrument Sans\",system-ui,sans-serif}a{color:var(--accent);text-underline-offset:.2em}\nbutton,a{touch-action:manipulation}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:5px}\n.wrap{width:min(70rem,calc(100% - 2.5rem));margin:auto}.skip{position:absolute;top:-5rem;background:var(--panel);padding:.5rem 1rem}.skip:focus{top:.6rem}\n.top{border-bottom:1px solid var(--muted)}.top .wrap{min-height:4rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding-block:.5rem}\na.brand{font-weight:800;letter-spacing:.08em;text-decoration:none;color:var(--paper)}nav{display:flex;gap:1rem;flex-wrap:wrap}\nheader{padding:clamp(3rem,7vw,6.5rem) 0 2.5rem}h1,h2,.cover h3{font-family:\"Instrument Serif\",Georgia,serif;font-weight:500;line-height:1}h1{font-size:clamp(3.1rem,9vw,7rem);letter-spacing:-.065em;margin:0 0 1rem}\nheader p{color:var(--muted);max-width:38rem;font-size:clamp(1.05rem,2vw,1.3rem);margin:0}h2{font-size:clamp(2rem,5vw,3.3rem);margin:0 0 1rem}\nsection{padding:2rem 0 3rem}.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr))}\n.cover{min-height:21rem;background:var(--panel);display:flex;flex-direction:column;border:1px solid var(--muted);padding:1.25rem;overflow:hidden}\n.cover header{padding:0;flex:1}.cover h3{font-size:clamp(2rem,4.2vw,3.3rem);letter-spacing:-.065em;margin:.6rem 0 0;overflow-wrap:anywhere}.cover header p{font-size:.9rem}.cover .figure{height:8rem;margin:1rem 0;background:repeating-linear-gradient(132deg,transparent 0 13px,var(--accent) 14px 15px,transparent 16px 27px);opacity:.8}.cover.broadsheet .figure{background:repeating-linear-gradient(90deg,transparent 0 14%,var(--accent) 15% 16%,transparent 17% 22%),repeating-linear-gradient(0deg,transparent 0 10px,var(--accent) 11px 12px,transparent 13px 20px)}\n.cover.christmas .figure{background:repeating-radial-gradient(circle at 50% 50%,transparent 0 16px,var(--accent) 17px 18px,transparent 19px 27px)}\nbutton,.button{border:1px solid var(--accent);background:var(--accent);color:var(--bg);min-height:2.75rem;padding:.5rem 1rem;border-radius:.25rem;font:inherit;font-weight:750;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}\nbutton[aria-pressed=false],button.secondary,.button.secondary{background:transparent;color:var(--accent)}button[aria-pressed=true]{outline:1px solid var(--accent);outline-offset:3px}\n.tools{display:flex;gap:.65rem;flex-wrap:wrap;margin-top:1rem;align-items:center}button[hidden]{display:none}\n.panel{background:var(--panel);padding:1.2rem 1.5rem;border:1px solid var(--muted);margin-top:1.2rem}ol{padding-inline-start:1.35rem}li{margin-block:.25rem}\nblockquote.plaque{margin:0;padding:clamp(1.4rem,5vw,3.5rem);background:var(--panel);border:3px double var(--accent);text-align:center;font:clamp(1.55rem,4vw,2.7rem)/1.28 \"Instrument Serif\",Georgia,serif}\n.plaque p{max-width:34ch;margin:0 auto 1em}.plaque p:last-child{margin-bottom:0}.meta{color:var(--muted)}footer{border-top:1px solid var(--muted);padding:1.2rem 0 2.4rem}.status{min-height:1.6rem;color:var(--accent)}summary{cursor:pointer;color:var(--accent)}details{padding-block:1rem}\n@media print{body{color:#181812;background:white}.top,footer,header,.tools,.status,.record{display:none}section{padding:0}blockquote.plaque{color:#181812;background:#faf7ee;border-color:#615231}}\n";
function createApp(config, assets) {
  const prefix = '/tabor-apps/' + config.id + '/';
  const identity = { app: config.id, status: 'ok', version: config.version };
  const imageOrigins = new Set([
    ...config.editions?.map(edition => new URL(edition.cover).origin) ?? [],
    ...config.archive ? [new URL(config.archive.image).origin] : [],
  ]);
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self'" + [...imageOrigins].map(origin => ' ' + origin).join('') + "; manifest-src 'self'; worker-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  };
  function reply(body, type, code = 200, cache = 'no-cache') {
    return new Response(body, { status: code, headers: { ...headers, 'Content-Type': type, 'Cache-Control': cache } });
  }
  const manifest = {
    id: prefix, name: config.title, short_name: config.short, description: config.description,
    scope: prefix, start_url: prefix, display: 'standalone', lang: 'en',
    theme_color: config.theme, background_color: config.theme,
    icons: [192,512].map(size => ({ src: prefix + 'icon-' + size + '.png', sizes: size + 'x' + size, type: 'image/png', purpose: 'any' })),
  };
  const swAssets = ['', 'style.css', 'main.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'].map(path => prefix + path);
  if (config.history) swAssets.push(prefix + 'history', prefix + 'history.txt', prefix + 'print');
  const clientCode = '(' + assets.client.toString() + ')(' + JSON.stringify({ id: config.id, path: prefix, quote: config.quote, editions: config.editions }) + ');';
  const swCode = '(' + assets.offline.toString() + ')(' + JSON.stringify({id:config.id, version:config.version, assets:swAssets}) + ');';
  const palette = ':root{color-scheme:dark;--bg:' + config.theme + ';--paper:' + config.paper + ';--panel:' + config.panel + ';--accent:' + config.accent + ';--muted:' + config.muted + '}';
  const e = assets.escapeHtml;
  const paragraphs = text => text.split('\n\n').map(line => '<p>' + e(line) + '</p>').join('');
  let interfaceHtml;
  if (config.quote) {
    interfaceHtml = `<section id="content"><blockquote class="plaque" aria-label="Nathan Tabor’s corrected plaque">${config.quote.split('\n\n').map(line=>'<p>'+e(line)+'</p>').join('')}</blockquote>
    <div class="tools"><button id="copy" type="button">Copy exact text</button><button id="download" class="secondary" type="button">Download text</button><a class="button secondary" href="${prefix}print">Print layout</a></div>
    <p id="status" class="status" role="status"></p>
    ${config.archive ? `<figure class="restored-plaque"><img src="${e(config.archive.image)}" alt="The Kristian Nation of America wall plaque" loading="lazy"><figcaption><a href="${e(config.archive.url)}">Original illustrated publication and First John source notes</a></figcaption></figure>` : ''}
    <div class="record"><h2>Editorial record</h2>${config.history ? `<a class="button secondary" href="${prefix}history">Read the original wording and corrections</a>` : ''}
    <ol><li><strong>Nathan Tabor</strong> wrote the three-paragraph statement above.</li><li><strong>ChatGPT’s earlier plaque</strong> inserted “THE CHRISTIAN CHARACTERS I’M CALLING OUT” and replaced the closing line.</li><li><strong>ChatGPT’s chat reply</strong> added the sentence beginning “Accountability belongs.”</li><li><strong>Nathan Tabor</strong> directed that the last line read “NOT A.” This edition applies that correction.</li></ol>
    </div></section>`;
  } else {
    interfaceHtml = `<section id="content"><p class="creator-quote">${e(config.slogan)}</p><p>Edited by ${e(config.editors.join(' and '))}.</p>
    <div class="tools"><a class="button" href="${e(config.magazine.readerUrl)}">Read the magazine</a><a class="button secondary" href="${e(config.magazine.gameUrl)}">Play Match the Covers</a></div>
    </section><section><h2>Choose an edition</h2><div class="grid">${config.editions.map((x,index)=>`
    <article class="cover"><a href="${e(x.url)}"><img class="issue-cover" src="${e(x.cover)}" alt="${e(x.alt)}" width="768" height="1152" loading="lazy"></a>
    <header><h3>${e(x.label)}</h3><p>${e(x.subtitle)}</p></header>
    <button type="button" data-edition="${e(x.id)}" aria-pressed="${index===0}">Select ${e(x.label)}</button></article>`).join('')}</div>
    <div class="panel"><strong id="edition-name">${e(config.editions[0].label)}</strong><div class="tools"><button id="save" type="button">Save edition</button><button id="download" class="secondary" type="button">Download edition card</button></div><p id="status" class="status" role="status"></p></div>
    </section><section><h2>Read the originals</h2><div class="tools"><a class="button secondary" href="https://taborboy.pages.dev/app/">TABORBOY app</a><a class="button secondary" href="https://taborpool.pages.dev/app/">TABORPOOL app</a></div></section>`;
  }
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${e(config.theme)}">
  <title>${e(config.title)}</title><meta name="description" content="${e(config.description)}"><link rel="manifest" href="${prefix}manifest.webmanifest"><link rel="apple-touch-icon" sizes="180x180" href="${prefix}icon-180.png"><link rel="stylesheet" href="${prefix}style.css">`;
  const home = `<!doctype html><html lang="en"><head>${head}<script defer src="${prefix}main.js"></script></head><body><a href="#main" class="skip">Skip to content</a>
  <div class="top"><div class="wrap"><a class="brand" href="${prefix}">${e(config.short)}</a><nav aria-label="Project"><a href="#content">${config.quote ? 'Plaque' : 'Editions'}</a><a href="/tabor-apps/">All four apps</a></nav></div></div>
  <main id="main" class="wrap"><header><h1>${e(config.title)}</h1><p>${e(config.description)}</p><div class="tools"><button id="install" type="button" hidden>Install app</button></div>
  <details><summary>Install on your phone</summary><p>In iPhone Safari, open Share, choose Add to Home Screen, then turn on Open as Web App. On Android, use Install app or your browser’s menu.</p></details></header>${interfaceHtml}</main><footer><div class="wrap">Nathan Tabor</div></footer></body></html>`;
  const history = config.history ? `<!doctype html><html lang="en"><head>${head}</head><body><main class="wrap">
  <header><a href="${prefix}">Back to the plaque</a><h1>Inscription history</h1><div class="tools"><a class="button secondary" href="${prefix}history.txt">Download the record</a></div></header>
  ${config.history.map(row => `<section class="panel" id="${e(row.id)}"><h2>${e(row.label)}</h2><p class="meta">${e(row.author)} · ${e(row.source)}</p><blockquote>${paragraphs(row.text)}</blockquote></section>`).join('')}
  <footer>Nathan Tabor’s plaque archive</footer></main></body></html>` : '';
  const historyTxt = config.history ? 'The Kristian Nation of America — Inscription history\n\n' + config.history.map(row =>
    row.label + ' — ' + row.author + '\n' + row.source + '\n\n' + row.text
  ).join('\n\n') + '\n' : '';
  const print = config.quote ? `<!doctype html><html lang="en"><head>${head}</head><body><main class="wrap"><section><blockquote class="plaque">${config.quote.split('\n\n').map(line=>'<p>'+e(line)+'</p>').join('')}</blockquote></section></main></body></html>` : '';
  const iconCache = new Map();
  return {
    async fetch(request) {
      const url = new URL(request.url);
      if (!['GET','HEAD'].includes(request.method)) return reply('Method not allowed', 'text/plain', 405);
      const path = url.pathname;
      let res;
      if (path === prefix.slice(0,-1)) return Response.redirect(url.origin + prefix, 308);
      if (path === prefix) res = reply(home, 'text/html; charset=utf-8');
      else if (path === prefix + 'health') res = reply(JSON.stringify(identity), 'application/json');
      else if (path === prefix + 'manifest.webmanifest') res = reply(JSON.stringify(manifest), 'application/manifest+json');
      else if (path === prefix + 'style.css') res = reply(palette + assets.css +
        '.issue-cover,.restored-plaque img{display:block;width:100%;height:auto}.issue-cover{margin-bottom:1rem}.restored-plaque{max-width:32rem;margin:1rem auto 3rem}.restored-plaque figcaption{padding-top:.6rem}.creator-quote{white-space:pre-wrap;font-size:1.25rem}.panel blockquote{margin-inline:0}', 'text/css; charset=utf-8');
      else if (path === prefix + 'main.js') res = reply(clientCode, 'text/javascript; charset=utf-8');
      else if (path === prefix + 'sw.js') res = reply(swCode, 'text/javascript; charset=utf-8');
      else if (path === prefix + 'history' && history) res = reply(history, 'text/html; charset=utf-8');
      else if (path === prefix + 'history.txt' && historyTxt) {
        res = reply(historyTxt, 'text/plain; charset=utf-8');
        res.headers.set('Content-Disposition', 'attachment; filename="KRISTIAN-inscription-history.txt"');
      }
      else if (path === prefix + 'print' && print) res = reply(print, 'text/html; charset=utf-8');
      else if (path.startsWith(prefix) && /^icon-(180|192|512)\.png$/.test(path.slice(prefix.length))) {
        const size = Number(path.slice(prefix.length + 5, -4));
        if (!iconCache.has(size)) {
          const pending = assets.icon(size, config.mark, config.theme, config.accent).catch(error => {
            iconCache.delete(size);
            throw error;
          });
          iconCache.set(size, pending);
        }
        res = reply(await iconCache.get(size), 'image/png', 200, 'public,max-age=86400');
      } else res = reply('Page unavailable', 'text/plain', 404);
      return request.method === 'HEAD' ? new Response(null, res) : res;
    },
  };
}
const assets = { client, offline, icon, escapeHtml, css };
export const createTaborApp = config => createApp(config, assets);
