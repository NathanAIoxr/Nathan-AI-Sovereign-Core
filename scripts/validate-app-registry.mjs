#!/usr/bin/env node
// Validate an independent-app registry without deploying or modifying infrastructure.
import fs from 'node:fs';
import path from 'node:path';
const filename=process.argv[2]||'orchestration/apps.json';
const raw=JSON.parse(fs.readFileSync(filename,'utf8'));
if(!Array.isArray(raw.apps)) throw Error('apps must be an array');
const seen=new Set(),targets=new Set();
for(const app of raw.apps){
  if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(app.id||'')) throw Error('invalid app id');
  if(seen.has(app.id)) throw Error('duplicate app id: '+app.id);
  seen.add(app.id);
  if(typeof app.source!=='string'||path.isAbsolute(app.source)||app.source.split(/[\\/]/).includes('..')) throw Error('unsafe source: '+app.id);
  if(!fs.existsSync(app.source)) throw Error('missing source: '+app.source);
  if(typeof app.target!=='string'||!['pages','worker','github-pages','none'].includes(app.target)) throw Error('invalid target: '+app.id);
  if(app.deployName){
    if(targets.has(app.target+':'+app.deployName)) throw Error('deployment collision: '+app.deployName);
    targets.add(app.target+':'+app.deployName);
  }
  if(app.enabled!==false && app.enabled!==true) throw Error('enabled must be boolean: '+app.id);
}
console.log('Validated '+raw.apps.length+' independent app entries; no deployment performed.');
