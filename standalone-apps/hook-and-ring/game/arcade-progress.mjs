import { STAGES } from './grapple.mjs?v=9';
import { SKINS } from './physics.mjs';
import { EVENTS } from './precision.mjs';
import { NATHAN_NAME } from './opponent.mjs';

const validCount=value=>Number.isSafeInteger(value)&&value>0;
export function arcadeProgress(profile={}, records={}, eventRecords=[]) {
  const catches=validCount(profile?.catches)?profile.catches:0;
  const cleared=STAGES.reduce((count,stage,index)=>count+Number(validCount(records?.[index])),0);
  const pk=profile?.pkWildCard===true;
  const rings=SKINS.map(({name,catches:target})=>({
    title:name+' Ring',requirement:target?'Land '+target+' catches in Hook and Ring':'Start Hook and Ring',earned:catches>=target,
  }));
  const clearedEvents=new Set(Array.isArray(eventRecords)?eventRecords:[]);
  const campaigns=EVENTS.slice(EVENTS.findIndex(item=>item.id==='roman')).map(item=>({
    title:item.name,requirement:'Clear '+item.name,earned:clearedEvents.has(item.id),
  }));
  return {
    cleared,
    orchardFlag:cleared===STAGES.length,
    milestones:[
      rings[0],
      rings[1],
      {title:'Harbor Exhibit',requirement:'Clear Harbor Lift',earned:validCount(records?.[0])},
      rings[2],
      {title:'Canal Exhibit',requirement:'Clear Canal Crossing',earned:validCount(records?.[1])},
      rings[3],
      {title:'Sunken Salvage Exhibit',requirement:'Clear Sunken Salvage',earned:validCount(records?.[3])},
      {title:'Grape Apple Flag',requirement:'Clear all '+STAGES.length+' Grapple It bubble courses',earned:cleared===STAGES.length},
      ...campaigns,
      {title:'PK Wild Card',requirement:'Beat Nathan AI 🚀 on Full ON',earned:pk},
    ],
  };
}

export function winsWildCard(opponent, match) {
  return opponent?.name===NATHAN_NAME&&opponent.level==='full'&&match.ended&&match.winner===0;
}
