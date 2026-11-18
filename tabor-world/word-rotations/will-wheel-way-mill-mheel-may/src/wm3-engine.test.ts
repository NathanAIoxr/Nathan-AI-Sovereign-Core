import {rotateSymbol,rotationCycle,nineNodes,threeNodes} from "./wm3-engine";
for(const [w,m,three] of [["WILL","MILL","3ILL"],["WHEEL","MHEEL","3HEEL"],["WAY","MAY","3AY"]]){
 if(rotateSymbol(w)!==m||rotateSymbol(m)!==three||rotateSymbol(three)!==w)throw new Error("three-way rotation failed");
 if(rotationCycle(w).join("|")!==[w,m,three].join("|"))throw new Error("cycle failed");
 if(rotateSymbol(w,-1)!==three)throw new Error("reverse rotation failed");
}
if(nineNodes().length!==9||threeNodes["3AY"].children.join(",")!=="thug,pirate,spartan")throw new Error("node model failed");
console.log("W/M/3 triple-triplet tests passed");
