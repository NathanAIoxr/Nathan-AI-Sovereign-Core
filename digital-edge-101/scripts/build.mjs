import { build } from "esbuild";
import { mkdir,copyFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
await mkdir("dist",{recursive:true});
execFileSync(process.env.EDGE_CARGO||"cargo",["build","--manifest-path","crates/thermal/Cargo.toml","--release","--target","wasm32-unknown-unknown"],{stdio:"inherit"});
await copyFile("crates/thermal/target/wasm32-unknown-unknown/release/digital_edge_thermal.wasm","dist/thermal.wasm");
await build({entryPoints:["workers/os-kernel-gateway/src/index.ts"],bundle:true,format:"esm",target:"es2023",
  external:["cloudflare:workers","./thermal.wasm"],outfile:"dist/index.js"});
