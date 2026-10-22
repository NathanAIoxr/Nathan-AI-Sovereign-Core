/* THE NATHAN TABOR HALL OF MIRRORS — 5,000,000 logical mirror addresses.
   Defensive, simulated aliases, NOT five million deployed proxy servers.
   Dewey-style coordinates are owner-defined, not official DDC numbers.
   Mirrors are reversible PRESENTATIONS of an original, NOT cryptography.
 */
(function(root,build){'use strict';const api=build();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaborHallOfMirrors=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const MIRRORS=5000000,DIGITS='0123456789↊↋',CATEGORIES={1:'394.261',2:'394.262',3:'394.263',4:'394.264'};
const NAMES=[
'Christmas','Noël','Navidad','Natale','Weihnachten','Kerstmis','Jul','Joulu','Natal','Crăciun',
'Bože Narodzenie','Vánoce','Vianoce','Karácsony','Božić','Kalėdos','Ziemassvētki','Jõulud','Christougenna','Nollaig',
'Nadolig','Nollaig','Yn Chreest','Nadeleg','Jól','Rozhdestvo','Rizdvo','Kaleda','Milad','Eid al-Milad',
'Krisen','Kurisumasu','Seongtanjeol','Shengdanjie','Pasku','Pasko','Noel','Krismas','Bada Din','Noel',
'Krismasi','Sikukuu ya Krismasi','Kisimusi','Kerisimasi','Kiritimati','Kirihimete','Quadian','Genna','Ganna','Kristosa',
'Cristesmaesse','Cristes-masse','Chrystenmas','Christmass','Yule','Cristesmesse','Noelz'];
function toDuo(n){if(!Number.isSafeInteger(n)||n<0)throw Error('Expected nonnegative integer');if(n===0)return '0';let s='';while(n){s=DIGITS[n%12]+s;n=Math.floor(n/12)}return s}
function fromDuo(s){if(typeof s!=='string'||!s||!/^[0-9↊↋]+$/u.test(s))throw Error('Invalid base-12 address');let n=0;for(const c of s){n=n*12+DIGITS.indexOf(c);if(!Number.isSafeInteger(n))throw Error('Base-12 address overflow')}return n}
function phase(id){return id<=25?1:id<=50?2:id<=75?3:4}
function address(id){if(!Number.isInteger(id)||id<1||id>101)throw Error('Registry ID is 1 through 101');return {decimal:String(id).padStart(3,'0'),dewey:CATEGORIES[phase(id)]+'.'+String(id).padStart(3,'0'),duodecimal:toDuo(id),phase:phase(id)}}
const registry=Object.freeze(Array.from({length:101},(_,i)=>{const id=i+1;return Object.freeze({id,...address(id),token:NAMES[i]||null,status:i<57?'author-supplied':'reserved — source not supplied',rawSourceId:'christmas-matrix-'+String(id).padStart(3,'0')})}));
const flip=Object.freeze({'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ᴉ','j':'ɾ','k':'ʞ','l':'l','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z','A':'∀','C':'Ɔ','E':'Ǝ','F':'Ⅎ','H':'H','I':'I','L':'˥','M':'W','O':'O','P':'Ԁ','R':'ᴚ','T':'┴','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'ㄥ','8':'8','9':'6','0':'0'});
function reverseCharacters(s){return Array.from(String(s)).reverse().join('')}
function upsideDown(s){return Array.from(String(s)).reverse().map(c=>flip[c]||c).join('')}
function presentations(original){if(typeof original!=='string')throw Error('Original must be text');return Object.freeze({original,forward:original,backward:reverseCharacters(original),upsideDown:upsideDown(original),note:'Display transforms only. Original untouched. Not encryption.'})}
function mirrorId(index){if(!Number.isSafeInteger(index)||index<0||index>=MIRRORS)throw Error('Mirror index outside 5 million logical slots');return 'M-'+String(index+1).padStart(7,'0')+'-'+toDuo(index+1)}
function classify(event){const s=String(event||'').slice(0,2048);const checks=[{rule:/\brm\s+-rf\b/i,code:'destructive-command'},{rule:/\b(?:curl|wget)\s+[^\n]*\|\s*(?:sh|bash)\b/i,code:'remote-script-pipe'},{rule:/\b(?:nc|ncat)\s+-e\b/i,code:'reverse-shell-indicator'},{rule:/\b(?:\/bin\/sh|exec\s*\()\b/i,code:'shell-execution-indicator'}];const matched=checks.filter(x=>x.rule.test(s)).map(x=>x.code);return Object.freeze({detected:matched.length>0,reasons:matched,action:matched.length?'quarantine-in-isolated-decoy-and-alert':'observe',boundary:'No outbound retaliation; no firewall changes until authorized by separate enforcement service.'})}
async function digest(bytes){if(!globalThis.crypto?.subtle)throw Error('SHA-256 unavailable');const source=bytes instanceof Uint8Array?bytes:new TextEncoder().encode(String(bytes));const arr=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',source));return Array.from(arr).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function fingerprint(){return digest(JSON.stringify(registry))}
return Object.freeze({MIRRORS,DIGITS,NAMES,registry,address,toDuo,fromDuo,mirrorId,presentations,classify,digest,fingerprint});
});
