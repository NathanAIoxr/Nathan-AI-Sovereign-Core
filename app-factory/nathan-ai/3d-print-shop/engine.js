/* NATHAN TABOR 3-D PRINT SHOP | five independent simulation nodes, one coordinated matrix.
   Browser-first, deterministic, non-hardware control. All geometry and motion are simulations.
   Public open-source links are references only: no external code execution, crawling, or printing.
*/
(function (root, make) {
  'use strict';
  const api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NathanPrintMatrix = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const NODE_COUNT = 5;
  const MAX_LAYERS = 16;
  const NAMES = ['MATRIX 1','MATRIX 2','MATRIX 3','MATRIX 4','MATRIX 5'];
  const PALETTE = ['#66e3d0','#75b7ff','#c3a0ff','#ffca86','#f48ca1'];
  const REFS = [
    {name:'PrintersForAnts · Micron',category:'Open printer design',url:'https://github.com/PrintersForAnts/Micron',license:'GPL-3.0',relationship:'miniature printer, not NASA industrial hardware'},
    {name:'PrintersForAnts · Salad Fork',category:'Open printer design',url:'https://github.com/PrintersForAnts/Salad_Fork',license:'GPL-3.0',relationship:'community miniature printer reference'},
    {name:'Klipper',category:'Firmware',url:'https://github.com/Klipper3d/klipper',license:'GPL-3.0',relationship:'physical printer firmware for separately approved machines'},
    {name:'Moonraker',category:'Printer API',url:'https://github.com/Arksine/moonraker',license:'GPL-3.0',relationship:'supported printer monitoring interfaces'},
    {name:'Marlin',category:'Firmware alternative',url:'https://github.com/MarlinFirmware/Marlin',license:'GPL-3.0',relationship:'firmware alternative; choose by target hardware'},
    {name:'OctoPrint',category:'Printer interface',url:'https://github.com/OctoPrint/OctoPrint',license:'AGPL-3.0',relationship:'printer browser control and status'},
    {name:'FreeCAD',category:'CAD',url:'https://github.com/FreeCAD/FreeCAD',license:'LGPL-2.1',relationship:'parameterized CAD design'},
    {name:'NASA Swamp Works',category:'NASA reference',url:'https://www.nasa.gov/kennedy/partnerships/swampworks/',license:'Reference only',relationship:'NASA research inspiration, not open-source 3-D printer design'},
    {name:'NASA MMPACT / ICON',category:'NASA reference',url:'https://www.nasa.gov/directorates/stmd/nasa-enables-construction-technology-for-moon-and-mars-exploration/',license:'Reference only',relationship:'lunar construction research; not downloadable aerospace fabrication software'}
  ];
  function newState(shape) {
    return {
      shape: ['habitat','crate','garden'].includes(shape) ? shape : 'habitat',
      running: false, speed: 1, tick: 0, unified: false, selected: 0,
      gophers: 0, inspection: null,
      nodes: Array.from({length:NODE_COUNT}, (_,i)=>({
        id:i+1,label:NAMES[i],layers:0,
        rate:[0.52,0.61,0.57,0.66,0.55][i],
        health:'SIMULATED', connected:false,
        color:PALETTE[i], physical:'DISCONNECTED'
      }))
    };
  }
  function advance(state, dt) {
    if (!state.running || state.unified) return state;
    const seconds = Math.max(0, Math.min(0.3, Number(dt)||0));
    const s = Math.max(0.25, Math.min(10, state.speed));
    state.tick += seconds*s;
    for (const node of state.nodes) {
      node.layers = Math.min(MAX_LAYERS,node.layers+seconds*s*node.rate);
    }
    state.gophers = Math.min(REFS.length,Math.floor(state.tick/2));
    if (state.nodes.every(n=>n.layers>=MAX_LAYERS)) {
      state.unified = true;state.running = false;
      state.nodes.forEach(n=>{n.connected=true;});
      state.gophers=REFS.length;
    }
    return state;
  }
  function progress(node) {return Math.round(100*node.layers/MAX_LAYERS);}
  function isUnified(state) {return state.nodes.length===NODE_COUNT && state.nodes.every(n=>n.layers>=MAX_LAYERS);}
  function reset(state,shape) {
    const newS=newState(shape||state.shape);
    state.shape=newS.shape;
    state.tick=0;state.unified=false;state.running=false;state.gophers=0;
    state.nodes=newS.nodes;state.inspection=null;
    return state;
  }
  // Generic abstract voxels, 9×9×16. These are safe artistic models, not machine tool paths.
  function voxel(shape,x,y,z) {
    if (![x,y,z].every(Number.isInteger) || x<0 || x>8 || y<0 || y>8 || z<0 || z>=MAX_LAYERS) return false;
    const dx=x-4,dy=y-4,r=Math.sqrt(dx*dx+dy*dy);
    if (shape==='crate') {
      return z===0 ? x>0&&x<8&&y>0&&y<8
      : z<=12 ? ((x===1||x===7||y===1||y===7)&&x>=1&&x<=7&&y>=1&&y<=7)
      : z===13&&(x>0&&x<8&&y>0&&y<8);
    }
    if (shape==='garden') {
      if (z===0) return x>=1&&x<=7&&y>=1&&y<=7;
      if (z<=5) return (r>=2.6&&r<=3.8);
      if (z<=13) return r<=Math.max(0.5,3.7-(z-5)*0.38)&&r>=Math.max(0,2.7-(z-5)*0.38);
      return false;
    }
    if (z===0) return r<4;
    if (z<=5) return r>2.7&&r<4.2;
    if (z<=14) {const outer=4-(z-5)*0.37;return r<=outer&&r>=Math.max(0,outer-1.3);}
    return false;
  }
  function sliceCount(shape,z) {
    let total=0;for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(voxel(shape,x,y,z))total++;
    return total;
  }
  function summary(state) {
    return {
      schema:'nathan-five-matrix-simulation.v1', simulated:true, hardwareConnected:false,
      shape:state.shape, matrixCount:NODE_COUNT, globalState:state.unified?'UNIFIED':'INDEPENDENT',
      averagePercent:Math.round(state.nodes.reduce((t,n)=>t+progress(n),0)/NODE_COUNT),
      discoveredReferences:state.gophers, referenceCount:REFS.length,
      nodes:state.nodes.map(n=>({id:n.id,progress:progress(n),layer:Math.floor(n.layers),simulated:true,physical:n.physical,linked:n.connected}))
    };
  }
  return {NODE_COUNT,MAX_LAYERS,NAMES,PALETTE,REFS,newState,advance,progress,isUnified,reset,voxel,sliceCount,summary};
});