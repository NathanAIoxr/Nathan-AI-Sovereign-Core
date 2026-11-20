const key='history-of-snow-globes:lab-progress:v1';
export function restoreProgress(storage,chapters){
  try{
    const data=JSON.parse(storage?.getItem(key)||'{}');
    const labs=new Map(), completed=new Set();
    for(const [i,ch] of chapters.entries()){
      const saved=data.labs?.[ch.id];
      if(!saved||typeof saved!=='object')continue;
      const values=Object.fromEntries(ch.game.controls.map(({key,min,max,value})=>{
        const prior=saved.values?.[key];
        return [key,Number.isFinite(prior)&&prior>=min&&prior<=max?prior:value];
      }));
      labs.set(i,{values,shaken:saved.shaken===true});
      if(saved.completed===true)completed.add(i);
    }
    return {labs,completed};
  }catch{return {labs:new Map(),completed:new Set()};}
}
export function saveProgress(storage,chapters,labs,completed){
  try{
    if(!storage)return false;
    const data=Object.fromEntries([...labs].flatMap(([i,lab])=>chapters[i]?
      [[chapters[i].id,{...lab,completed:completed.has(i)}]]:[]));
    storage.setItem(key,JSON.stringify({labs:data}));
    return true;
  }catch{return false;}
}
