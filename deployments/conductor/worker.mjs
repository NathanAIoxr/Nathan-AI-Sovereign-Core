import {verifyLiveDecision} from "./cheironomer/src/integrity.js";
import { project, repository, ProjectConductor } from "./state.mjs";
import { dashboard } from "./dashboard.mjs";
import { dashboardScript } from "./dashboard-client.mjs";
import {cheironomer, operator} from "./cheironomer/src/entry.js";
import {consume} from "./cheironomer/src/conductor.js";
import { serveNutcrackerBedroomHandoff } from "./handoffs/nutcracker-bedroom.mjs";
export { ZoneClock } from "./time-clock.mjs";

export { ProjectConductor };

const prefix = "/tabor-sites/conductor";
const idPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const encoder = new TextEncoder();

function json(data, status = 200) {
  return Response.json(data, { status, headers });
}

async function sameSecret(a, b) {
  if (typeof b !== "string" || !b || a.length > 512) return false;
  const [x, y] = await Promise.all([a, b].map(s => crypto.subtle.digest("SHA-256", encoder.encode(s))));
  return crypto.subtle.timingSafeEqual(x, y);
}

async function limitedBody(request, limit) {
  const reader = request.body?.getReader();
  const bytes = new Uint8Array(limit);
  let size = 0;
  if (reader) {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (size + value.length > limit) {
          await reader.cancel();
          throw new RangeError("too_large");
        }
        bytes.set(value, size);
        size += value.length;
      }
    } finally {
      reader.releaseLock();
    }
  }
  return bytes.subarray(0, size);
}

async function webhook(request, env, state) {
  const signature = request.headers.get("X-Hub-Signature-256") ?? "";
  if (!env.GITHUB_WEBHOOK_SECRET || !/^sha256=[0-9a-f]{64}$/.test(signature)) return json({ error: "unauthorized" }, 401);
  const body = await limitedBody(request, 65_536);
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.GITHUB_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const signatureBytes = Uint8Array.from(signature.slice(7).match(/../g), n => Number.parseInt(n, 16));
  if (!await crypto.subtle.verify("HMAC", key, signatureBytes, body)) return json({ error: "unauthorized" }, 401);
  const event = JSON.parse(new TextDecoder().decode(body));
  if (request.headers.get("X-GitHub-Event") !== "workflow_run" ||
      event.repository?.full_name !== repository || event.action !== "completed" ||
      !Number.isSafeInteger(event.workflow_run?.id) || event.workflow_run.id < 1) {
    return new Response(null, { status: 204, headers });
  }
  // A signed event can only prompt a poll. GitHub's authenticated run API decides the outcome.
  await state.wake(event.workflow_run.id);
  return new Response(null, { status: 204, headers });
}

export default {
  async scheduled(_event,env) { await env.TIME.getByName("cheironomer").cheirWake(); },
  async queue(batch,env) { await consume(batch,env); },
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const path = (pathname === prefix || pathname.startsWith(prefix + "/") ? pathname.slice(prefix.length) : pathname) || "/";
    const method = request.method;
    if (path==="/cheironomer/internal/dns-gate" && method==="GET") {
      const token=(request.headers.get("Authorization")??"").match(/^Bearer ([^\s]+)$/i)?.[1]??"";
      if(!await sameSecret(token,env.CHEIR_RELAY_KEY))return json({error:"unauthorized"},401);
      const host=new URL(request.url).searchParams.get("domain");
      if(!host||! /^(?=.{1,253}$)[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$/.test(host))return json({error:"invalid_domain"},400);
      const [record,status]=await Promise.all([
        env.LEDGER.prepare("SELECT state,dns_zone_id,updated_at FROM dns_zone_fleet WHERE domain=?").bind(host).first(),
        env.TIME.getByName("cheironomer").cheirStatus()
      ]);
      try {
        return json({live:!status.paused&&await verifyLiveDecision(env,host,record)});
      } catch{return json({live:false,error:"integrity_unavailable"},503);}
    }
    if (path==="/cheironomer/internal/emit" && method==="POST") {
      const token=(request.headers.get("Authorization")??"").match(/^Bearer ([^\s]+)$/i)?.[1]??"";
      if(!await sameSecret(token,env.CHEIR_RELAY_KEY))return json({error:"unauthorized"},401);
      try {
        const body=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(await limitedBody(request,16384)));
        if(!Array.isArray(body.messages)||body.messages.length>10)return json({error:"invalid_batch"},400);
        const accepted=[];
        const messages=body.messages.map((message,index)=>({
          body:message,ack:()=>accepted.push(index),retry:()=>undefined
        }));
        await consume({messages},env);
        return json({ack:accepted});
      } catch {return json({error:"invalid_batch"},400);}
    }
    if (path==="/cheironomer") return Response.redirect(new URL(pathname+"/",request.url),308);
    if (path.startsWith("/cheironomer/")) {
      try { return await cheironomer(request,env,path.slice("/cheironomer".length)); }
      catch (error) {
        if(error instanceof RangeError)return json({error:"request_too_large"},413);
        if(error instanceof SyntaxError||error instanceof TypeError)return json({error:"invalid_command"},400);
        console.error(JSON.stringify({component:"cheironomer",event:"request_failed"}));
        return json({error:"temporarily_unavailable"},503);
      }
    }
    const nutcracker = serveNutcrackerBedroomHandoff(request, path, {
      ai: env.AI,
      authorize: () => operator(request, env),
      readBytes: limit => limitedBody(request, limit)
    });
    if (nutcracker) return nutcracker;
    const isRead = method === "GET" || method === "HEAD";
    if (isRead && path === "/") {
      return new Response(method === "HEAD" ? null : dashboard, { headers: {
        ...headers, "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
      } });
    }
    if (isRead && path === "/dashboard.mjs") {
      return new Response(method === "HEAD" ? null : dashboardScript, { headers: {
        ...headers, "Content-Type": "text/javascript; charset=utf-8"
      } });
    }

    const state = env.STATE.getByName(project);
    try {
      if (method === "GET" && path === "/api/time") {
        return json(await env.TIME.getByName("zone-clock").status());
      }
      if (method === "POST" && path === "/api/time/start") {
        const token = (request.headers.get("Authorization") ?? "").match(/^Bearer ([^\s]+)$/i)?.[1] ?? "";
        if (!await sameSecret(token, env.TIME_START_KEY) && !await sameSecret(token, env.OPERATOR_KEY)) {
          return json({ error: "unauthorized" }, 401);
        }
        return json(await env.TIME.getByName("zone-clock").start(), 202);
      }
      if (isRead && path === "/api/health") {
        const [ready] = await Promise.all([
          state.ready(),
          env.LEDGER.prepare("SELECT event_id FROM conductor_events LIMIT 0").all()
        ]);
        const payload = { service: "nathan-ai-conductor", ready, release: env.RELEASE_SHA ?? "local" };
        if (method === "HEAD") return new Response(null, { status: ready ? 200 : 503, headers });
        return json(payload, ready ? 200 : 503);
      }
      if (method === "POST" && path === "/api/webhooks/github") return await webhook(request, env, state);

      const m = path.match(/^\/api\/jobs\/([^/]+)(\/decision)?$/);
      const control = path === "/api/control/pause" || path === "/api/control/resume";
      const operatorOnly = Boolean(m?.[2]) || control;
      const token = (request.headers.get("Authorization") ?? "").match(/^Bearer ([^\s]+)$/i)?.[1] ?? "";
      const operator = token && env.OPERATOR_KEY !== env.DISPATCH_KEY && await sameSecret(token, env.OPERATOR_KEY);
      const dispatcher = !operator && token && await sameSecret(token, env.DISPATCH_KEY);
      if (!operator && !dispatcher) return json({ error: "unauthorized" }, 401);
      if (operatorOnly && !operator) return json({ error: "operator_required" }, 403);

      if (method === "GET" && path === "/api/jobs") return json(await state.list());
      if (m && !idPattern.test(m[1])) return json({ error: "invalid_id" }, 400);
      if (method === "GET" && m && !m[2]) {
        const job = await state.get(m[1]);
        return job ? json({ job }) : json({ error: "not_found" }, 404);
      }
      if (method === "POST" && control) return json({ control: await state.setPaused(path.endsWith("/pause")) });
      if (method === "POST" && (path === "/api/dispatch" || m?.[2])) {
        if (request.headers.get("Content-Type")?.split(";")[0] !== "application/json") {
          return json({ error: "expected_json" }, 415);
        }
        const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await limitedBody(request, 4096)));
        if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_command" }, 400);
        if (m?.[2]) {
          if (typeof body.approved !== "boolean" || Object.keys(body).length !== 1) return json({ error: "invalid_decision" }, 400);
          const result = await state.decision(m[1], body.approved);
          return result.error ? json({ error: result.error }, result.status) : json(result);
        }
        if (typeof body.id !== "string" || !idPattern.test(body.id) || body.project !== project ||
            !["verify", "deploy"].includes(body.command) || Object.keys(body).length !== 3) {
          return json({ error: "invalid_command" }, 400);
        }
        const result = await state.submit(body.id, body.command);
        return result.error ? json({ error: result.error }, result.status) : json(result, result.replayed ? 200 : 202);
      }
      return json({ error: "not_found" }, 404);
    } catch (error) {
      if (error instanceof RangeError) return json({ error: "request_too_large" }, 413);
      if (error instanceof SyntaxError || error instanceof TypeError && error.message.includes("encoded data")) {
        return json({ error: "invalid_json" }, 400);
      }
      console.error(JSON.stringify({ component: "conductor", event: "request_failed" }));
      return json({ error: "temporarily_unavailable" }, 503);
    }
  }
};
