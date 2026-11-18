import { endpoint, readJson, RequestError } from "./shared.mjs";

const textField = (value, length) => typeof value === "string" && value.length <= length && /^[\x20-\x7e]+$/.test(value);
const money = cents => `USD ${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;

function singlePagePdf(stream) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  return pdf + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}

export default endpoint(77, async (request, url) => {
  if (request.method !== "POST" || url.pathname !== "/invoice") return;
  const { number, issuer, customer, items } = await readJson(request, 16 * 1024);
  if (!textField(number, 36) || !textField(issuer, 58) || !textField(customer, 58) || !Array.isArray(items) || items.length < 1 || items.length > 20 ||
      items.some(item => !item || !textField(item.description, 34) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999 ||
      !Number.isInteger(item.unit_cents) || item.unit_cents < 0 || item.unit_cents > 1_000_000_000)) throw new RequestError("invalid_invoice");
  const commands = ["0.1 0.14 0.2 rg"];
  const label = (text, x, y, size = 11, bold = false) => {
    const escaped = text.replace(/[\\()]/g, character => "\\" + character);
    commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escaped}) Tj ET`);
  };
  label(`Invoice ${number}`, 48, 730, 22, true);
  label(`From: ${issuer}`, 48, 698);
  label(`Bill to: ${customer}`, 48, 674);
  label("Item", 48, 633, 11, true);
  label("Qty", 288, 633, 11, true);
  label("Unit price", 347, 633, 11, true);
  label("Amount", 465, 633, 11, true);
  let y = 608;
  let total = 0;
  for (const item of items) {
    const line = item.quantity * item.unit_cents;
    total += line;
    label(item.description, 48, y);
    label(String(item.quantity), 288, y);
    label(money(item.unit_cents), 347, y, 10);
    label(money(line), 465, y, 10);
    y -= 20;
  }
  label(`Total: ${money(total)}`, 360, y - 18, 13, true);
  return new Response(singlePagePdf(commands.join("\n") + "\n"), { headers: {
    "content-type": "application/pdf", "content-disposition": "attachment; filename=invoice.pdf",
    "cache-control": "no-store", "x-content-type-options": "nosniff",
  } });
});
