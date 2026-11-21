export const fourFamilies={
 W:["WILL","WHEEL","WAY"],
 M:["MILL","MHEEL","MAY"],
 THREE:["3ILL","3HEEL","3AY"],
 STACKED:["<<ILL","<<HEEL","<<AY"]
} as const;
export function mToStacked(word:string):string{return /^m/i.test(word)?"<<"+word.slice(1):word}
export function stackedToM(word:string):string{return word.startsWith("<<")?"M"+word.slice(2):word}
export function familyEdges(){return Object.entries(fourFamilies).flatMap(([family,nodes])=>nodes.flatMap(from=>nodes.map(to=>({family,from,to,self:from===to}))))}
export function allFourFamilyNodes(){return Object.values(fourFamilies).flatMap(nodes=>[...nodes])}
export const stackedGlyph={token:"<<",geometry:"vertical-double-left-chevron"} as const;
