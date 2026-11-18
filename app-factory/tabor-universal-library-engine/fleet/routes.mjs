const tools = [
  [421, "tabor-sov-017-container-counter", "/", "POST", {nodes:[{id:"box",type:"container"},{id:"book",type:"content"}]}],
  [423, "tabor-sov-019-benford", "/", "POST", {values:[12,27,145,8,311,10]}],
  [424, "tabor-sov-020-rational", "/", "POST", {a:"1",b:"2",c:"1",d:"3",op:"add"}],
  [430, "tabor-sov-026-unit-convert", "/", "GET", {value:"1",from:"mi",to:"km"}],
  [432, "tabor-sov-028-number-theory", "/factor", "GET", {n:"360"}],
  [433, "tabor-sov-029-luhn", "/luhn", "GET", {value:"79927398713"}],
  [437, "tabor-sov-033-tuning", "/compare", "GET", {base:"440",semitones:"7"}],
  [438, "tabor-sov-034-doppler", "/", "GET", {frequency_hz:"440",source_toward_mps:"12"}],
  [443, "tabor-sov-039-em-spectrum", "/convert", "GET", {hz:"500000000000000"}],
  [444, "tabor-sov-040-dew-point", "/", "GET", {temp_c:"20",relative_humidity:"50"}],
  [449, "tabor-sov-045-haversine", "/distance", "GET", {lat1:"35.96",lon1:"-80.01",lat2:"36.07",lon2:"-79.79"}],
  [450, "tabor-sov-046-verbatim-diff", "/", "POST", {original:"Tabor",edited:"Taber"}],
  [485, "tabor-sov-081-svg-sparkline", "/", "GET", {values:"1,3,2,5,4"}],
  [488, "tabor-sov-084-base64-hex", "/", "POST", {text:"Tabor"}],
  [495, "library-of-tabor-archive", "/api/catalog", "GET", {q:"Euclid"}],
];

export const routes = Object.fromEntries(tools.map(([id, service, path, method, example]) => [
  id, {service, path, method, example, binding: `CAP_${id}`},
]));

const queryRules = {
  430: {required:["value","from","to"]},
  432: {required:["n"]},
  433: {required:["value"]},
  437: {optional:["base","semitones"]},
  438: {required:["frequency_hz"], optional:["speed_sound","observer_toward_mps","source_toward_mps"]},
  443: {oneOf:["hz","wavelength_m"]},
  444: {required:["temp_c","relative_humidity"]},
  449: {required:["lat1","lon1","lat2","lon2"]},
  485: {optional:["values"]},
  495: {optional:["q","page"]},
};

export function getQuery(id, params) {
  const {required = [], optional = [], oneOf = []} = queryRules[id];
  const allowed = new Set([...required, ...optional, ...oneOf]);
  const result = new URLSearchParams();
  for (const [key, value] of params) {
    const maxLength = id === 485 ? 4096 : 120;
    if (!allowed.has(key) || result.has(key) || !value.trim() || value.length > maxLength) return null;
    result.set(key, value);
  }
  if (required.some(key => !result.has(key))) return null;
  if (oneOf.length && oneOf.filter(key => result.has(key)).length !== 1) return null;
  return result;
}
