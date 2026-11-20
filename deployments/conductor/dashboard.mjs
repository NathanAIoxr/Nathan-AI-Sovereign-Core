export const dashboard = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Conductor · Nathan AI</title>
<style>
:root{color-scheme:light dark}body{font:16px/1.55 system-ui,sans-serif;margin:3rem auto;max-width:50rem;padding:0 1.2rem}
h1{font-size:clamp(2.6rem,8vw,4.6rem);line-height:1;margin:.45rem 0 1.8rem}
label{display:block;margin:.8rem 0}input,button{font:inherit;padding:.55rem .75rem}input{max-width:100%;box-sizing:border-box}
button{margin:.3rem .3rem .3rem 0}article{padding:.8rem 0;border-top:1px solid GrayText}code{overflow-wrap:anywhere}
</style>
<main>
<p>Nathan AI</p><h1>The Conductor</h1>
<p id="health" aria-live="polite">Checking service health…</p>
<p><a href="/tabor-sites/sovereign-minds">Open Sovereign MINDs</a></p>
<p><a href="/tabor-sites/groundskeeper-ai">Open Groundskeeper AI</a></p>
<p><a href="/tabor-sites/conductor/handoffs/holiday">Holiday &amp; Spirit build handoff</a></p>
<p><a href="/tabor-sites/conductor/handoffs/sovereign-minds">Sovereign Minds handoff</a></p>
<p><a href="/tabor-sites/conductor/handoffs/cryptocurrency-mining">Cryptocurrency Mining handoff</a></p>
<p><a href="/tabor-sites/conductor/handoffs/tabor-academy-architecture-course">Tabor Academy · How to Operate in This World</a></p>
<section aria-label="Operator controls">
<label for="key">Operator key</label><input id="key" type="password" autocomplete="off" maxlength="512">
<div>
<button id="load">Load jobs</button><button id="verify">Verify Zeros and Ones</button>
<button id="deploy">Request deployment</button>
<button id="pause">Pause new work</button><button id="resume">Resume new work</button>
</div>
<p id="feedback" role="status"></p>
<div id="jobs"></div>
</section>
</main>
<script type="module" src="/tabor-sites/conductor/dashboard.mjs"></script></html>`;
