import {base12} from './index.mjs';
export const externalTargets=['BTC','ALPH','QUAI','IRON','DNX','NEXA','PYI','CLORE','NEOX','RXD','MEWC','QUBIC','ZEPH','SPR','VRSC','RTM','EPIC','DERO','XLA','XMR','SFX','TAO','INI','PHA','ACA','FLUX'];
export function overlay({bankSlots=69,originalCoins=[],external=externalTargets}={}){
 if(bankSlots!==69)throw Error('Tabor Bank is 69 positions');
 const slots=Array.from({length:69},(_,i)=>({project:'tabor-bank-of-69',position:i+1,duodecimal:base12(i+1),dewey:'330',identityStatus:i<64?'SOURCE_RECONCILIATION_REQUIRED':'RESERVED_UNNAMED',mode:'HOLD'}));
 const original=originalCoins.map(c=>({project:'sovereign-coins',position:c.number,duodecimal:base12(c.number),dewey:'330',ticker:c.ticker,name:c.name,designUnits:c.initial_design_units??0,mode:'HOLD'}));
 const networks=external.map((ticker,i)=>({project:'external-network-research',position:i+1,duodecimal:base12(i+1),dewey:'332',ticker,mode:'RESEARCH_ONLY'}));
 return {schema:'nathan-ai.coin-overlay.v1',slots,original,networks,metadata:{bankSlots:slots.length,originalCoins:original.length,externalNetworks:networks.length,merges:0}};
}
