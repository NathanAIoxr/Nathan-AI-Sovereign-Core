import {winningLine,sow,territory,pixelPicture,pixelClues,routeEnds,blocked,extend,crossword,crosswordDone} from './engine.mjs';

const mode=document.body.dataset.game;
const field=document.getElementById('board');
const controls=document.getElementById('controls');
const message=document.getElementById('message');
const say=text=>{message.textContent=text;};
const button=(label,action,parent=controls)=>{
  const el=document.createElement('button');
  el.type='button';el.textContent=label;el.onclick=action;parent.append(el);
  return el;
};
function grid(cols,values,draw) {
  field.replaceChildren();
  field.style.setProperty('--cols',cols);
  values.forEach((value,index)=>draw(value,index));
}
function cell(label,index,onClick) {
  const el=button(label,onClick,field);
  el.className='cell';
  el.setAttribute('aria-label','Cell '+(index+1)+', '+(label||'empty'));
  return el;
}

function three() {
  const board=Array(9).fill('');
  let player='X',done=false;
  function render() {
    grid(3,board,(n,i)=>{cell(n,i,()=>{
      if (done||board[i]) return;
      board[i]=player;
      if (winningLine(board)) {done=true;say(player+' wins.');}
      else if (board.every(Boolean)) {done=true;say('Draw.');}
      else {player=player==='X'?'O':'X';say(player+' to move.');}
      render();
    }).disabled=Boolean(n)||done;});
  }
  say('X to move.');render();
}

function seeds() {
  let board=[3,3,3,3,0,3,3,3,3,0], player=0, done=false;
  function render() {
    grid(5,board,(n,i)=>{
      const el=cell(String(n),i,()=>{
        const turn=sow(board,player,i);
        if (!turn || done) return;
        ({next:board,player,finished:done}=turn);
        say(done?(board[4]===board[9]?'Draw.':'Player '+(board[4]>board[9]?1:2)+' wins.'):'Player '+(player+1)+' to move.');
        render();
      });
      const store=i===4||i===9;
      el.disabled=store||done||!n||Math.floor(i/5)!==player;
      if (store) el.setAttribute('aria-label','Bank '+(i===4?1:2)+': '+n);
    });
  }
  say('Player 1 to move.');render();
}

function stones() {
  const board=Array(49).fill(0);
  let player=1, passed=false, done=false;
  const render=()=>grid(7,board,(n,i)=>{
    const el=cell(['','●','○'][n],i,()=>{
      if (board[i]||done) return;
      board[i]=player;player=3-player;passed=false;
      say('Player '+player+' to move.');render();
    });
    el.disabled=Boolean(n)||done;
  });
  button('Pass',()=>{
    if (done) return;
    if (passed) {
      done=true;
      const [a,b]=territory(board,7);
      say('Final score: Player 1 '+a+', Player 2 '+b+'.');
    } else {passed=true;player=3-player;say('Player '+player+' to move. Pass again to score.');}
    render();
  });
  say('Player 1 to move.');render();
}

function pixels() {
  const values=Array(25).fill(0);
  const goals=pixelClues(pixelPicture), expected=JSON.stringify(goals);
  const hints=document.createElement('p');
  hints.textContent='Rows: '+goals[0].join(' / ')+' · Columns: '+goals[1].join(' / ');
  controls.append(hints);
  const render=()=>grid(5,values,(n,i)=>{
    const el=cell(n?'■':'',i,()=>{
      values[i]=1-values[i];render();
      say(JSON.stringify(pixelClues(values))===expected?'Picture solved.':'');
    });
    el.setAttribute('aria-pressed',String(Boolean(n)));
  });
  render();
}

function harbor() {
  let paths=routeEnds.map(([n])=>[n]), color=0;
  const labels=['Blue','Amber'];
  const buttons=labels.map((label,i)=>button(label,()=>{
    color=i;buttons.forEach((el,k)=>el.setAttribute('aria-pressed',String(k===i)));
  }));
  buttons[0].setAttribute('aria-pressed','true');
  function render() {
    grid(5,Array(25).fill(0),(_,i)=>{
      const mark=blocked.includes(i)?'×':routeEnds[0].includes(i)?'B':routeEnds[1].includes(i)?'A':paths[0].includes(i)?'●':paths[1].includes(i)?'○':'';
      const el=cell(mark,i,()=>{
        paths=extend(paths,color,i);
        say(paths.every((route,k)=>route.at(-1)===routeEnds[k][1])?'Both ships docked.':'Tap a start port to redraw its route.');
        render();
      });
      el.disabled=blocked.includes(i);
    });
  }
  say('Select a ship and plot an adjacent route.');render();
}

function cross() {
  const entries=[];
  grid(7,Array.from(crossword),(answer,index)=>{
    if(answer==='.') {field.append(document.createElement('span'));entries.push(null);return;}
    const el=document.createElement('input');
    el.className='cell';el.maxLength=1;el.autocomplete='off';
    el.setAttribute('aria-label','Row '+(Math.floor(index/7)+1)+', column '+(index%7+1));
    el.oninput=()=>{el.value=el.value.toUpperCase().replace(/[^A-Z]/g,'');};
    field.append(el);entries.push(el);
  });
  button('Check',()=>say(crosswordDone(entries.map(el=>el?.value||''))?'Crossword solved.':'Some cells still need work.'));
}

const games={crossword:cross,three,seeds,stones,pixels,harbor};
function reset() {controls.replaceChildren();say('');games[mode]();}
document.getElementById('reset').onclick=reset;
reset();
