import assert from 'node:assert/strict';
import {test} from 'node:test';
import gate, {authorize} from './packages/shared/holding-gate.js';

const origin = 'https://holding.example';
const request = (path, init) => new Request(origin + path, init);
const env = {MOUNT_PATH:'/holding-vault', LAUNCH_STATUS:'HOLDING'};

test('holding routes disclose no registry data and do not query it', async () => {
  const response = await gate.fetch(request('/holding/private-project'), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /href="\/holding-vault\/preview"/);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('preview list and private objects require authorization', async () => {
  for (const path of ['/preview','/preview/project','/preview/project/assets/manuscript.pdf']) {
    assert.equal((await gate.fetch(request(path), env)).status, 401);
  }
  const forged = request('/preview',{headers:{'Cf-Access-Jwt-Assertion':'eyJhbGciOiJub25lIn0.e30.x'}});
  assert.equal((await gate.fetch(forged,{...env,ACCESS_ISSUER:'https://example.cloudflareaccess.com',ACCESS_AUDIENCE:'holding'})).status,401);
});

test('only explicitly live records on the assigned domain can leave holding', async () => {
  let row = {domain:'project.example',domain_status:'active',launch_status:'LIVE',public_url:'https://project.example/book'};
  const DB = {prepare:()=>({bind:()=>({first:async()=>row})})};
  const path = request('/holding/project');
  assert.equal((await gate.fetch(path,{...env,DB})).status,200);
  assert.equal((await gate.fetch(path,{...env,DB,LAUNCH_STATUS:'LIVE'})).headers.get('location'),row.public_url);
  row = {...row,public_url:'https://unrelated.example/book'};
  assert.equal((await gate.fetch(path,{...env,DB,LAUNCH_STATUS:'LIVE'})).status,200);
  row = {...row,public_url:'https://project.example/book',domain_status:'pending'};
  assert.equal((await gate.fetch(path,{...env,DB,LAUNCH_STATUS:'LIVE'})).status,200);
});

test('HTTP handling preserves the holding boundary', async () => {
  const head = await gate.fetch(request('/',{method:'HEAD'}),env);
  assert.equal(head.status,200);
  assert.equal(await head.text(),'');
  assert.equal((await gate.fetch(request('/preview',{method:'POST'}),env)).status,405);
  assert.equal((await gate.fetch(request('/unrecognized'),env)).status,404);
});

test('Access assertions must match signature, issuer, audience, and expiry', async () => {
  const algorithm = {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256', modulusLength:2048,publicExponent:new Uint8Array([1,0,1])};
  const keys = await crypto.subtle.generateKey(algorithm,true,['sign','verify']);
  const publicKey = {...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'test'};
  const settings = {ACCESS_ISSUER:'https://team.cloudflareaccess.com',ACCESS_AUDIENCE:'holding-preview'};
  const fetchKeys = async () => Response.json({keys:[publicKey]});
  const encoded = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const sign = async (claims) => {
    const message = encoded({alg:'RS256',kid:'test'}) + '.' + encoded(claims);
    const signature = await crypto.subtle.sign(algorithm, keys.privateKey,new TextEncoder().encode(message));
    return request('/preview',{headers:{'Cf-Access-Jwt-Assertion':message+'.'+Buffer.from(signature).toString('base64url')}});
  };
  const claims = {iss:settings.ACCESS_ISSUER,aud:[settings.ACCESS_AUDIENCE],sub:'owner',email:'owner@example.test',exp:Math.floor(Date.now()/1000)+300};
  assert.equal(await authorize(await sign(claims),settings,fetchKeys),true);
  assert.equal(await authorize(await sign({...claims,aud:['other']}),settings,fetchKeys),false);
  assert.equal(await authorize(await sign({...claims,exp:0}),settings,fetchKeys),false);
  assert.equal(await authorize(await sign({...claims,iss:'https://other.cloudflareaccess.com'}),settings,fetchKeys),false);
  assert.equal(await authorize(await sign(claims),settings,async()=>Response.json({keys:[]})),false);
});

test('component reads bind the workspace ID and paginate deterministically', async () => {
  const {readZoneComponents} = await import('./packages/shared/holding-gate.js');
  let args;
  const db = {prepare(statement){
    assert.match(statement,/WHERE workspace_id=\?/);
    return {bind(...values){
      args=values;
      return {all:async()=>({results:[{source_id:'first'},{source_id:'second'}]})};
    }};
  }};
  assert.deepEqual(await readZoneComponents(db,'project-a',1,0),{rows:[{source_id:'first'}],nextOffset:1});
  assert.deepEqual(args,['project-a',2,0]);
  await assert.rejects(readZoneComponents(db,'project-a/../project-b'));
});

test('snapshot downloads require owner authorization', async () => {
  const response = await gate.fetch(request('/preview/project-a/snapshot.json'),env);
  assert.equal(response.status,401);
  assert.equal(response.headers.get('cache-control'),'no-store');
});


test('private stand-in pages deny guest access', async () => {
  for (const path of ['/preview/project-a/site','/preview/project-a/site/part/example']) {
    const response = await gate.fetch(request(path),env);
    assert.equal(response.status,401);
    assert.equal(response.headers.get('cache-control'),'no-store');
  }
});

test('a stand-in site only selects components for its project', async () => {
  const {renderZoneSite} = await import('./packages/shared/holding-gate.js');
  const record = {workspace_id:'project-a',project_name:'Fixture <site>',launch_status:'HOLDING',domain:null};
  const DB = {prepare(sql) {
    assert.match(sql,/WHERE workspace_id=\?/);
    return {bind(id) {
      assert.equal(id,'project-a');
      return {
        first: async () => ({preview_hostname:'project-a.zones.test'}),
        all: async () => ({results:[{source_table:'fixture',source_id:'nested/path',component_type:'App build'}]})
      };
    }};
  }};
  const response = await renderZoneSite({DB},record,'/holding-vault');
  assert.equal(response.status,200);
  const html = await response.text();
  assert.match(html,/Fixture &lt;site&gt;/);
  assert.match(html,/project-a\.zones\.test/);
  assert.match(html,/\/holding-vault\/preview\/project-a\/site\/part\/[A-Za-z0-9_-]+/);
});
