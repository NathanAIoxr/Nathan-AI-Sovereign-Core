import {mkdir,writeFile} from "node:fs/promises";
import {dashboard,dashboardCsp} from "./src/site.mjs";

const worker="https://nathan-ai-sovereign-2x.nathantaboract.workers.dev";
await mkdir("dist",{recursive:true});
await writeFile("dist/index.html",dashboard(worker));
await writeFile("dist/vercel.json",JSON.stringify({cleanUrls:true,headers:[{source:"/(.*)",headers:[
  {key:"Content-Security-Policy",value:dashboardCsp(worker)},
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"}
]}]},null,2)+"\n");
