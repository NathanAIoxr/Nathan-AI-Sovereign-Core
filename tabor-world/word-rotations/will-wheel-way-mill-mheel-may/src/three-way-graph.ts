export const threeWayFamilies={W:["WILL","WHEEL","WAY"],M:["MILL","MHEEL","MAY"],THREE:["3ILL","3HEEL","3AY"]} as const;
export type DirectedLink={family:keyof typeof threeWayFamilies;from:string;to:string;kind:"self"|"directional"};
export function allDirectedLinks():DirectedLink[]{
 return (Object.entries(threeWayFamilies) as [keyof typeof threeWayFamilies,readonly string[]][]).flatMap(([family,nodes])=>
 nodes.flatMap(from=>nodes.map(to=>({family,from,to,kind:from===to?"self":"directional"}))));
}
export function linksFor(node:string):DirectedLink[]{return allDirectedLinks().filter(x=>x.from===node)}
export function validateThreeWay():boolean{
 const all=allDirectedLinks();
 return all.length===27&&all.filter(x=>x.kind==="self").length===9&&Object.values(threeWayFamilies).every(nodes=>nodes.every(n=>linksFor(n).length===3));
}
