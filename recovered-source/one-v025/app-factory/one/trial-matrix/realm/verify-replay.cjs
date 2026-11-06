#!/usr/bin/env node
'use strict';
/* Headless verifier for a trusted battle config plus an untrusted action log.
   Production must supply roster/config from its own authoritative database. */
const fs=require('node:fs'),crypto=require('node:crypto'),{isDeepStrictEqual}=require('node:util'),combat=require('./combat.js');
try{
 const input=fs.readFileSync(0,'utf8');if(Buffer.byteLength(input)>1024*1024)throw Error('Replay exceeds 1 MB');
 const data=JSON.parse(input),state=combat.replay(data.config,data.actions);
 if(data.claimedState&&!isDeepStrictEqual(state,combat.validate(data.claimedState)))throw Error('Claimed result does not match deterministic replay');
 process.stdout.write(JSON.stringify({schema:'one.v025.realm.verified.v1',verified:true,rules:'realm-v1',sha256:crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex'),state})+'\n');
}catch(error){process.stderr.write('Replay rejected: '+error.message+'\n');process.exitCode=1;}
