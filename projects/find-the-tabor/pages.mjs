import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const projects = JSON.parse(readFileSync(join(here, 'projects.json')));
const selected = process.argv[2] ? [process.argv[2]] : Object.keys(projects);
const headers = `/*
  Content-Security-Policy: default-src 'none'; style-src 'self'; script-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
/download/*
  Content-Disposition: attachment
`;
for (const id of selected) {
  if (!Object.hasOwn(projects, id)) throw new Error(`Unknown project: ${id}`);
  const { default: worker } = await import(`./dist/${id}/index.mjs`);
  const out = join(here, 'dist/pages', id);
  const write = (file, text) => {
    const path = join(out, file);
    mkdirSync(dirname(path), { recursive:true });
    writeFileSync(path, text);
  };
  const routes = {'/':'index.html', '/health':'health.json', '/api/records':'api/records.json', '/style.css':'style.css'};
  if (id === 'silk') routes['/?direction=back'] = 'back/index.html';
  if (id === 'books') {
    for (const slug of ['series-bible','before-the-first-road']) {
      routes['/read/' + slug] = 'read/' + slug + '/index.html';
      routes['/download/' + slug + '.md'] = 'download/' + slug + '.md';
    }
  }
  for (const [route, file] of Object.entries(routes)) {
    const response = await worker.fetch(new Request('https://build.invalid' + route));
    if (!response.ok) throw new Error(`${id} ${route}: ${response.status}`);
    let text = await response.text();
    if (file.endsWith('.html')) {
      for (const {worker, pages} of Object.values(projects)) {
        text = text.replaceAll(`https://${worker}.nathantaboract.workers.dev`, `https://${pages}.pages.dev`);
      }
      text = text.replaceAll('href="/api/records"', 'href="/api/records.json"');
      if (file === 'index.html' || file === 'back/index.html') {
        text = text.replace('</head>','<script src="/filters.js" defer></script></head>');
      }
    }
    write(file, text);
  }
  write('_headers', headers);
  write('filters.js', readFileSync(join(here, 'filters.js'), 'utf8'));
  write('404.html', '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found</title><h1>Page not found</h1><a href="/">Back to the archive</a></html>');
}
