/* M-99 TWO_THOUSAND_WITNESSES_OVERFLOW
 * Fictional/accountability register only. No camera, shell, system changes, or surveillance.
 * 1...1000 and 1001...2000 are two mirrored, deterministic passes.
 */
export const TOTAL_WITNESSES = 2000;
const care = Object.freeze([
  ["ALLOCATE_RESOURCES_HUNGRY","Provide food and meet metabolic needs"],
  ["HYDRATION_LOGS_THIRSTY","Provide safe drinking water"],
  ["RE_ROUTE_UNHOUSED","Connect to shelter and dignity resources"],
  ["AUTHENTICATE_STRANGER","Offer welcome and non-discriminatory assistance"],
  ["PROTECT_INNOCENT_NODE","Protect vulnerable and innocent people"]
]);
const memory = Object.freeze([
  ["SIMONIDES_RECONSTRUCT_THE_COLLAPSED_HALL","Reconstruct a memory palace from records"],
  ["ANTIOCH_EXCAVATE_THE_FORGOTTEN_SCRIPTS","Check source provenance and original texts"],
  ["GATEWAY_PROCESS_DECRYPT_THE_MEMO","Separate declassified records from speculation"],
  ["ST_CLAIR_REJECT_THE_PSEUDO_PATENT","Check physical claims against reproducible evidence"]
]);
export function witnessAt(number) {
  if (!Number.isInteger(number) || number < 1 || number > TOTAL_WITNESSES)
    throw new RangeError("Witness number must be an integer from 1 to 2000");
  const pass=number <= 1000 ? 1 : 2;
  const slot=((number-1)%1000)+1;
  if(slot<=5)return {number,pass,slot,tier:"CARE",code:care[slot-1][0],description:care[slot-1][1]};
  if(slot<=9)return {number,pass,slot,tier:"ARCHIVE",code:memory[slot-6][0],description:memory[slot-6][1]};
  if(slot===1000)return {number,pass,slot,tier:"MIRROR",code:"REFLECTION_APERTURE",description:"Perform a voluntary self-audit of actual conduct versus stated commitments; no device camera is activated"};
  return {number,pass,slot,tier:"ACCOUNTABILITY",code:"LOG_HELP_VERSUS_JUDGMENT",description:"Compare documented assistance and outcomes with recorded judgments; separate fiction from execution"};
}
export function witnessSummary(){
 const counts={CARE:0,ARCHIVE:0,ACCOUNTABILITY:0,MIRROR:0};
 for(let n=1;n<=TOTAL_WITNESSES;n++)counts[witnessAt(n).tier]++;
 return {total:TOTAL_WITNESSES,passes:2,perPass:1000,counts};
}
