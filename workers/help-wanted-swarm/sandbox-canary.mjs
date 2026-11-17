
import {mkdtempSync, writeFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
const dir=mkdtempSync(join(tmpdir(),"absolute-intelligence-"));
try {
  writeFileSync(join(dir,"repair.mjs"),"__HIVE_REPAIR_MODULE__");
  writeFileSync(join(dir,"repair.test.mjs"),"__HIVE_TEST_MODULE__");
  const r=spawnSync(process.execPath,["--test","repair.test.mjs"],{cwd:dir,encoding:"utf8",timeout:18000,maxBuffer:65536});
  process.stdout.write(JSON.stringify({runtime:process.version,platform:process.platform,command:"node --test repair.test.mjs",exitCode:r.status,stdout:r.stdout??"",stderr:r.stderr??"",error:r.error?.message??null}));
  process.exitCode=r.status??1;
} finally { rmSync(dir,{recursive:true,force:true}); }
