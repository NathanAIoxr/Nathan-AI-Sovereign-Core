import { church, portraits, tally } from "./game.mjs";

export const templates = {
  amen: {headline:"AMEN AT 11:55. RANCH AT 12:10.", footer:"SUNDAY SHIFT • THE FIFTEEN-TOP", color:"#9c2d23"},
  gravy: {headline:"TWO LADLES. ONE GRAVY LEVEE.", footer:portraits.preacher.label.toUpperCase(), color:"#803b22"},
  cobbler: {headline:"COBBLER GOES ON THE RIM.", footer:portraits.wife.label.toUpperCase(), color:"#552338"},
  receipt: {headline:"THE RECEIPT GETS THE LAST WORD.", footer:"TWO PLATES EACH • ONE CHECK", color:"#293c36"}
};

export function cardId(value) {
  return Object.hasOwn(templates,value) ? value : "amen";
}

export function cardLink(url, card) {
  const target = new URL(url);
  target.search = "";
  target.searchParams.set("meme",cardId(card));
  target.hash = "memes";
  return target.href;
}

const usd = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
export function receiptCaption(gratuity) {
  return tally("preacher") + " + " + tally("wife") + " portions. Real tip: " + usd.format(gratuity / 100) + ".";
}

function wrap(ctx,text,width) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/u)) {
    const next = line ? line+" "+word : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(ctx,text,y,baseSize,heavy = true) {
  let size = baseSize;
  let lines;
  do {
    ctx.font = (heavy ? "bold " : "") + size + "px Georgia, serif";
    lines = wrap(ctx,text,740);
    if (lines.length <= 3 && lines.every(line => ctx.measureText(line).width <= 740)) break;
    size -= 4;
  } while (size > 18);
  for (const [index,line] of lines.entries()) ctx.fillText(line,450,y+index*(size+8),740);
}

function drawCard(canvas,card,text) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = card.color;
  ctx.fillRect(0,0,900,900);
  for (let row=0;row<3;row++) {
    for (let column=0;column<12;column++) {
      ctx.fillStyle = (row+column)%2 === 0 ? "#ffffff21" : "#28150f22";
      ctx.fillRect(column*75,332+row*75,75,75);
    }
  }
  const circle = (x,y,r,color) => {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  for (const [x,y] of [[333,441],[567,489]]) {
    circle(x,y,128,"#321b1d");
    circle(x,y,123,"#fff5df");
    circle(x,y,104,"#be5841");
    circle(x,y,98,"#fff5df");
    circle(x,y,84,"#e5ccad");
    for (const [dx,dy,r,color] of [[-34,-7,31,"#b86430"],[17,-28,33,"#d6a352"],[30,29,29,"#ae6b3e"],[-25,35,20,"#5f7549"]]) circle(x+dx,y+dy,r,color);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff6df";
  ctx.font = "bold 26px monospace";
  ctx.fillText("THE TWO-PLATE RECKONING",450,74,740);
  ctx.fillStyle = "#fff6df";
  textBlock(ctx,card.headline,168,66);
  textBlock(ctx,text,650,43,false);
  ctx.fillStyle = "#fff6df";
  ctx.font = "bold 22px monospace";
  ctx.fillText(card.footer,450,799,740);
  ctx.font = "19px monospace";
  ctx.fillText("NATHAN TABOR / NATHAN AI • FICTIONAL SATIRE",450,844,740);
}

if (typeof document !== "undefined") {
  const get = id => document.getElementById(id);
  const template = get("meme-template");
  const caption = get("meme-caption");
  const canvas = get("meme-preview");
  const status = get("meme-status");
  const share = get("share-meme");
  const save = get("save-meme");
  const fallback = get("meme-link");
  let revision = 0;
  let image;
  let gratuity = 720;
  template.value = cardId(new URL(location.href).searchParams.get("meme"));
  const url = () => cardLink(location.href,template.value);

  function render() {
    const current = ++revision;
    image = null;
    share.disabled = true;
    save.disabled = true;
    const card = templates[template.value];
    const defaultCaption = template.value === "receipt" ? receiptCaption(gratuity) : church;
    const punchline = caption.value.trim() || defaultCaption;
    drawCard(canvas,card,punchline);
    canvas.setAttribute("aria-label",card.headline+" "+punchline);
    canvas.toBlob(blob => {
      if (current !== revision || !blob) return;
      image = new File([blob],"two-plate-"+template.value+".png",{type:"image/png"});
      save.disabled = false;
      share.disabled = false;
    },"image/png");
    fallback.hidden = true;
  }
  template.addEventListener("change",render);
  caption.addEventListener("input",render);
  document.addEventListener("buffet:receipt",event => {
    gratuity = event.detail.gratuity;
    if (template.value === "receipt") render();
  });
  document.addEventListener("buffet:receipt-meme",() => {
    template.value = "receipt";
    caption.value = "";
    render();
  });
  save.addEventListener("click",() => {
    if (!image) return;
    const objectUrl = URL.createObjectURL(image);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = image.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl),1000);
    status.textContent = "Meme saved as a PNG.";
  });
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url());
      status.textContent = "Meme link copied.";
    } catch {
      fallback.value = url();
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      status.textContent = "Copy the link from the field below.";
    }
  }
  get("copy-meme-link").addEventListener("click",copyLink);
  share.addEventListener("click",async () => {
    if (!image) return;
    const link = url();
    const files = {files:[image]};
    try {
      if (navigator.canShare?.(files)) await navigator.share(files);
      else if (navigator.share) {
        const text = templates[template.value].headline + (caption.value.trim() ? " "+caption.value.trim() : "");
        await navigator.share({title:"The Two-Plate Reckoning",text,url:link});
      } else await copyLink();
    } catch (error) {
      if (error.name !== "AbortError") status.textContent = "Use Save PNG or Copy link to share this card.";
    }
  });
  render();
}
