import {readdir, readFile, writeFile} from "node:fs/promises";
import {build as buildV7} from "../tabor-universal-library-engine/build.mjs";
const root = new URL("../../", import.meta.url);
const tracker = "app-factory/tabor-tracker-ball/public/";
const paths = [
  ...(await readdir(new URL(tracker, root))).map(name => tracker + name),
  "app-factory/games/dual-screen-arcade/index.html",
  ...["surface.mjs", "surface.css", "ant-farm.mjs", "bus.mjs", "hive.mjs", "library.mjs", "registry.mjs", "vault.mjs"]
    .map(name => "app-factory/tabor-hive/" + name),
  "standalone-apps/tactilecore-sdk/src/engine.mjs",
  "standalone-apps/tactilecore-sdk/LICENSE.md",
  "standalone-apps/hook-and-ring/game/input.mjs",
  "standalone-apps/hook-and-ring/game/physics.mjs",
];
const ownAssets = Object.fromEntries(await Promise.all(paths.map(async path => [
  "/" + path, await readFile(new URL(path, root), "utf8"),
])));
const {assets: v7Assets} = await buildV7();
const assets = {...v7Assets, ...ownAssets};
await writeFile(new URL("asset-bundle.mjs", import.meta.url), "export default " + JSON.stringify(assets) + ";\n");
