'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('./network-policy.js');
const engine = require('./engine.js');
const originalRegistry = JSON.parse(fs.readFileSync(path.join(__dirname,'registry.json'),'utf8'));
const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const ui = fs.readFileSync(path.join(__dirname,'network.js'),'utf8');

const LAN = { protocol:'http:', hostname:'192.168.1.24',
  pathname:policy.LOCAL_APP_PATH+'index.html', connectionType:'wifi',online:true };
const CELL = { protocol:'https:',hostname:'nathanaioxr.github.io',
  pathname:policy.APP_PATH+'index.html', connectionType:'cellular',online:true };

test('Wi-Fi only is the hard default, cellular is a separate opt-in', () => {
  assert.equal(policy.DEFAULT_MODE,'wifi-only');
  assert.deepEqual(Object.values(policy.MODES),['wifi-only','cellular-wifi']);
  assert.equal((html.match(/data-network-mode="wifi-only"/g)||[]).length,1);
  assert.equal((html.match(/data-network-mode="cellular-wifi"/g)||[]).length,1);
  assert.match(html,/WI-FI ONLY \(default\)/);
  assert.match(html,/id="network-execute"/);
  assert.match(html,/id="network-emergency"/);
  assert.ok(html.indexOf('network-policy.js')<html.indexOf('network.js'));
});

test('private LAN and known HTTPS host are distinct', () => {
  for(const host of ['localhost','127.0.0.1','192.168.1.24','10.5.6.7','172.16.1.4','172.31.99.88']) {
    assert.equal(policy.isPrivateHost(host),true,host);
  }
  for(const host of ['172.32.2.3','8.8.8.8','google.com','nathanaioxr.github.io','1.1.1.1']) {
    assert.equal(policy.isPrivateHost(host),false,host);
  }
  assert.equal(policy.classify(CELL).published,true);
  assert.equal(policy.classify(LAN).ownHost,true);
});

test('wifi mode restricts registry checks to own private app host', () => {
  assert.equal(policy.permitReadOnlyCheck('wifi-only',LAN).allowed,true);
  assert.equal(policy.permitReadOnlyCheck('wifi-only',CELL).allowed,false);
  assert.equal(policy.permitReadOnlyCheck('wifi-only',{...LAN,connectionType:'cellular'}).allowed,false);
  assert.equal(policy.permitReadOnlyCheck('wifi-only',{...LAN,online:false}).allowed,false);
  assert.equal(policy.permitReadOnlyCheck('wifi-only',{...LAN,connectionType:'unknown'}).allowed,true);
  assert.match(policy.permitReadOnlyCheck('wifi-only',{...LAN,connectionType:'unknown'}).reason,/cannot be guaranteed/);
});

test('cellular opt-in only permits known HTTPS host or trusted non-cellular LAN', () => {
  assert.equal(policy.permitReadOnlyCheck('cellular-wifi',CELL).allowed,true);
  assert.equal(policy.permitReadOnlyCheck('cellular-wifi',LAN).allowed,true);
  assert.equal(policy.permitReadOnlyCheck('cellular-wifi',{...CELL,protocol:'http:'}).allowed,false);
  assert.equal(policy.permitReadOnlyCheck('cellular-wifi',{...CELL,hostname:'example.com'}).allowed,false);
  assert.equal(policy.permitReadOnlyCheck('cellular-wifi',{...LAN,connectionType:'cellular'}).allowed,false);
  assert.throws(()=>policy.permitReadOnlyCheck('anywhere',CELL),/Unsupported/);
});

test('connection speed labels are not interpreted as cellular radio types', () => {
  assert.equal(policy.classify({...LAN,connectionType:'4g'}).networkType,'unknown');
  assert.equal(policy.classify({...LAN,connectionType:'5g'}).networkType,'unknown');
  assert.equal(policy.classify({...LAN,connectionType:'wifi'}).networkType,'local-link');
});

test('RUN executes deterministic local logic and allocates only 20 virtual labels', () => {
  const result = policy.localVerification(engine,originalRegistry);
  assert.equal(result.passed,true);
  assert.equal(result.realDevicesActivated,0);
  assert.equal(result.remoteJobsStarted,0);
  assert.equal(result.checkedVirtualPositions,20);
  assert.ok(Object.values(result.invariants).every(Boolean));
});

test('network action is only an explicit same-origin read-only HEAD; emergency cancels', () => {
  assert.match(ui,/addEventListener\('click', async/);
  assert.match(ui,/method:'HEAD'/);
  assert.match(ui,/fetch\('\.\/registry\.json'/);
  assert.match(ui,/credentials:'omit'/);
  assert.match(ui,/new AbortController\(\)/);
  assert.match(ui,/emergency\.addEventListener\('click'/);
  assert.doesNotMatch(ui,/\bWebSocket\b|XMLHttpRequest|navigator\.sendBeacon|method:\s*'POST'/);
});

test('gateway preserves entire original taxonomy instead of replacing it', () => {
  assert.deepEqual(Object.values(originalRegistry.categories).map(x=>x.length),[9,6,9]);
  assert.deepEqual(originalRegistry.node_tiers.map(x=>x.count),[69696969,696,969]);
});
