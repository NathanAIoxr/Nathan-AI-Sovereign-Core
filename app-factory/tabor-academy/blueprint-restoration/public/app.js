let investigativeMode = false;
let selectedTier = "";
const root = document.getElementById("lessons");
const toggle = document.getElementById("mode");
const tierSelect = document.getElementById("tier");
const apiOrigin = document.querySelector('meta[name="worker-origin"]')?.content || location.origin;
const answerColumns = ["core_parts","operations","traits_attributes","scale_medium","input_output","flow_direction","modification_exemption","blind_spot_note"];
async function render() {
 const params = new URLSearchParams();
 if (investigativeMode) params.set("investigative","true");
 if (selectedTier) params.set("tier",selectedTier);
 root.replaceChildren();
 try {
  const response = await fetch(apiOrigin + "/api/lessons?" + params.toString());
  if (!response.ok) throw new Error("API returned " + response.status);
  const data = await response.json();
  for (const lesson of data.lessons) {
   const article = document.createElement("article");
   const heading = document.createElement("h2");
   heading.textContent = lesson.id + ". " + lesson.item_a_label + " vs. " + lesson.item_b_label + (lesson.item_c_label ? " vs. " + lesson.item_c_label : "");
   article.append(heading);
   const clue = document.createElement("p");
   clue.textContent = lesson.clue_prompt;
   article.append(clue);
   if (!investigativeMode) for (const key of answerColumns) {
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = key.replaceAll("_"," ") + ": ";
    p.append(strong, document.createTextNode(lesson[key] ?? "N/A"));
    article.append(p);
   }
   root.append(article);
  }
 } catch(e) { root.textContent = "Unable to load lessons: " + e.message; }
}
toggle.addEventListener("change",e=>{investigativeMode=e.target.checked;render()});
tierSelect.addEventListener("change",e=>{selectedTier=e.target.value;render()});
render();