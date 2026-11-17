// One pending frame per active mode, independent of repeated tab selection.
export function createFrameLoop(draw, request=requestAnimationFrame, cancel=cancelAnimationFrame) {
  let pending=null, running=false;
  function frame(now) {
    pending=null;
    if(!running)return;
    draw(now);
    if(running&&pending===null)pending=request(frame);
  }
  return {
    start() {
      if(running)return;
      running=true;
      pending=request(frame);
    },
    stop() {
      running=false;
      if(pending!==null)cancel(pending);
      pending=null;
    },
  };
}
