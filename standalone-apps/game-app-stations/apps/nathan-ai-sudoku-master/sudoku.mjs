import { generate, solve, candidates, skyscraper } from './engine.mjs';

const byId = id => document.getElementById(id);
const board = byId('board');
const level = byId('level');
const announce = message => { byId('status').textContent = message; };
const storageKey = 'nathan-ai-sudoku-master-v1';
const digits = [1,2,3,4,5,6,7,8,9];
let puzzle, solution, values, notes;
let selected = 0, noteMode = false, checked = false;

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify({puzzle, values, notes, level:level.value})); }
  catch { /* Browser storage can be disabled. */ }
}

function restore() {
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey));
    if (!saved || ![...level.options].some(o=>o.value===saved.level)) return false;
    if (![saved.puzzle,saved.values].every(a=>Array.isArray(a)&&a.length===81&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=9))) return false;
    if (saved.puzzle.some((n,i)=>n&&n!==saved.values[i])) return false;
    const answers=solve(saved.puzzle,2);
    if (answers.length!==1) return false;
    puzzle=saved.puzzle; values=saved.values; solution=answers[0]; level.value=saved.level;
    notes=Array.from({length:81},(_,i)=>Array.isArray(saved.notes?.[i])?digits.filter(n=>saved.notes[i].includes(n)):[]);
    selected=puzzle.indexOf(0);
    if (selected<0) selected=0;
    return true;
  } catch { return false; }
}

function newPuzzle() {
  ({puzzle,solution}=generate(level.value));
  values=puzzle.slice();
  notes=Array.from({length:81},()=>[]);
  selected=puzzle.indexOf(0);
  if (selected<0) selected=0;
  checked=false;
  announce('New '+level.value+' puzzle.');
  update();
}

function update() {
  const focused=board.contains(document.activeElement);
  for (const [i,cell] of buttons.entries()) {
    cell.toggleAttribute('data-given',Boolean(puzzle[i]));
    cell.toggleAttribute('data-error',Boolean(checked&&values[i]&&values[i]!==solution[i]));
    cell.setAttribute('aria-pressed',String(i===selected));
    cell.tabIndex=i===selected?0:-1;
    cell.setAttribute('aria-label','Row '+(Math.floor(i/9)+1)+', column '+(i%9+1)+
      (values[i]?', '+values[i]+(puzzle[i]?' given':''):notes[i].length?', notes '+notes[i].join(', '):', empty'));
    cell.textContent=values[i]||'';
    if (!values[i]&&notes[i].length) {
      const marks=document.createElement('span');
      marks.className='marks';
      marks.setAttribute('aria-hidden','true');
      for (const n of digits) {
        const mark=document.createElement('span');
        mark.textContent=notes[i].includes(n)?n:'';
        marks.append(mark);
      }
      cell.append(marks);
    }
  }
  if (focused) buttons[selected].focus();
  save();
}

function place(n) {
  if (puzzle[selected]) return announce('Choose an empty or editable cell.');
  if (noteMode && n) {
    if (values[selected]) return announce('Erase the entry before adding notes.');
    const cell=notes[selected];
    notes[selected]=cell.includes(n)?cell.filter(value=>value!==n):[...cell,n].sort();
  } else {
    values[selected]=n;
    notes[selected]=[];
  }
  checked=false;
  if (values.every((value,i)=>value===solution[i])) announce('Puzzle complete.');
  update();
}

const buttons=Array.from({length:81},(_,i)=>{
  const cell=document.createElement('button');
  cell.type='button';
  cell.className='cell';
  cell.addEventListener('click',()=>{selected=i;update();});
  board.append(cell);
  return cell;
});
for (const n of digits) {
  const key=document.createElement('button');
  key.type='button';key.textContent=n;
  key.addEventListener('click',()=>place(n));
  byId('numbers').append(key);
}
board.addEventListener('keydown',event=>{
  const row=Math.floor(selected/9), col=selected%9;
  const moves={ArrowLeft:col>0?-1:0, ArrowRight:col<8?1:0, ArrowUp:row>0?-9:0, ArrowDown:row<8?9:0};
  if (Object.hasOwn(moves,event.key)) {event.preventDefault();selected+=moves[event.key];update();}
  else if (/^[1-9]$/.test(event.key)) {event.preventDefault();place(Number(event.key));}
  else if (['Backspace','Delete','0'].includes(event.key)) {event.preventDefault();place(0);}
});
byId('new').onclick=newPuzzle;
level.onchange=newPuzzle;
byId('notes').onclick=()=>{noteMode=!noteMode;byId('notes').setAttribute('aria-pressed',String(noteMode));announce(noteMode?'Notes on.':'Notes off.');};
byId('erase').onclick=()=>place(0);
byId('check').onclick=()=>{
  checked=true;
  const wrong=values.filter((n,i)=>n&&n!==solution[i]).length;
  const open=values.filter(n=>!n).length;
  announce(wrong?wrong+' incorrect '+(wrong===1?'entry.':'entries.'):open?open+' empty cells. Entered digits are correct.':'Puzzle complete.');
  update();
};
byId('solve').onclick=()=>{values=solution.slice();notes=notes.map(()=>[]);checked=false;announce('Solution shown.');update();};
byId('hint').onclick=()=>{
  const enteredWrong=values.some((n,i)=>n&&n!==solution[i]);
  if (enteredWrong) return announce('Check the entered digits before taking a hint.');
  if (values.every(Boolean)) return announce('Puzzle complete.');
  const single=values.findIndex((value,i)=>!value&&candidates(values,i).length===1);
  const special=single<0?skyscraper(values):null;
  const target=single>=0?single:special?.target??(values[selected]===0?selected:values.indexOf(0));
  selected=target;
  buttons[target].focus();
  const address='row '+(Math.floor(target/9)+1)+', column '+(target%9+1);
  if (special) announce('Skyscraper: remove '+special.digit+' from the candidates at '+address+'.');
  else if (single>=0) announce('Only '+solution[target]+' fits '+address+'.');
  else announce('Try '+solution[target]+' at '+address+'.');
  update();
};
if (restore()) {announce('Saved puzzle restored.');update();}
else newPuzzle();
