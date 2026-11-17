import {copyFile} from 'node:fs/promises';
await copyFile(new URL('./core.mjs',import.meta.url),new URL('./public/one-core.mjs',import.meta.url));
console.log('Updated the public shared contract module');
