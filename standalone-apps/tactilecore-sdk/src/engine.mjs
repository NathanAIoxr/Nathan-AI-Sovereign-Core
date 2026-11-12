/**
 * TactileCoreSDK - wrist-flip gesture engine (original demonstration implementation)
 * Authorship/design attribution: Nathan Tabor, 2026-11-12 (user-designated IP).
 * The implementation reads TOUCH CONTACTS, not biological finger identities.
 * Screen Y increases downward; the bottommost contact has MAXIMUM y.
 * It never instructs the player to actually throw or release a device.
 */
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const finite = (n, d=0) => Number.isFinite(n) ? n : d;
const angleDelta = (a, b) => Math.atan2(Math.sin(b-a), Math.cos(b-a));

export class WristFlipEngine {
  constructor({onThrow = () => {}, liftGuardMs = 14, historyMs = 50,
    maxReleaseMs = 45, useMotion = false, padWidth = 360, padHeight = 320} = {}) {
    this.onThrow = onThrow;
    this.liftGuardMs = liftGuardMs;
    this.historyMs = historyMs;
    this.maxReleaseMs = maxReleaseMs;
    this.useMotion = useMotion;
    this.padWidth = padWidth;
    this.padHeight = padHeight;
    this.contacts = new Map();
    this.grip = null;
    this.lastMotion = null;
    this.lastThrow = null;
    this.activeThrowCount = 0;
  }
  size(w,h) { this.padWidth = Math.max(1,w); this.padHeight = Math.max(1,h); }
  enableMotion(v) { this.useMotion = !!v; }
  motion(sample) {
    if (sample && (Number.isFinite(sample.beta) || Number.isFinite(sample.gamma))) {
      this.lastMotion = {beta:finite(sample.beta), gamma:finite(sample.gamma),
        accelerationY:finite(sample.accelerationY), t: finite(sample.t)};
    }
  }
  down(id,x,y,t) {
    if (this.grip?.fired && this.contacts.size) return;
    if (this.grip?.fired && !this.contacts.size) this.grip=null;
    if (this.contacts.has(id) || this.contacts.size>=10) return;
    const c={id, x, y, tDown:t, hist:[{x,y,t}], tUp:null};
    this.contacts.set(id,c);
    this._layout();
  }
  move(id,x,y,t) {
    const c=this.contacts.get(id); if (!c) return;
    if (t < c.hist[c.hist.length-1].t) return;
    c.x=x; c.y=y;
    c.hist.push({x,y,t});
    // Keep >50ms prehistory until a contact is released.
    while (c.hist.length>2 && c.hist[1].t < t-this.historyMs-55) c.hist.shift();
  }
  up(id,x,y,t) {
    const c=this.contacts.get(id); if(!c) return;
    // An up position may be a hardware edge artifact. Retain it but guard it.
    c.hist.push({x,y,t}); c.x=x; c.y=y; c.tUp=t;
    if (this.grip) {
      this.grip.finished.set(id, {...c,hist:[...c.hist]});
      if (!this.grip.releaseAt && this.grip.count>=2 && id===this.grip.anchorId) {
        this.grip.releaseAt=t;
      }
    }
    this.contacts.delete(id);
    if (!this.contacts.size) this._finalize(t);
    else if (this.grip?.releaseAt && t-this.grip.releaseAt>=this.maxReleaseMs) this._finalize(t);
  }
  cancel() { this.contacts.clear(); this.grip=null; }
  tick(t) {
    if (this.grip?.releaseAt && !this.grip.fired && t-this.grip.releaseAt>=this.maxReleaseMs) this._finalize(t);
  }
  _layout() {
    if (!this.contacts.size || this.grip?.releaseAt) return;
    const ordered=[...this.contacts.values()].sort((a,b)=>b.y-a.y);
    const selected=ordered.slice(0,3);
    const prevCount=this.grip?.count ?? 0;
    if (selected.length < prevCount) return;
    const anchor=selected[0];
    this.grip={count:selected.length,anchorId:anchor.id,
      controlIds:selected.slice(1).map(c=>c.id),
      initial:[...selected].map(c=>({id:c.id,x:c.x,y:c.y})),
      finished:new Map(),releaseAt:null,fired:false};
  }
  _contactFor(id) { return this.grip?.finished.get(id) || this.contacts.get(id); }
  _slope(contact, tEnd) {
    if(!contact) return {vx:0,vy:0,point:{x:0,y:0,t:tEnd}};
    const hist=contact.hist;
    const cut = tEnd-this.liftGuardMs;
    const valid=hist.filter(p=>p.t<=cut);
    // Sparse devices can deliver only a short history. Use oldest available
    // and avoid trusting the last UP point unless absolutely necessary.
    const end = valid[valid.length-1] || hist[0];
    const start = valid.find(p=>p.t>=end.t-this.historyMs) || valid[0] || hist[0];
    const dt=Math.max(1,end.t-start.t);
    return {vx:(end.x-start.x)/dt,vy:(end.y-start.y)/dt,point:end};
  }
  _finalize(t) {
    const g=this.grip;
    if(!g || g.fired) return;
    g.fired=true;
    const ids=[g.anchorId,...g.controlIds];
    const contacts=ids.map(id=>this._contactFor(id)).filter(Boolean);
    if(!contacts.length) { this.grip=null; return; }
    const release=g.releaseAt || Math.max(...contacts.map(c=>c.tUp??t));
    const slopes=contacts.map(c=>this._slope(c,c.tUp??release));
    const controls=g.count===1?slopes:slopes.slice(1);
    const mean=(arr,key)=>arr.reduce((s,v)=>s+v[key],0)/Math.max(1,arr.length);
    const meanX=mean(controls,'vx'), meanY=mean(controls,'vy');
    const anchor = contacts[0];
    const prior = g.initial.find(c=>c.id===g.anchorId) || g.initial[0];
    const rawStance = clamp((prior?.x??anchor.x)/this.padWidth,0,1);
    let angleSpin=0;
    if(g.controlIds.length===2) {
      const first=g.initial.find(c=>c.id===g.controlIds[0]);
      const second=g.initial.find(c=>c.id===g.controlIds[1]);
      const p=slopes[1]?.point, q=slopes[2]?.point;
      if(first && second && p && q) {
        const a=Math.atan2(second.y-first.y,second.x-first.x);
        const b=Math.atan2(q.y-p.y,q.x-p.x);
        angleSpin=angleDelta(a,b)/(Math.PI/2);
      }
    }
    const differential=controls.length===2 ? (controls[1].vx-controls[0].vx) : 0;
    const freshMotion=this.useMotion && this.lastMotion && Math.abs(release-this.lastMotion.t)<300;
    const motion=freshMotion ? this.lastMotion : null;
    // Positive power on upward swipe; touchscreen alone never senses true wrist motion.
    const swipe=clamp(-meanY/1.25,0,1);
    const power=clamp(swipe + Math.max(0,finite(motion?.beta))/450,0,1);
    const spin=clamp(angleSpin*.62+differential*.22+(motion?.gamma||0)/480,-1,1);
    const aimX=clamp(rawStance*.72+clamp(.5+meanX*.55,0,1)*.28,0,1);
    const loft=clamp(.20+power*.65+(motion?Math.max(0,motion.accelerationY)/30:0),0,1);
    const out={type:'wrist-flip',fingerCount:g.count,mode: `${g.count}_digit`,
      anchor:'bottommost contact at initial grip (estimated)',
      t:release,stance:rawStance,aimX,power,spin,loft,
      velocity:{x:meanX,y:meanY},
      motionUsed:!!motion,releaseWindowMs: g.releaseAt?Math.max(0,t-g.releaseAt):0,
      guardedMs:this.liftGuardMs,
      contactIds:ids, // pointer IDs; NOT physical finger identities
    };
    this.lastThrow=out;
    this.activeThrowCount++;
    this.onThrow(out);
    if(!this.contacts.size) this.grip=null;
  }
  snapshot() {
    return {touchCount:this.contacts.size, fingerCount:this.grip?.count||0,
      bottomId:this.grip?.anchorId??null,releasePending:!!this.grip?.releaseAt,
      contacts:[...this.contacts.values()].map(({id,x,y})=>({id,x,y}))};
  }
}
