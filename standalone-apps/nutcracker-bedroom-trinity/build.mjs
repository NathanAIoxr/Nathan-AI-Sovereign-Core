import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const fromRoot = (relativePath) => new URL(relativePath, import.meta.url);
const productIds = ["solomon", "cleopatra", "virgin-mary"];
const requestedId = process.argv[2];
if (requestedId && !productIds.includes(requestedId)) {
  throw new Error(`Unknown product: ${requestedId}`);
}

const [runtime, css, materialStudy, serif, ...products] = await Promise.all([
  readFile(fromRoot("src/site.mjs"), "utf8"),
  readFile(fromRoot("src/site.css"), "utf8"),
  readFile(fromRoot("assets/silicone-material-study.webp"), "base64"),
  readFile(fromRoot("assets/instrument-serif.woff2"), "base64"),
  ...productIds.map(async (id) => JSON.parse(await readFile(fromRoot(`products/${id}.json`), "utf8")))
]);

const outputDirectory = process.env.NUTCRACKER_BUILD_DIRECTORY;
const output = outputDirectory ? pathToFileURL(resolve(outputDirectory) + sep) : fromRoot("dist/");
await mkdir(output, { recursive: true });

for (const [index, id] of productIds.entries()) {
  if (requestedId && id !== requestedId) continue;
  const product = products[index];
  const others = products.filter((_, otherIndex) => otherIndex !== index)
    .map(({ name, worker }) => ({ name, worker }));
  const conceptImage = await readFile(fromRoot(`assets/${id}-concept.webp`), "base64");
  const revision = createHash("sha256").update(css).update(materialStudy).update(conceptImage).digest("hex").slice(0, 12);
  const data = JSON.stringify({ product, others, css, revision });
  const module = `${runtime}
const settings = ${data};
settings.materialStudy = Uint8Array.from(atob(${JSON.stringify(materialStudy)}), (character) => character.charCodeAt(0));
settings.conceptImage = Uint8Array.from(atob(${JSON.stringify(conceptImage)}), (character) => character.charCodeAt(0));
settings.serif = Uint8Array.from(atob(${JSON.stringify(serif)}), (character) => character.charCodeAt(0));
export default createSite(settings);
`;
  const destination = new URL(`${product.worker}.mjs`, output);
  await writeFile(destination, module);
  console.log(fileURLToPath(destination));
}
