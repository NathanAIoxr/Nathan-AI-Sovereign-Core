export const rotationSymbols=["W","M","3"] as const;
export const rotationFamilies=[["WILL","WHEEL","WAY"],["MILL","MHEEL","MAY"],["3ILL","3HEEL","3AY"]] as const;
export type RotationSymbol=typeof rotationSymbols[number];
export function rotateSymbol(word:string,steps=1):string{
 if(!word)throw new RangeError("word required");
 const index=rotationSymbols.indexOf(word[0].toUpperCase() as RotationSymbol);
 if(index<0)return word;
 const next=rotationSymbols[((index+((steps%3)+3)%3)%3)];
 return (word[0]===word[0].toLowerCase()&&word[0]!=="3"?next.toLowerCase():next)+word.slice(1);
}
export function rotationCycle(word:string):string[]{return [word,rotateSymbol(word,1),rotateSymbol(word,2)]}
export function nineNodes():string[]{return rotationFamilies.flatMap(x=>[...x])}
export const threeNodes={
 "3ILL":{role:"three-ills",children:["ill-one","ill-two","ill-three"]},
 "3HEEL":{role:"three-feet",children:["heel-one","heel-two","heel-three"]},
 "3AY":{role:"sup-head",children:["thug","pirate","spartan"],parent:"SUP"}
} as const;
