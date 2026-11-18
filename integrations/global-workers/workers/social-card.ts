// MIT · source: https://github.com/mdanassaif/workerscando/blob/8e818fa0bef387249be3b01b51460cb726597da8/workers/og-image/src/index.ts
// License and copyright notices: ../licenses/workerscando.txt
const FACE =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO =
  "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

const T = {
  midnight: {
    bg: '#09090B',
    bg2: '#18181B',
    card: '#0C0C0F',
    t: '#FAFAFA',
    m: '#A1A1AA',
    a: '#A78BFA',
    a2: '#C4B5FD',
    glow: '#7C3AED',
  },
  sunset: {
    bg: '#0C0A09',
    bg2: '#1C1917',
    card: '#12100E',
    t: '#FAFAF9',
    m: '#A8A29E',
    a: '#FB923C',
    a2: '#FDBA74',
    glow: '#EA580C',
  },
  ocean: {
    bg: '#020617',
    bg2: '#0F172A',
    card: '#07111F',
    t: '#F8FAFC',
    m: '#94A3B8',
    a: '#22D3EE',
    a2: '#67E8F9',
    glow: '#0891B2',
  },
  forest: {
    bg: '#022C22',
    bg2: '#064E3B',
    card: '#042F26',
    t: '#ECFDF5',
    m: '#6EE7B7',
    a: '#34D399',
    a2: '#6EE7B7',
    glow: '#059669',
  },
  minimal: {
    bg: '#FAFAF9',
    bg2: '#F5F5F4',
    card: '#FFFFFF',
    t: '#0A0A0A',
    m: '#57534E',
    a: '#0A0A0A',
    a2: '#44403C',
    glow: '#D6D3D1',
  },
  rose: {
    bg: '#0C0A0B',
    bg2: '#1F1318',
    card: '#140E11',
    t: '#FFF1F2',
    m: '#FDA4AF',
    a: '#FB7185',
    a2: '#FECDD3',
    glow: '#E11D48',
  },
} as const;

type TN = keyof typeof T;
type Theme = (typeof T)[TN];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cut = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1)}…`);

function wrap(txt: string, maxChars: number): string[] {
  const words = txt.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function titleLines(
  lines: string[],
  x: number,
  y: number,
  size: number,
  fill: string,
  weight = 700,
  anchor: 'start' | 'middle' | 'end' = 'start',
) {
  const dy = Math.round(size * 1.15);
  const spans = lines
    .map((ln, i) => `<tspan x="${x}" dy="${i ? dy : 0}">${ln}</tspan>`)
    .join('');
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FACE}" font-size="${size}" font-weight="${weight}" letter-spacing="-0.03em" fill="${fill}">${spans}</text>`;
}

function logoImg(href: string, x: number, y: number, size: number, radius: number, clipId: string) {
  return `
    <clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}"/></clipPath>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="#fff" fill-opacity="0.06"/>
    <image href="${esc(href)}" x="${x}" y="${y}" width="${size}" height="${size}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid meet"/>
  `;
}

function logoOrBadge(
  logo: string | null,
  label: string,
  th: Theme,
  x: number,
  y: number,
  size: number,
  radius: number,
  clipId: string,
  light: boolean,
) {
  if (logo) return logoImg(logo, x, y, size, radius, clipId);
  const initials = esc((label || 'OG').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'OG');
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${th.a}"/>
    <text x="${x + size / 2}" y="${y + size / 2 + size * 0.12}" text-anchor="middle" font-family="${FACE}" font-size="${Math.round(size * 0.36)}" font-weight="700" fill="${light ? '#fff' : th.bg}">${initials}</text>
  `;
}

function softLight(th: Theme, light: boolean) {
  return `
    <radialGradient id="spot" cx="85%" cy="0%" r="55%">
      <stop offset="0%" stop-color="${th.glow}" stop-opacity="${light ? 0.18 : 0.35}"/>
      <stop offset="100%" stop-color="${th.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="spot2" cx="0%" cy="100%" r="50%">
      <stop offset="0%" stop-color="${th.a}" stop-opacity="${light ? 0.08 : 0.16}"/>
      <stop offset="100%" stop-color="${th.a}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${th.a}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${th.a2}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${th.a}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${th.a}"/>
      <stop offset="100%" stop-color="${th.glow}"/>
    </linearGradient>
  `;
}

function svg(p: {
  title: string;
  subtitle?: string;
  author?: string;
  domain?: string;
  date?: string;
  theme?: TN;
  layout?: string;
  logo?: string | null;
  cover?: string | null;
}) {
  const themeKey = p.theme && p.theme in T ? p.theme : 'midnight';
  const th = T[themeKey];
  const light = themeKey === 'minimal';
  const l = p.layout || 'standard';
  const rawTitle = cut(p.title, 70);
  const title = esc(rawTitle);
  const sub = p.subtitle ? esc(cut(p.subtitle, 100)) : '';
  const auth = p.author ? esc(cut(p.author, 36)) : '';
  const dom = p.domain ? esc(cut(p.domain, 36)) : '';
  const dt = p.date ? esc(cut(p.date, 36)) : '';
  const logo = p.logo || null;
  const cover = p.cover || null;
  const brand = auth || dom || 'OG';

  const lines = wrap(rawTitle, l === 'split' ? 18 : l === 'bold' ? 16 : 28).map(esc);

  let body = '';

  if (l === 'standard') {
    // Clean article card — ogimage.org "blog / headline" energy
    const size = lines.length > 2 ? 52 : lines.length > 1 ? 58 : 64;
    const titleY = 250;
    const subY = titleY + lines.length * Math.round(size * 1.15) + 26;
    body = `
      <rect width="1200" height="630" fill="${th.bg}"/>
      <rect width="1200" height="630" fill="url(#spot)"/>
      <rect width="1200" height="630" fill="url(#spot2)"/>
      <rect x="40" y="40" width="1120" height="550" rx="28" fill="${th.card}" stroke="${th.t}" stroke-opacity="${light ? 0.08 : 0.08}"/>
      <rect x="40" y="40" width="1120" height="4" rx="2" fill="url(#edge)"/>

      ${logoOrBadge(logo, brand, th, 88, 88, 64, 16, 'c1', light)}
      <text x="172" y="114" font-family="${FACE}" font-size="24" font-weight="600" fill="${th.t}">${esc(cut(brand, 28))}</text>
      ${dom ? `<text x="172" y="142" font-family="${MONO}" font-size="15" fill="${th.m}">${dom}</text>` : ''}

      ${titleLines(lines, 88, titleY, size, th.t, 700)}
      ${sub ? `<text x="88" y="${subY}" font-family="${FACE}" font-size="26" fill="${th.m}">${sub}</text>` : ''}

      <rect x="88" y="500" width="80" height="4" rx="2" fill="${th.a}"/>
      <text x="88" y="548" font-family="${FACE}" font-size="20" font-weight="500" fill="${th.t}">${[auth, dt].filter(Boolean).join('  ·  ')}</text>
      ${dom ? `<text x="1112" y="548" text-anchor="end" font-family="${MONO}" font-size="16" fill="${th.m}">${dom}</text>` : ''}
    `;
  } else if (l === 'split') {
    // Left copy / right cover photo (logo stays small on the left)
    const size = lines.length > 2 ? 44 : 52;
    const titleY = 200;
    const rightPanel = cover
      ? `
      <defs>
        <clipPath id="coverClip"><rect x="680" y="0" width="520" height="630"/></clipPath>
        <linearGradient id="coverFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="50%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
        </linearGradient>
      </defs>
      <image href="${esc(cover)}" x="680" y="0" width="520" height="630" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>
      <rect x="680" y="0" width="520" height="630" fill="#000" fill-opacity="0.12"/>
      <rect x="680" y="0" width="520" height="630" fill="url(#coverFade)"/>
      ${logo ? logoImg(logo, 1108, 534, 56, 14, 'cBadge') : ''}
      `
      : `
      <rect x="680" y="0" width="520" height="630" fill="url(#splitFill)"/>
      <circle cx="940" cy="300" r="150" fill="${th.bg}" fill-opacity="0.12"/>
      ${logo
        ? logoImg(logo, 864, 224, 152, 36, 'c3')
        : `<text x="940" y="315" text-anchor="middle" font-family="${FACE}" font-size="56" font-weight="700" fill="${th.bg}">${esc((brand || 'og').slice(0, 2).toLowerCase())}</text>`}
      ${dom ? `<text x="940" y="430" text-anchor="middle" font-family="${MONO}" font-size="14" letter-spacing="0.12em" fill="${th.bg}" fill-opacity="0.75">${dom.toUpperCase()}</text>` : ''}
      `;

    body = `
      <rect width="1200" height="630" fill="${th.bg}"/>
      <rect x="0" y="0" width="680" height="630" fill="${th.card}"/>
      <rect x="0" y="0" width="680" height="630" fill="url(#spot2)"/>
      ${rightPanel}

      ${logoOrBadge(logo, brand, th, 72, 72, 56, 14, 'c2', light)}
      ${dom ? `<text x="148" y="108" font-family="${MONO}" font-size="15" fill="${th.m}">${dom}</text>` : ''}

      ${titleLines(lines, 72, titleY, size, th.t, 700)}
      ${sub ? `<text x="72" y="${titleY + lines.length * Math.round(size * 1.15) + 28}" font-family="${FACE}" font-size="22" fill="${th.m}">${sub}</text>` : ''}

      ${(auth || dt) ? `
        <rect x="72" y="500" width="${Math.min(520, ([auth, dt].filter(Boolean).join(' · ').length) * 11 + 40)}" height="44" rx="22" fill="${th.a}" fill-opacity="${light ? 0.12 : 0.18}"/>
        <text x="92" y="528" font-family="${FACE}" font-size="18" font-weight="600" fill="${th.t}">${[auth, dt].filter(Boolean).join('  ·  ')}</text>
      ` : ''}
    `;
  } else if (l === 'centered') {
    const size = 56;
    const titleY = logo ? 310 : 280;
    body = `
      <rect width="1200" height="630" fill="${th.bg}"/>
      <rect width="1200" height="630" fill="url(#spot)"/>
      <rect x="480" y="72" width="240" height="3" fill="url(#edge)"/>
      ${logo ? logoImg(logo, 564, 110, 72, 20, 'c4') : ''}
      ${dom ? `<text x="600" y="${logo ? 220 : 160}" text-anchor="middle" font-family="${MONO}" font-size="15" letter-spacing="0.18em" fill="${th.a}">${dom.toUpperCase()}</text>` : ''}
      ${titleLines(lines, 600, titleY, size, th.t, 700, 'middle')}
      ${sub ? `<text x="600" y="${titleY + lines.length * Math.round(size * 1.15) + 28}" text-anchor="middle" font-family="${FACE}" font-size="24" fill="${th.m}">${sub}</text>` : ''}
      ${(auth || dt) ? `<text x="600" y="540" text-anchor="middle" font-family="${FACE}" font-size="18" fill="${th.m}">${[auth, dt].filter(Boolean).join('  ·  ')}</text>` : ''}
    `;
  } else if (l === 'minimal') {
    body = `
      <rect width="1200" height="630" fill="${th.bg}"/>
      ${logoOrBadge(logo, brand, th, 96, 96, 48, 12, 'c5', light)}
      ${dom ? `<text x="164" y="128" font-family="${MONO}" font-size="16" fill="${th.m}">${dom}</text>` : ''}
      ${titleLines(lines, 96, 260, 60, th.t, 650)}
      ${sub ? `<text x="96" y="${260 + lines.length * 70 + 16}" font-family="${FACE}" font-size="24" fill="${th.m}">${sub}</text>` : ''}
      <line x1="96" y1="500" x2="1104" y2="500" stroke="${th.t}" stroke-opacity="0.1"/>
      <text x="96" y="548" font-family="${FACE}" font-size="18" fill="${th.m}">${auth}</text>
      <text x="1104" y="548" text-anchor="end" font-family="${MONO}" font-size="16" fill="${th.m}">${dt}</text>
    `;
  } else if (l === 'bold') {
    body = `
      <rect width="1200" height="630" fill="${th.bg}"/>
      <rect width="1200" height="630" fill="url(#spot)"/>
      <rect x="0" y="0" width="1200" height="12" fill="${th.a}"/>
      <rect x="0" y="618" width="1200" height="12" fill="${th.a}"/>
      ${logo ? logoImg(logo, 80, 56, 56, 14, 'c6') : ''}
      ${dom ? `<text x="${logo ? 156 : 80}" y="92" font-family="${MONO}" font-size="15" letter-spacing="0.16em" fill="${th.a2}">${dom.toUpperCase()}</text>` : ''}
      ${titleLines(lines, 80, logo ? 240 : 220, 70, th.t, 800)}
      ${sub ? `<text x="80" y="455" font-family="${FACE}" font-size="24" fill="${th.m}">${sub}</text>` : ''}
      ${(auth || dt) ? `
        <rect x="80" y="510" width="${Math.min(700, ([auth, dt].filter(Boolean).join(' · ').length) * 12 + 48)}" height="48" rx="24" fill="${th.a}"/>
        <text x="104" y="541" font-family="${FACE}" font-size="18" font-weight="600" fill="${light ? '#fff' : th.bg}">${[auth, dt].filter(Boolean).join('  ·  ')}</text>
      ` : ''}
    `;
  } else {
    // fallback = standard
    body = `
      <rect width="1200" height="630" fill="${th.bg}"/>
      ${titleLines(lines, 80, 280, 58, th.t, 700)}
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
  <defs>${softLight(th, light)}</defs>
  ${body}
</svg>`;
}


export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/") return Response.json({usage:"GET /api/og?title=TEXT&theme=midnight"});
    if (url.pathname !== "/api/og") return new Response("Not found", {status:404});
    const get = (key) => url.searchParams.get(key)?.slice(0, 128) ?? undefined;
    const theme = get("theme");
    const image = svg({title:get("title") ?? "Tabor Worker", subtitle:get("subtitle"), author:get("author"),
                       theme:theme && Object.hasOwn(T,theme) ? theme as TN : undefined});
    return new Response(image, {headers:{"Content-Type":"image/svg+xml; charset=utf-8",
       "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'", "X-Content-Type-Options":"nosniff"}});
  },
};
