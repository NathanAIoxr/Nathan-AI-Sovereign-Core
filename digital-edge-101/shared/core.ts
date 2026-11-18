export type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue };
export type Input = ArrayBuffer | JSONValue;
export type Env = Record<string, unknown>;
export type Params = Record<string, unknown>;
export type ModuleResult = unknown;
export class InputError extends Error {}
export function check(ok: unknown, message: string): asserts ok { if (!ok) throw new InputError(message); }
export const num = (x: unknown, min = -1e9, max = 1e9): number => {
  check(typeof x === "number" && Number.isFinite(x) && x >= min && x <= max, "Number outside the supported range");
  return x;
};
export const int = (x: unknown, min = 0, max = 65535): number => {
  const n = num(x, min, max); check(Number.isInteger(n), "Expected an integer"); return n;
};
export const vec = (x: unknown, max = 256, min = 1): number[] => {
  check(Array.isArray(x) && x.length >= min && x.length <= max, "Invalid vector length"); return x.map(v => num(v));
};
export function exactVec(x: unknown, length: number) { return vec(x, length, length); }
export const str = (x: unknown, max = 8192): string => {
  check(typeof x === "string" && x.length <= max, "Invalid text"); return x;
};
export function params(x: Input): Params {
  if (x instanceof ArrayBuffer) return { bytes: [...new Uint8Array(x)] };
  check(x !== null && typeof x === "object" && !Array.isArray(x), "Expected a JSON object"); return x;
}
export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: readonly number[]) => sum(xs) / xs.length;
export const dot = (a: readonly number[], b: readonly number[]) => {
  check(a.length === b.length, "Vector lengths differ"); return sum(a.map((x, i) => x * b[i]));
};
export const norm = (xs: readonly number[]) => Math.hypot(...xs);
export const mod = (x: number, n: number) => ((x % n) + n) % n;
export const bytes = (x: unknown): Uint8Array<ArrayBuffer> => {
  check(Array.isArray(x) && x.length <= 8192, "Expected at most 8192 bytes"); return Uint8Array.from(x, n => int(n, 0, 255));
};
export const hex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
export const utf8 = (x: unknown) => new TextEncoder().encode(str(x));
export const sha = async (b: Uint8Array<ArrayBuffer>, alg = "SHA-256") => new Uint8Array(await crypto.subtle.digest(alg, b));
export const velocity = (x: unknown) => exactVec(x, 2);
export function define(title: string, sample: JSONValue, run: (p: Params, env: Env) => unknown) {
  return { title, sample, execute: async (input: Input, env: Env = {}): Promise<ModuleResult> => run(params(input), env) };
}
