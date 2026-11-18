export const matrixWidth = 13;
export const dimensions = Object.freeze(Array.from({length: 30}, (_, n) => n).filter(n => n <= 12 || n >= 20));
export const anchors = Object.freeze({
  ME_MICRO: "Me · Micro",
  MO_MESO: "Mo · Meso",
  MU_MACRO: "Mu · Macro",
  CRO_MECRO: "Cro · Mecro"
});

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const keyPattern = /^[a-z0-9][a-z0-9-]{0,95}$/;
const isIndex = value => Number.isInteger(value) && value >= 0 && value < matrixWidth;

/** @typedef {{row:number,col:number,dimension:number,scale:keyof typeof anchors,tick:number,marker:"0xFF"}} Coordinate */

/** @returns {Coordinate|null} */
export function coordinate(value) {
  if (!value || !isIndex(value.row) || !isIndex(value.col) || !dimensions.includes(value.dimension) ||
      typeof value.scale !== "string" || !Object.hasOwn(anchors,value.scale) ||
      !Number.isSafeInteger(value.tick) || value.tick < 0 || value.marker !== "0xFF") return null;
  const {row,col,dimension,scale,tick,marker} = value;
  return {row,col,dimension,scale,tick,marker};
}

/** @param {Coordinate} point */
export function sovereignUri(point, work) {
  return `sovereign://throne/dim-${point.dimension}/grid-${point.row}x${point.col}/scale-${point.scale}/tick-${point.tick}/${work}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return "["+value.map(canonicalJson).join(",")+"]";
  if (value && typeof value === "object") {
    return "{"+Object.keys(value).sort().map(key=>JSON.stringify(key)+":"+canonicalJson(value[key])).join(",")+"}";
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new TypeError("Invalid JSON number");
  return JSON.stringify(value);
}

async function hash(value) {
  const digest = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonicalJson(value)));
  return Array.from(new Uint8Array(digest), byte=>byte.toString(16).padStart(2,"0")).join("");
}

const insert = `INSERT INTO sovereign_matrix_events
  (request_id,work_id,matrix_row,matrix_col,dimension,scale_anchor,timeline_tick,origin_row,origin_col,
   origin_dimension,origin_scale,origin_tick,state_hash,payload_json)
  SELECT ?,id,?,?,?,?,?,?,?,?,?,?,?,? FROM archive_works WHERE id=?
  ON CONFLICT(request_id) DO NOTHING`;

export async function jumpStatements(input) {
  if (!input || typeof input.requestId !== "string" || !keyPattern.test(input.requestId) ||
      typeof input.work !== "string" || input.work.length > 120 || !slugPattern.test(input.work) ||
      !input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) return null;
  const origin = coordinate(input.origin);
  const destination = coordinate(input.destination);
  if (!origin || !destination) return null;
  let payload, stateHash;
  try {
    payload = canonicalJson(input.payload);
    if (new TextEncoder().encode(payload).length > 4096) return null;
    stateHash = await hash({work:input.work,origin,destination,payload:input.payload});
  } catch {
    return null;
  }
  const {row,col,dimension,scale,tick} = destination;
  return {
    stateHash,
    insert:{sql:insert,params:[input.requestId,row,col,dimension,scale,tick,origin.row,origin.col,
      origin.dimension,origin.scale,origin.tick,stateHash,payload,input.work]},
    select:{sql:"SELECT * FROM sovereign_matrix_events WHERE request_id=?",params:[input.requestId]}
  };
}

export function matrixEvent(row) {
  const origin = {row:row.origin_row,col:row.origin_col,dimension:row.origin_dimension,
    scale:row.origin_scale,tick:row.origin_tick,marker:"0xFF"};
  const destination = {row:row.matrix_row,col:row.matrix_col,dimension:row.dimension,
    scale:row.scale_anchor,tick:row.timeline_tick,marker:"0xFF"};
  return {
    sequence:row.event_id,requestId:row.request_id,work:row.work_id,origin,destination,direction:row.direction,
    unitIndex:destination.row*matrixWidth+destination.col,uri:sovereignUri(destination,row.work_id),
    stateHash:row.state_hash,payload:JSON.parse(row.payload_json),recordedUtc:row.recorded_utc
  };
}

export async function portalJump(db, input) {
  const statements = await jumpStatements(input);
  if (!statements) return {status:400,body:{error:"Invalid portal jump",code:0}};
  const {insert,select,stateHash} = statements;
  const [write,result] = await db.batch([db.prepare(insert.sql).bind(...insert.params),db.prepare(select.sql).bind(...select.params)]);
  const row = result.results[0];
  if (!row) return {status:404,body:{error:"Archive record not found",code:0}};
  if (row.state_hash !== stateHash) return {status:409,body:{error:"Request ID already belongs to another jump",code:0}};
  return {status:write.meta.changes ? 201 : 200,body:{code:1,event:matrixEvent(row)}};
}

export async function verifyMatrixEvent(event) {
  const {work,origin,destination,payload,stateHash} = event;
  return stateHash === await hash({work,origin,destination,payload});
}

function parseNumber(value, fallback) {
  if (value === null || (fallback === null && value === "")) return fallback;
  if (!/^(0|[1-9]\d{0,15})$/.test(value)) return NaN;
  return Number(value);
}

export function matrixSelection(params) {
  const row = parseNumber(params.get("row"),0);
  const col = parseNumber(params.get("col"),0);
  const dimension = parseNumber(params.get("dimension"),0);
  const scale = params.get("scale") ?? "ME_MICRO";
  const order = params.get("order") ?? "desc";
  const tick = parseNumber(params.get("tick"),null);
  const cursor = parseNumber(params.get("cursor"),null);
  if (!coordinate({row,col,dimension,scale,tick:tick ?? 0,marker:"0xFF"}) ||
      !["asc","desc"].includes(order) || (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 1))) return null;
  return {row,col,dimension,scale,tick,order,cursor};
}

export async function readMatrix(db, selection) {
  const {row,col,dimension,scale,tick,order,cursor} = selection;
  const filters = ["matrix_row=?","matrix_col=?","dimension=?","scale_anchor=?"];
  const params = [row,col,dimension,scale];
  if (tick !== null) {
    filters.push("timeline_tick=?");
    params.push(tick);
  }
  if (cursor !== null) {
    filters.push(order === "asc" ? "event_id>?" : "event_id<?");
    params.push(cursor);
  }
  const sort = order === "asc" ? "ASC" : "DESC";
  const [events,occupancy] = await db.batch([
    db.prepare(`SELECT * FROM sovereign_matrix_events WHERE ${filters.join(" AND ")} ORDER BY event_id ${sort} LIMIT 21`).bind(...params),
    db.prepare(`SELECT matrix_row AS row,matrix_col AS col,COUNT(*) AS count FROM sovereign_matrix_events
      WHERE dimension=? AND scale_anchor=? GROUP BY matrix_row,matrix_col`).bind(dimension,scale)
  ]);
  const page = events.results.slice(0,20).map(matrixEvent);
  return {selection,occupancy:occupancy.results,events:page,nextCursor:events.results.length > 20 ? page.at(-1).sequence : null};
}
