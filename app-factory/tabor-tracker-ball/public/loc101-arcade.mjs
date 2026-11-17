import {advanceShot,createShot,defaultThrow,HOOK,ROPE,STEP} from "../../../standalone-apps/hook-and-ring/game/physics.mjs";
import {startSwing,stepSwing,swingAction,swingCourse} from "../../../app-factory/grapple-it/public/swing.mjs";
import {attachDigitTrackBaller} from "./digit-input.mjs";
import {clamp} from "./track-baller.mjs";

const route = ["Village","Bridge","Archive"];
const labels = {hook:"Release ring", grapple:"Release swing", bible:"Place piece"};

export function mountLibraryArcade({bridge,getScene,notify,showClue}) {
  const byId = id => document.getElementById(id);
  const surface = byId("arcade-surface");
  const ctx = surface.getContext("2d");
  const game = byId("arcade-game");
  const practice = byId("arcade-practice");
  const left = byId("arcade-left");
  const right = byId("arcade-right");
  const action = byId("arcade-action");
  let aim = 0, direction = 1, selection = 0, placed = 0, shot = null;
  let grapple = readySwing();
  let shotClock = 0, swingClock = 0, priorTime;
  let attempt = null;

  function readySwing() {
    const state = startSwing(0);
    state.lift.done = true;
    stepSwing(state,STEP);
    return state;
  }

  function sync() {
    const {charge,focus,points,shield} = bridge.snapshot();
    byId("bridge-score").textContent = points + " pts";
    byId("bridge-charge").textContent = "Charge " + charge;
    byId("bridge-modifiers").textContent = "Shield " + shield + " · Focus " + focus;
    action.textContent = labels[game.value];
    action.disabled = Boolean(shot && !shot.result) || grapple.phase === "flight";
    practice.disabled = action.disabled;
    game.disabled = action.disabled;
    const choice = game.value === "bible" ? "Piece: " + route[selection] :
      game.value === "hook" ? "Aim: " + (aim === 0 ? "center" : aim < 0 ? "left" : "right") :
      "Swing: " + (direction < 0 ? "left" : "right");
    byId("arcade-aim").textContent = choice;
  }

  function shift(sign) {
    if (game.value === "hook") aim = Math.round(clamp(aim + sign * .125,-1,1) * 1000) / 1000;
    if (game.value === "grapple") direction = sign;
    if (game.value === "bible") selection = (selection + sign + route.length) % route.length;
    sync();
  }

  function report(success,message) {
    if (attempt) {
      const reward = bridge.end(attempt.id,success);
      if (success) showClue(getScene());
      if (reward) message += " " + reward;
    } else {
      message += " Practice attempt.";
    }
    attempt = null;
    notify(message);
    sync();
  }

  function launch(isPractice, raw = {}) {
    if (action.disabled) return;
    if (!isPractice) {
      attempt = bridge.start();
      if (!attempt) {
        notify("Complete a bottom-screen module for Charge, or try Practice.");
        return;
      }
    }
    if (game.value === "hook") {
      const pull = raw.pull ?? defaultThrow.pull;
      shot = createShot({pull,aim,flick:raw.flick ?? defaultThrow.flick});
      shotClock = 0;
    } else if (game.value === "grapple") {
      if (grapple.phase === "won") grapple = readySwing();
      swingClock = 0;
      swingAction(grapple);
    } else {
      if (selection !== placed) {
        report(false,"Find the next connection on the bridge route.");
        return;
      }
      placed++;
      const finished = placed === route.length;
      if (finished) placed = 0;
      report(true,finished ? "Village, bridge and archive connected." : route[selection] + " placed.");
    }
    sync();
  }

  game.addEventListener("change",() => {
    shot = null;
    grapple = readySwing();
    aim = 0;
    direction = 1;
    selection = 0;
    placed = 0;
    notify(game.value === "grapple" ? "Build a swing, then release toward the goal." :
      game.value === "bible" ? "Connect Village, Bridge and Archive in order." :
      "Aim your ring, or drag and release in the top field.");
    sync();
  });
  left.addEventListener("click",() => shift(-1));
  right.addEventListener("click",() => shift(1));
  action.addEventListener("click",() => launch(false));
  practice.addEventListener("click",() => launch(true));

  const controller = attachDigitTrackBaller(surface,{
    onMove(stroke) {
      if (action.disabled) return;
      if (game.value === "hook") {aim = clamp(stroke.dx,-1,1); sync();}
      if (game.value === "grapple" && stroke.dx) shift(Math.sign(stroke.dx));
    },
    onEnd(stroke) {
      if (stroke.kind === "tap" || stroke.kind === "hold") return;
      if (game.value === "bible") shift(Math.sign(stroke.dx) || 1);
      else launch(false,{pull:clamp(.38 + Math.abs(stroke.dy),0,1),flick:0});
    },
    onGripMove(grip) {
      if (game.value === "hook" && !action.disabled) {aim = clamp(grip.twist,-1,1); sync();}
    },
    onGripEnd(grip) {
      if (grip.peakContacts > 1 && game.value === "hook" && grip.wristFlip) {
        launch(false,{pull:clamp(grip.wristFlip.power,0,1)});
      }
    },
  });

  function draw() {
    if (!ctx) return;
    const w = surface.width, h = surface.height;
    ctx.clearRect(0,0,w,h);
    function dot(x,y,r,color) {
      ctx.beginPath(); ctx.arc(x*w,y*h,r,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
    }
    function line(a,b,color) {
      ctx.beginPath(); ctx.moveTo(a[0]*w,a[1]*h);ctx.lineTo(b[0]*w,b[1]*h);
      ctx.lineWidth=2;ctx.strokeStyle=color;ctx.stroke();
    }
    const mint = "#72e0d0", gold = "#ffd795", base = "#587887";
    if (game.value === "hook") {
      const z = value => .5 + value / (ROPE + ROPE + .6);
      const y = value => .18 - value / 3.6;
      const ring = shot?.p ?? {z:-1.1,y:-1.55};
      line([.5,.12],[z(ring.z),y(ring.y)],base);
      dot(z(HOOK.z),y(HOOK.y),8,mint);
      dot(z(ring.z),y(ring.y),10,gold);
    } else if (game.value === "grapple") {
      const {pivot,goal} = swingCourse(0);
      if (grapple.phase === "swing") line(pivot,[grapple.x,grapple.y],base);
      dot(...pivot,7,base);
      dot(...goal,12,mint);
      dot(grapple.x,grapple.y,10,gold);
    } else {
      line([.22,.53],[.78,.53],base);
      route.forEach((name,index) => {
        const x = [.22,.50,.78][index];
        dot(x,.53,index === selection ? 12 : 8,index < placed ? mint : index === selection ? gold : base);
        ctx.textAlign="center";ctx.font="14px system-ui";ctx.fillStyle="#e7f4f0";
        ctx.fillText(name,x*w,.78*h);
      });
    }
  }

  function tick(now) {
    const elapsed = Math.min((now - (priorTime ?? now)) / 1000,.05);
    priorTime = now;
    const dt = attempt?.slow ? elapsed * .62 : elapsed;
    if (shot && !shot.result) {
      shotClock += dt;
      while (shotClock >= STEP && !shot.result) {
        shotClock -= STEP;
        advanceShot(shot);
      }
      if (shot.result) report(shot.result.outcome === "catch",shot.result.detail + ".");
    }
    if (game.value === "grapple") {
      const moving = grapple.phase === "flight";
      swingClock += dt;
      while (swingClock >= STEP) {
        swingClock -= STEP;
        stepSwing(grapple,STEP,direction);
      }
      if (moving && grapple.phase !== "flight") report(grapple.phase === "won",
        grapple.phase === "won" ? "Grapple secured the goal." : "Grapple missed the goal.");
    }
    draw();
    requestAnimationFrame(tick);
  }

  sync();
  requestAnimationFrame(tick);
  return {sync,cancelInput:controller.cancel};
}
