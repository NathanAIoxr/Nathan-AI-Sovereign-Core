export function toModule(source) {
  return `let handler;
const addEventListener = (name, fn) => {
  if (name !== 'fetch' || handler) throw new Error('Unexpected Music Lab event');
  handler = fn;
};
${source}
if (typeof handler !== 'function') throw new Error('Music Lab fetch listener missing');
export default {
  fetch(request) {
    let response;
    handler({ request, respondWith(value) { response = value; } });
    return response;
  },
};
`;
}
