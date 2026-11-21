const escape = text => String(text).replace(/[&<>"']/g,value=>({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;",
})[value]);
const meta = (name,value) => `<meta property="${escape(name)}" content="${escape(value)}">`;

export async function lessonPreview(request,env,response) {
  const url = new URL(request.url);
  const code = url.searchParams.get("lesson") ?? "";
  if (request.method!=="GET" || response.status!==200 || url.pathname!=="/" ||
      !/^TA-\d{6}$/.test(code) || typeof HTMLRewriter!=="function") return response;
  const row = await env.DB.prepare(`SELECT id,item_a_label,item_b_label,clue_prompt FROM blueprint_lessons_v7
    WHERE id=? AND state=1`).bind(Number(code.slice(3))).first();
  if (!row) return response;
  const page = new URL("/?lesson="+code,url.origin).href;
  const title = row.item_a_label + " and " + row.item_b_label + " | Tabor Academy";
  const tags = meta("og:title",title)+meta("og:description",row.clue_prompt)+meta("og:url",page);
  return new HTMLRewriter().on("head",{element(head){head.append(tags,{html:true});}}).transform(response);
}
