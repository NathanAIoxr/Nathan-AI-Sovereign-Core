const $=id=>document.getElementById('ecosystem-'+id);
const repo='https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core';
const load=async path=>{
  const response=await fetch(path,{cache:'no-store'});
  if(!response.ok)throw Error('Unavailable');
  return response.json();
};
load('/ecosystem.json').then(apps=>{
  $('games').replaceChildren(...apps.map(app=>{
    const item=document.createElement('li'), title=document.createElement('h3'), link=document.createElement('a'), label=document.createElement('p');
    item.className='side';link.href=app.url;link.textContent=app.title;label.textContent=app.role;
    title.append(link);item.append(title,label);return item;
  }));
}).catch(()=>{$('list-status').textContent='The game directory could not load.';});
load('/release.json').then(release=>{
  $('release').textContent=release.sourceCommit?release.version+' · GitHub '+release.sourceCommit.slice(0,12)+' · '+release.boardCount+' boards':release.version+' · Local build';
  if(release.sourceCommit)$('source').href=repo+'/tree/'+release.sourceCommit+'/standalone-apps/hook-and-ring';
  $('download').hidden=!release.archive;
}).catch(()=>{$('release').textContent='The release manifest could not load.';});
load('/api/bee').then(status=>{
  if(!status.latest){
    $('bee').textContent='Scheduled. The first report is pending.';
    return;
  }
  $('bee').textContent=(status.stale?'Last report is overdue. ':status.latest.ok?'Latest checks passed. ':'A check needs attention. ')+
    new Date(status.latest.startedAt).toLocaleString();
  $('checks').replaceChildren(...status.latest.checks.map(check=>{
    const item=document.createElement('li');
    item.dataset.pass=String(check.ok);item.textContent=(check.ok?'Pass · ':'Check · ')+check.label+
      (check.ok?'':' · '+check.detail);
    return item;
  }));
}).catch(()=>{$('bee').textContent='The monitoring report is temporarily unavailable.';});
