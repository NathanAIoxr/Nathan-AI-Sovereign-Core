export const foundation = {
  title: "Tabor Academy Foundation",
  path: "/tabor-academy/institution/foundation/",
  statement: `If you don’t know truth, you don’t know True love because love without truth is tough love …

while love with truth is unconditional love

The motto, heart, soul, shadow, spirit, nothing and everything of Tabor Academy`,
};

export function foundationQuote(data) {
  const paragraphs = data.statement.split("\n\n").map(line => "<p>" + line + "</p>").join("");
  return "<blockquote>" + paragraphs + "</blockquote>";
}
