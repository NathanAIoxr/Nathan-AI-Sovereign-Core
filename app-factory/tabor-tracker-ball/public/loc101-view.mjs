import {clamp, project, TAU} from "./track-baller.mjs";
import {fieldForce, markers} from "./loc101-core.mjs";

const ink = "#e7f5ef", green = "#c8f583", aqua = "#71e0d2", line = "#315060";

function linePath(ctx, points, color, width = .004, close = false) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const item of points.slice(1)) ctx.lineTo(item.x, item.y);
  if (close) ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function dot(ctx, x, y, radius, fill, border) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (border) {
    ctx.lineWidth = .004;
    ctx.strokeStyle = border;
    ctx.stroke();
  }
}

function label(ctx, value, x, y, fill = ink, size = .044) {
  ctx.font = `600 ${size}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = fill;
  ctx.fillText(value, x, y, .69);
}

function ring(radius, at, callback) {
  return Array.from({length: 49}, (_, index) => {
    const angle = index * TAU / 48;
    return callback(Math.cos(angle) * radius, Math.sin(angle) * radius, at);
  });
}

function orbit(ctx, scene) {
  const transform = (x, y, z) => {
    const [u, v] = project(scene.orientation, [x, y, z]);
    return {x: u * scene.zoom, y: v * scene.zoom};
  };
  const id = scene.module.id;
  if ([2,10,11,18,77].includes(id)) {
    const stacks = {
      2: [[.13,.22],[.23,.07],[.22,-.06],[.13,-.18],[.14,-.22]],
      10: [[.24,.20],[.24,.06],[.24,-.08],[.24,-.22]],
      11: [[.255,.028],[.255,-.028]],
      18: [[.285,.028],[.285,-.028],[.19,-.029]],
      77: [[.23,.21],[.23,.10],[.23,-.05],[.23,-.21]],
    }[id].map(([radius, y]) => ring(radius, y, (x, z, level) => transform(x, level, z)));
    for (let i = 0; i < stacks.length; i++) {
      linePath(ctx, stacks[i], i === scene.active ? green : aqua, i === scene.active ? .006 : .0035);
    }
    for (let i = 0; i < 48; i += 6) linePath(ctx, stacks.map(layer => layer[i]), line);
  } else if ([44,54,80,82].includes(id)) {
    const corners = [[-.21,-.21,-.21],[.21,-.21,-.21],[.21,.21,-.21],[-.21,.21,-.21],
      [-.21,-.21,.21],[.21,-.21,.21],[.21,.21,.21],[-.21,.21,.21]].map(point => transform(...point));
    linePath(ctx, corners.slice(0, 4), aqua, .004, true);
    linePath(ctx, corners.slice(4), green, .004, true);
    for (let i = 0; i < 4; i++) linePath(ctx, [corners[i], corners[i + 4]], line, .005);
  } else if ([14,19,22,23,26,86,92].includes(id)) {
    for (let row = -6; row <= 6; row++) {
      const points = Array.from({length: 21}, (_, index) => {
        const x = -.31 + index * .031, z = row * .041;
        const y = Math.sin(x * 11 + id) * Math.cos(z * 12) * .14 - z * .30;
        return transform(x, y, z);
      });
      linePath(ctx, points, row % 3 ? line : aqua);
    }
  } else {
    const radius = .305;
    for (let i = -2; i <= 2; i++) {
      const angle = i * .39;
      linePath(ctx, ring(Math.cos(angle) * radius, Math.sin(angle) * radius, (x, z, y) => transform(x, y, z)), i ? line : aqua);
    }
    for (let i = 0; i < 6; i++) {
      const a = TAU * i / 6;
      linePath(ctx, ring(radius, a, (x, y, angle) => transform(x * Math.cos(angle), y, x * Math.sin(angle))), line);
    }
  }
}

function dial(ctx, scene) {
  for (const radius of [.19,.27,.35,.375]) linePath(ctx, ring(radius, 0, (x,y) => ({x,y})), line);
  for (let i = 0; i < 60; i++) {
    const a = i * TAU / 60;
    const inner = i % 5 === 0 ? .342 : .358;
    linePath(ctx, [{x:Math.sin(a) * inner,y:-Math.cos(a) * inner},{x:Math.sin(a) * .375,y:-Math.cos(a) * .375}], line);
  }
  linePath(ctx, [{x:0,y:0},{x:Math.sin(scene.dial) * .27,y:-Math.cos(scene.dial) * .27}], green, .008);
  dot(ctx,0,0,.032,"#19323a",aqua);
  label(ctx,String(Math.round(scene.dial * 360 / TAU) % 360) + "°",0,.087,aqua,.047);
}

function trace(ctx, scene, points) {
  linePath(ctx, points, line, .009);
  linePath(ctx, scene.trace, aqua, .006);
  if (scene.module.id === 55 && scene.trace.length) {
    for (let index = 1; index < 6; index++) {
      const angle = index * TAU / 6;
      const c = Math.cos(angle), s = Math.sin(angle);
      linePath(ctx, scene.trace.map(({x,y}) => ({x:x*c-y*s,y:x*s+y*c})), line, .004);
    }
  }
}

function field(ctx, scene, points) {
  const contacts = scene.contacts.length ? scene.contacts : [points[scene.active]];
  for (let ix = -8; ix <= 8; ix++) {
    for (let iy = -5; iy <= 5; iy++) {
      let x = ix * .061, y = iy * .066, intensity = 0;
      for (const contact of contacts) {
        const dx = x - contact.x, dy = y - contact.y;
        const d = Math.hypot(dx,dy);
        const force = fieldForce(d, .012);
        x += dx * force * scene.gain;
        y += dy * force * scene.gain;
        intensity += force;
      }
      dot(ctx,x,y,.004 + clamp(intensity,0,.5) * .016,intensity > .11 ? aqua : line);
    }
  }
  for (const contact of contacts) dot(ctx,contact.x,contact.y,.053,"#132930",aqua);
}

function flow(ctx, scene) {
  for (let track = 1; track < 7; track++) {
    const radius = track * .057;
    const offset = scene.rotation / (1 + track * .33);
    linePath(ctx, ring(radius, 0, (x,y) => ({x,y:y * (.55 + track * .042)})), line);
    for (let particle = 0; particle < 8; particle++) {
      const angle = particle * TAU / 8 + offset + track * .62;
      dot(ctx, Math.sin(angle) * radius, Math.cos(angle) * radius * (.55 + track * .042),
        particle % 4 === 0 ? .012 : .006, particle % 4 === 0 ? green : aqua);
    }
  }
}

function audio(ctx, scene) {
  const frequency = 2 + scene.active;
  const points = Array.from({length: 95}, (_, index) => {
    const x = index / 94;
    return {x:(x-.5)*.86,y:Math.sin(x*TAU*frequency+scene.rotation)*Math.sin(x*Math.PI)*.15*scene.gain};
  });
  linePath(ctx, [{x:-.46,y:0},{x:.46,y:0}], line);
  linePath(ctx, points, aqua, .008);
}

function link(ctx, scene, points) {
  for (let index = 0; index < points.length - 1; index++) {
    linePath(ctx, [points[index],points[index + 1]], scene.edges.has(index) ? green : line, .008);
  }
}

const backgrounds = {orbit, dial, trace, field, flow, audio, link};

export function draw(ctx, canvas, scene) {
  const box = canvas.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.round(box.width * ratio), height = Math.round(box.height * ratio);
  if (!width || !height) return;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width; canvas.height = height;
  }
  const unit = Math.min(width, height);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,width,height);
  ctx.setTransform(unit,0,0,unit,width/2,height/2);
  const points = markers(scene);
  backgrounds[scene.module.profile]?.(ctx, scene, points);
  for (const [i, mark] of points.entries()) {
    const picked = i === scene.active || i === scene.pending;
    dot(ctx,mark.x,mark.y,.035,picked ? green : "#16323b",picked || scene.visited.has(i) ? green : aqua);
    label(ctx,String(i + 1),mark.x,mark.y,picked ? "#152516" : ink);
  }
  if (scene.module.profile === "logic") {
    label(ctx,scene.module.items[scene.active].name,0,0,green,.066);
  }
}
