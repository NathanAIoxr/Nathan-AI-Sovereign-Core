'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const shared = path.resolve(__dirname);
const gamePages = [
  "games/blackjack-life/index.html",
  "games/crowning-jewel.html",
  "games/paradox-118/index.html",
  "middle-c/index.html",
  "octopus-root/octopus-arsenal/index.html",
  "game-reference-lab/zero-void-lab.html",
  "universal-node/babel-inferno.html",
  "nathan-ai/universal-tools/arrowhead-tree.html",
  "nathan-ai/universal-tools/index.html",
  "nathan-ai/mind-neuropath/index.html",
  "stewie-mr-finn/polar-middle-c/index.html",
  "stewie-mr-finn/polar-middle-c/math-roots/index.html",
  "stewie-mr-finn/polar-middle-c/mirror-bridge/index.html",
  "creative/dummie/index.html",
  "octopus-root/uct/triple-code/index.html",
  "one/hey-you-total-eclipse/explorer/index.html",
  "one/trials/index.html",
  "one/trial-matrix/index.html",
  "historical-sports/index.html"
];
function text(file) { return fs.readFileSync(file, 'utf8'); }
function relativeLinks(file, match) {
 const html = text(file);
 return [...html.matchAll(match)].map(x=>x[1]).filter(x=>!x.startsWith('#')&&!/^[a-z][a-z0-9+.-]*:/i.test(x));
}
test('desktop support JS and CSS parse and provide key interaction controls', () => {
 const js = text(path.join(shared, 'desktop-game-support.js'));
 const css = text(path.join(shared, 'desktop-game-support.css'));
 assert.doesNotThrow(()=>new vm.Script(js));
 for(const token of ['requestFullscreen','fullscreenchange','Focus gameplay','Keyboard & mouse help','addEventListener','aria-label','?','Escape'])assert.ok(js.includes(token),token);
 assert.match(css,/canvas,html\.nathan-desktop-game img/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
});
test('all selected public game pages include exactly one shared desktop layer', () => {
 for(const page of gamePages){
  const file=path.join(root,page);
  assert.ok(fs.existsSync(file),page);
  const html=text(file);
  assert.equal((html.match(/desktop-game-support\.js/g)||[]).length,1,page+' has one script');
  assert.equal((html.match(/desktop-game-support\.css/g)||[]).length,1,page+' has one CSS');
  assert.match(html,/<meta name="viewport"/i,page+' is viewport responsive');
  assert.ok(/<\/html>/i.test(html),page+' is complete');
  const scriptUrls=relativeLinks(file,/<script[^>]+src=["']([^"']+)["']/gi).filter(x=>x.includes('desktop-game-support'));
  const cssUrls=relativeLinks(file,/<link[^>]+href=["']([^"']+\.css)["']/gi).filter(x=>x.includes('desktop-game-support'));
  for(const url of [...scriptUrls,...cssUrls]){
    const target=path.resolve(path.dirname(file),url.split('?')[0]);
    assert.ok(fs.existsSync(target),page+' resolves desktop asset '+url);
  }
 }
});
test('Octopus Arsenal does not steal Space key from focused buttons, links or fields', () => {
 const js=text(path.join(root,'octopus-root/octopus-arsenal/app.js'));
 assert.match(js,/event\.defaultPrevented/);
 assert.match(js,/focused\?\.isContentEditable/);
 assert.match(js,/['"]BUTTON['"]/);
 assert.match(js,/['"]A['"]/);
 assert.match(js,/['"]INPUT['"]/);
 assert.match(js,/['"]TEXTAREA['"]/);
 assert.match(js,/event\.code==='Space'/);
});
test('all game entry points retain their original script engine references', () => {
 const expectations=[
 ['games/blackjack-life/index.html','engine.js'],
 ['games/crowning-jewel.html','crowning-jewel.js'],
 ['games/paradox-118/index.html','engine.js'],
 ['octopus-root/octopus-arsenal/index.html','app.js'],
 ['middle-c/index.html','game.js'],
 ['nathan-ai/mind-neuropath/index.html','matrix.js'],
 ['universal-node/babel-inferno.html','babel-game.js']
 ];
 for(const [file,engine] of expectations)assert.ok(text(path.join(root,file)).includes(engine),file+' keeps '+engine);
});
