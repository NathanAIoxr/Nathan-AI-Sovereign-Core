export const twinPairs=[["WILL","MILL"],["WHEEL","MHEEL"],["WAY","MAY"]] as const;
export type TwinWord=typeof twinPairs[number][number];
export const originalTriplet=["WILL","WHEEL","WAY"] as const;
export const mirrorTriplet=["MILL","MHEEL","MAY"] as const;
export function turnWtoM(word:string):string {return /^w/i.test(word)?(word[0]==="W"?"M":"m")+word.slice(1):word}
export function turnMtoW(word:string):string {return /^m/i.test(word)?(word[0]==="M"?"W":"w")+word.slice(1):word}
export function getTwin(word:string):string|null{
 const match=twinPairs.find(([w,m])=>w===word.toUpperCase()||m===word.toUpperCase());
 return match?(match[0]===word.toUpperCase()?match[1]:match[0]):null;
}
export function getAllModes(){
 return {individual:[...originalTriplet,...mirrorTriplet],twins:twinPairs.map(pair=>[...pair]),triplets:[[...originalTriplet],[...mirrorTriplet]],unified:[...originalTriplet,...mirrorTriplet]};
}
export function buildStoryBeats(){
 return [
 {concept:"MILL",action:"A mill grinds corn into grits",module:"grits-mill-simulator"},
 {concept:"MHEEL",action:"Knock knock. Who's there? My heel is stuck in the door!",module:"heel-door-puzzle"},
 {concept:"MAY",action:"May I? May showers, spring flowers and possibility",module:"may-permission-season"},
 ];
}
