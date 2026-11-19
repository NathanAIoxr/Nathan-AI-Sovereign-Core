import { featuredLetters } from "./public/common/corpus.mjs";
import { findEntries } from "./public/common/tools.mjs";

const [letter, ...keywords] = process.argv.slice(2);
if (!letter || letter === "--help") {
  console.log("Usage: node cli.mjs <letter|all> [search words]");
} else if (letter.toLowerCase() !== "all" && !featuredLetters.includes(letter.toUpperCase())) {
  console.error("Choose " + featuredLetters.join(", ") + ", or all.");
  process.exitCode = 2;
} else {
  console.log(JSON.stringify(findEntries(keywords.join(" "), letter.toLowerCase() === "all" ? "" : letter), null, 2));
}
