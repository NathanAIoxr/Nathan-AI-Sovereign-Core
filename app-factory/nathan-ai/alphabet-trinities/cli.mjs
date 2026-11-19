import { findEntries } from "./public/common/tools.mjs";

const [letter, ...keywords] = process.argv.slice(2);
if (!letter || letter === "--help") {
  console.log("Usage: node cli.mjs <A|B|C|T|V|all> [search words]");
} else if (!["a", "b", "c", "t", "v", "all"].includes(letter.toLowerCase())) {
  console.error("Choose A, B, C, T, V, or all.");
  process.exitCode = 2;
} else {
  console.log(JSON.stringify(findEntries(keywords.join(" "), letter.toLowerCase() === "all" ? "" : letter), null, 2));
}
