'use strict';
let items=[],page=0;const size=100;
const $=id=>document.getElementById(id);
function match(x,t){const n=x.name||'';return !t||(t==='folder'?x.kind==='folder':t==='index'?/index|registry|catalog|database|inventory|manifest|ledger|list|matrix|schema/i.test(n):t==='database'?/\.(sqlite3?|db)$/i.test(n):t==='image'?/\.(png|jpe?g|svg|webp)$/i.test(n):t==='code'?/\.(py|js|cjs|swift|sql|css)$/i.test(n):/\.zip$/i.test(n));}
function render(){const q=$('query').value.toLowerCase(),t=$('filter').value;
const found=items.filter(x=>([x.name,x.path,x.mime_type].join(' ').toLowerCase().includes(q))&&match(x,t));const last=Math.max(0,Math.ceil(found.length/size)-1);page=Math.min(page,last);$('rows').replaceChildren();
for(const x of found.slice(page*size,(page+1)*size)){const row=document.createElement('tr');for(const val of [x.name,x.path,x.size_bytes??'']){const cell=document.createElement('td');cell.textContent=val;row.append(cell);}const cell=document.createElement('td');if(x.library_file_id){const link=document.createElement('a');link.href='https://chatgpt.com/library?file_id='+encodeURIComponent(x.library_file_id)+'&account_id=personal';link.textContent='Open';link.target='_blank';link.rel='noopener noreferrer';cell.append(link);}else cell.textContent='Folder';row.append(cell);$('rows').append(row);}
$('status').textContent=found.length+' matching entries · page '+(page+1)+' of '+(last+1);$('previous').disabled=page===0;$('next').disabled=page>=last;}
$('query').oninput=$('filter').onchange=()=>{page=0;render();};$('previous').onclick=()=>{page--;render();};$('next').onclick=()=>{page++;render();};
fetch('inventory.json').then(r=>{if(!r.ok)throw Error('Inventory request failed');return r.json();}).then(data=>{items=data;render();}).catch(e=>{$('status').textContent=e.message;});
