const MAX=10000;
function checked(value){if(typeof value!=='string'||value.length>MAX)throw new RangeError('input must be a string of at most 10000 UTF-16 code units');return value;}
const rtl=/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/u;
const ltr=/[A-Za-z\u00C0-\u02AF\u0370-\u052F]/u;
export function detectScriptDirection(value){const input=checked(value);let left=0,right=0;for(const char of input){if(rtl.test(char))right++;else if(ltr.test(char))left++;}return {direction:right&&left?'mixed':right?'rtl':left?'ltr':'neutral',rtlCharacters:right,ltrCharacters:left};}
const pairs=new Map([['to',['too','two']],['too',['to','two']],['two',['to','too']],['their',['there',"they're"]],['there',['their',"they're"]],["they're",['their','there']],['your',["you're"]],["you're",['your']],['its',["it's"]],["it's",['its']]]);
export function homophoneCandidates(value){const input=checked(value);const tokens=input.match(/[\p{L}]+(?:['’][\p{L}]+)*/gu)||[];return {tokens:tokens.map((token,index)=>({index,token,candidates:pairs.get(token.toLowerCase().replace('’',"'"))||[]})),note:'Candidate alternatives only; context is not automatically resolved'};}
