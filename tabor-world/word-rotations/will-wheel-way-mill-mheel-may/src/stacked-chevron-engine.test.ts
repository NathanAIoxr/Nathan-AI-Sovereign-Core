import {mToStacked,stackedToM,familyEdges,allFourFamilyNodes} from "./stacked-chevron-engine";
for(const [m,stacked] of [["MILL","<<ILL"],["MHEEL","<<HEEL"],["MAY","<<AY"]])if(mToStacked(m)!==stacked||stackedToM(stacked)!==m)throw new Error("stacked transformation failed");
const e=familyEdges();if(e.length!==36||e.filter(x=>x.self).length!==12||allFourFamilyNodes().length!==12)throw new Error("four-family graph failed");
console.log("four-family stacked-chevron mapping passed");
