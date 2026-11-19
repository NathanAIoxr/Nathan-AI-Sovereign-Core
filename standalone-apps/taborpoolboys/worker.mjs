import { createTaborApp } from '../tabor-app-runtime/worker.mjs';

export default createTaborApp({
  "id": "taborpoolboys",
  "title": "TaborPoolBoys",
  "worker": "taborpoolboys-app",
  "url": "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/taborpoolboys/",
  "description": "Browse three editorial covers, pick an edition and save an issue.",
  "mark": "PB",
  "theme": "#241514",
  "paper": "#fff0df",
  "panel": "#37201d",
  "accent": "#f4ba76",
  "muted": "#e1c8bb",
  "short": "TaborPoolBoys",
  "version": "2026-11-19.1",
  "editions": [
    {
      "id": "first",
      "label": "First Edition",
      "date": "01",
      "title": "TaborPoolBoys",
      "subtitle": "TABORBOY and TABORPOOL as one",
      "palette": "first"
    },
    {
      "id": "broadsheet",
      "label": "Broadsheet Edition",
      "date": "02",
      "title": "TaborPoolBoys",
      "subtitle": "From the pool to the page",
      "palette": "broadsheet"
    },
    {
      "id": "christmas",
      "label": "Christmas Edition",
      "date": "03",
      "title": "TaborPoolBoys",
      "subtitle": "Christmas issue",
      "palette": "christmas"
    }
  ]
});
