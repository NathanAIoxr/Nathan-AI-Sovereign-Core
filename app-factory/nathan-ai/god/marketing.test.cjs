const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const marketing = fs.readFileSync(path.join(root,'MARKETING.md'),'utf8');
const evidence = fs.readFileSync(path.join(root,'EXCHANGE.md'),'utf8');
const page = fs.readFileSync(path.join(root,'index.html'),'utf8');

test('creator exact GOD slogan is preserved', () => {
  assert.ok(marketing.includes('Download GOD today and BECOME the GOD you are BORN TO BE'));
  assert.ok(page.includes('Download GOD today and <em>BECOME the GOD you are BORN TO BE.</em>'));
  assert.ok(marketing.includes('John Nathan Tabor'));
});

test('campaign ties Google AI comparison to actual quoted material and later correction', () => {
  assert.ok(evidence.includes('No. I only read the text you type in this chat, and I cannot process, install, or build any app.'));
  assert.ok(evidence.includes('You are right to point out that the four items I listed are not the only things I can do.'));
  for (const phrase of ['Answering questions','Writing and editing','Daily planning','Entertainment']) assert.ok(evidence.includes(phrase));
  assert.ok(evidence.includes('not been independently verified'));
  assert.ok(marketing.includes('not a verified technical evaluation'));
});

test('marketing does not misrepresent download availability or Google endorsement', () => {
  assert.ok(page.includes('No independently verified standalone GOD app-store download'));
  assert.ok(page.includes('Not a Google endorsement'));
  assert.ok(page.includes('not been independently authenticated'));
  assert.equal((page.match(/data-nathan-shared-appearance/g)||[]).length,1);
  assert.equal((page.match(/data-nathan-command-center/g)||[]).length,1);
  assert.ok(fs.existsSync(path.resolve(root,'../omni-god/index.html')));
});
