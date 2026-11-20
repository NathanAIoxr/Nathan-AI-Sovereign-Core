export function createInstitution(blueprint, release, civics, foundation, foundationQuote) {
  const base = "/tabor-academy/institution";
  const blueprintKey = "institution/blueprint-" + blueprint.meta.version + ".json";
  const outlineQueries = {
    curricula: "SELECT * FROM curricula ORDER BY title LIMIT 100",
    syllabi: "SELECT * FROM syllabi ORDER BY course_code LIMIT 100",
    scope: "SELECT * FROM scope_sequence ORDER BY syllabus_id, sequence_order LIMIT 100",
    lessons: "SELECT * FROM lesson_plans ORDER BY scope_id, day_number LIMIT 100",
    assessments: "SELECT * FROM assessments ORDER BY lesson_id, assessment_type LIMIT 100",
    library: "SELECT id, title, author, classification_code, material_type, public_url FROM library_catalog WHERE public_url IS NOT NULL ORDER BY title LIMIT 100",
    governance: "SELECT id, record_type, title, content, effective_date FROM governance_records WHERE is_public = 1 ORDER BY effective_date, id LIMIT 100",
  };
  const labels = ["Curriculum", "Syllabus", "Scope and Sequence", "Lesson Plans",
    "Assessment and Mastery Rubric", "Pedagogical Method", "Instructional Materials and Library",
    "Student Information System and Transcripts", "Governance and Compliance"];
  const outlineLinks = ["/api/curricula", "/api/syllabi", "/api/scope", "/api/lessons", "/api/assessments",
    "/api/pedagogy", "/api/library", null, "/api/governance"];
  const jsonType = "application/json; charset=utf-8";
  const security = {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "referrer-policy": "same-origin",
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const tokenEncoder = new TextEncoder();
  const validId = value => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value);
  const validScore = value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

  function respond(request, body, status = 200, type = jsonType, extra = {}) {
    return new Response(request.method === "HEAD" ? null : body, {
      status, headers: { ...security, "content-type": type, ...extra },
    });
  }
  function json(request, value, status, extra) {
    return respond(request, JSON.stringify(value), status, jsonType, extra);
  }
  function failure(request, error, status) {
    return json(request, { error }, status);
  }

  async function isStaff(request, expected) {
    const value = request.headers.get("authorization") ?? "";
    if (typeof expected !== "string" || expected.length < 32 || !value.startsWith("Bearer ") || value.length > 512) return false;
    const digest = input => crypto.subtle.digest("SHA-256", tokenEncoder.encode(input)).then(bytes => new Uint8Array(bytes));
    const [actual, target] = await Promise.all([digest(value.slice(7)), digest(expected)]);
    return actual.reduce((diff, byte, index) => diff | (byte ^ target[index]), 0) === 0;
  }

  async function requestData(request) {
    if ((request.headers.get("content-type") ?? "").split(";")[0] !== "application/json" || !request.body) return null;
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let body = "";
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    try {
      const value = JSON.parse(body + decoder.decode());
      return value && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  async function findAssessment(db, id) {
    return db.prepare(`SELECT a.id, a.assessment_type, a.mastery_cutoff, s.id AS syllabus_id, s.credits
      FROM assessments a JOIN lesson_plans l ON l.id = a.lesson_id
      JOIN scope_sequence u ON u.id = l.scope_id JOIN syllabi s ON s.id = u.syllabus_id
      WHERE a.id = ?`).bind(id).first();
  }

  function evaluate(assessment, score) {
    const mastered = score >= assessment.mastery_cutoff;
    return {
      assessment_id: assessment.id,
      score,
      mastery_cutoff: assessment.mastery_cutoff,
      mastery_achieved: mastered,
      next_step: mastered ? "ADVANCE_TO_NEXT_UNIT" : "REPEAT_MASTERY_LOOP",
    };
  }

  async function readOutline(db, path) {
    const result = await db.prepare(outlineQueries[path]).all();
    return result.results;
  }

  function layout(title, content) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Tabor Academy</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#10140f;color:#f9f3e4}
*{box-sizing:border-box}body{margin:0}main{max-width:72rem;margin:auto;padding:clamp(1rem,5vw,4rem)}
nav,a{color:#e6cf87}nav{display:flex;flex-wrap:wrap;gap:.75rem 1.5rem}
a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid #f9f3e4;outline-offset:4px}
h1,h2,h3{font-family:Georgia,serif;font-weight:400}h1{font-size:clamp(2.5rem,7vw,5rem);line-height:1;margin:2.5rem 0 .5rem}
h2{font-size:clamp(1.75rem,4vw,2.35rem)}h3{font-size:1.35rem;margin:.2rem 0}p,li{line-height:1.55}
section{margin-top:2.25rem;border-top:1px solid #778360;padding-top:.7rem}ol.pillars{padding-left:1.5rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:.85rem 2rem}
.pillars li{border:1px solid #465137;padding:.85rem;margin-left:.35rem}.pillars li::marker{color:#e6cf87}
.byline{color:#ddcead}.score{display:flex;align-items:center;flex-wrap:wrap;gap:.65rem}
input,button{font:inherit;padding:.55rem .75rem;border:1px solid #778360}input{width:8rem}button{background:#e6cf87;color:#151b10;font-weight:bold;cursor:pointer}
output{display:block;margin-top:1rem;font-weight:bold}
blockquote{margin-inline:0;padding-inline:1rem;border-left:3px solid #e6cf87}
.foundation-statement{font-size:clamp(1rem,2.25vw,1.3rem);max-width:52rem}
.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left}td,th{padding:.65rem;border-bottom:1px solid #778360;vertical-align:top}caption{text-align:left;padding-bottom:.4rem}
</style></head><body><main><nav aria-label="Academy"><a href="/tabor-academy/">Academy home</a><a href="/tabor-academy/library/">Library of Tabor</a><a href="/tabor-academy/workbench/">Workbench</a></nav>${content}</main></body></html>`;
  }

  function masteryForm(search, rubric, action) {
    const score = search.get("score");
    const result = score !== null && score.trim() && validScore(Number(score)) ? evaluate(rubric, Number(score)) : null;
    const message = score === null ? "" : result
      ? `<output role="status">${result.score}% · ${result.mastery_achieved ? "Mastery reached" : "Review the rubric and try again"}.</output>`
      : '<output role="status">Enter a score from 0 to 100.</output>';
    return `<form method="get" action="${action}/#practice"><p>Practice threshold ${rubric.mastery_cutoff}%</p>
<div class="score"><label for="score">Practice score</label><input id="score" name="score" type="number" min="0" max="100" step="any" required value="${esc(result?.score ?? "")}"><button type="submit">Check mastery</button></div>${message}</form>`;
  }

  async function dashboard(db, search) {
    const [courses, lessons, assessments] = await Promise.all([
      readOutline(db, "syllabi"), readOutline(db, "lessons"), readOutline(db, "assessments"),
    ]);
    const pillars = Object.values(blueprint.pillars).map((pillar, i) => {
      const link = outlineLinks[i];
      return `<li><h3>${link ? `<a href="${base}${link}">${labels[i]}</a>` : labels[i]}</h3><p>${esc(pillar.role)}</p></li>`;
    }).join("");
    const course = courses.find(row => row.id === "question-to-evidence");
    const lesson = lessons.find(row => row.id === "claim-and-source");
    const rubric = assessments.find(row => row.id === "evidence-mastery");
    const practice = course && lesson && rubric ? `<section><h2>${esc(course.course_title)}</h2>
<p>${esc(course.course_code)} · ${lesson.duration_minutes} minutes · ${esc(course.weekly_schedule)}</p>
<ol>${["warm_up_hook", "direct_instruction", "guided_practice", "independent_work", "exit_check"].map(key => `<li>${esc(lesson[key])}</li>`).join("")}</ol>
<h3>Mastery rubric</h3><ul>${JSON.parse(rubric.rubric_json).map(item => `<li>${esc(item.criterion)} · ${item.points} points</li>`).join("")}</ul>
<div id="mastery"><div id="practice">${masteryForm(search, rubric, base)}</div></div></section>` : "";
    return layout("Nine Pillars", `<h1>Nine Pillars</h1><p class="byline">Tabor Academy · ${esc(blueprint.meta.author)}</p>
<p>Trace the path from a curriculum to a lesson, a mastery check, and an official record.</p>
<p><a href="${base}/blueprint.json">Open the architecture blueprint</a> · <a href="${base}/civics/">Comparative Civics &amp; Legal Language</a> · <a href="${base}/learning-methods/">101 Hands-On Learning Methods</a> · <a href="${foundation.path}">${esc(foundation.title)}</a></p>
<section><h2>Institutional architecture</h2><ol class="pillars">${pillars}</ol></section>${practice}`);
  }

  function foundationPage() {
    return layout(foundation.title, `<h1>${esc(foundation.title)}</h1>
<div class="foundation-statement">${foundationQuote(foundation)}</div>
<nav aria-label="Foundation links"><a href="${foundation.path}source.txt">Read as plain text</a><a href="/tabor-academy/truth-lab/">Truth Lab</a><a href="${base}/">Nine Pillars</a></nav>`);
  }

  async function serveBlueprint(request, env, ctx) {
    let content;
    try {
      content = await env.ACADEMY_CACHE?.get(blueprintKey);
    } catch (error) {
      console.error("Academy blueprint cache read failed", error);
    }
    if (!content) {
      const file = await env.ACADEMY_LIBRARY.get(blueprintKey);
      if (!file) return failure(request, "Blueprint unavailable", 503);
      content = await file.text();
      if (env.ACADEMY_CACHE && ctx?.waitUntil) {
        ctx.waitUntil(env.ACADEMY_CACHE.put(blueprintKey, content, { expirationTtl: 3600 }).catch(error => {
          console.error("Academy blueprint cache write failed", error);
        }));
      }
    }
    return respond(request, content);
  }

  async function staffAction(request, path, url, db) {
    if (path === "/api/transcripts") {
      if (!["GET", "HEAD"].includes(request.method)) return failure(request, "Method not allowed", 405);
      const id = url.searchParams.get("student_id");
      if (!validId(id)) return failure(request, "Provide a valid student_id", 400);
      const rows = await db.prepare(`SELECT id, student_id, syllabus_id, assessment_id, score, mastery_achieved,
        credits_earned, recorded_at FROM transcript_ledger WHERE student_id = ? ORDER BY recorded_at DESC, id LIMIT 100`).bind(id).all();
      return json(request, rows.results);
    }
    if (request.method !== "POST") return failure(request, "Method not allowed", 405);
    const data = await requestData(request);
    if (!data || !validId(data.student_id)) return failure(request, "Provide a valid student_id", 400);
    if (path === "/api/students") {
      const name = typeof data.full_name === "string" ? data.full_name.trim() : "";
      if (!name || name.length > 160 || !validDate(data.enrollment_date)) return failure(request, "Provide a name and enrollment date", 400);
      const result = await db.prepare(`INSERT INTO students (id, full_name, enrollment_date)
        VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING`).bind(data.student_id, name, data.enrollment_date).run();
      return result.meta.changes ? json(request, { student_id: data.student_id, enrolled: true }, 201)
        : failure(request, "Student ID already exists", 409);
    }
    if (path === "/api/attendance") {
      if (!validId(data.syllabus_id) || !validDate(data.session_date) || !["present", "absent", "excused"].includes(data.status)) {
        return failure(request, "Provide a syllabus, session date, and attendance status", 400);
      }
      const result = await db.prepare(`INSERT INTO attendance (student_id, syllabus_id, session_date, status)
        SELECT s.id, y.id, ?, ? FROM students s CROSS JOIN syllabi y WHERE s.id = ? AND y.id = ?
        ON CONFLICT(student_id, syllabus_id, session_date) DO UPDATE SET status = excluded.status`)
        .bind(data.session_date, data.status, data.student_id, data.syllabus_id).run();
      return result.meta.changes ? json(request, { recorded: true }) : failure(request, "Student or syllabus not found", 404);
    }
    if (!validId(data.assessment_id) || !validScore(data.score)) return failure(request, "Provide an assessment_id and score from 0 to 100", 400);
    const assessment = await findAssessment(db, data.assessment_id);
    if (!assessment) return failure(request, "Assessment not found", 404);
    if (assessment.assessment_type !== "summative") return failure(request, "Only summative assessments enter the transcript ledger", 400);
    const student = await db.prepare("SELECT id FROM students WHERE id = ? AND status = 'active'").bind(data.student_id).first();
    if (!student) return failure(request, "Active student not found", 404);
    const result = evaluate(assessment, data.score);
    if (!result.mastery_achieved) return json(request, { ...result, transcript_recorded: false });
    const row = await db.prepare(`INSERT INTO transcript_ledger
      (id, student_id, syllabus_id, assessment_id, score, mastery_achieved, credits_earned)
      SELECT ?, ?, ?, ?, ?, 1, CASE WHEN EXISTS (
        SELECT 1 FROM transcript_ledger WHERE student_id = ? AND syllabus_id = ? AND credits_earned > 0
      ) THEN 0 ELSE ? END
      WHERE EXISTS (SELECT 1 FROM students WHERE id = ? AND status = 'active')
      ON CONFLICT(student_id, assessment_id) DO NOTHING
      RETURNING id`).bind(crypto.randomUUID(), data.student_id, assessment.syllabus_id, assessment.id, data.score,
        data.student_id, assessment.syllabus_id, assessment.credits, data.student_id).first();
    if (row) return json(request, { ...result, transcript_recorded: true, transcript_id: row.id }, 201);
    const existing = await db.prepare("SELECT id, score FROM transcript_ledger WHERE student_id = ? AND assessment_id = ?")
      .bind(data.student_id, assessment.id).first();
    return existing?.score === data.score ? json(request, { ...result, transcript_recorded: true, transcript_id: existing.id })
      : failure(request, "This assessment already has an official transcript entry", 409);
  }

  return async function serveInstitution(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.slice("/institution".length).replace(/\/$/, "") || "/";
    const isRead = request.method === "GET" || request.method === "HEAD";
    const db = env.ACADEMY_DB;
    try {
      if (["/api/students", "/api/attendance", "/api/transcripts", "/api/transcripts/record"].includes(path)) {
        if (!await isStaff(request, env.ACADEMY_STAFF_TOKEN)) {
          return json(request, { error: "Staff authorization required" }, 401, { "www-authenticate": 'Bearer realm="Tabor Academy"' });
        }
        return await staffAction(request, path, url, db);
      }
      if (path === "/api/assessments/grade") {
        if (request.method !== "POST") return failure(request, "Method not allowed", 405);
        const data = await requestData(request);
        if (!data || !validId(data.assessment_id) || !validScore(data.score)) {
          return failure(request, "Provide an assessment_id and score from 0 to 100", 400);
        }
        const assessment = await findAssessment(db, data.assessment_id);
        return assessment ? json(request, { ...evaluate(assessment, data.score), transcript_recorded: false })
          : failure(request, "Assessment not found", 404);
      }
      if (!isRead) return failure(request, "Method not allowed", 405);
      if (path === "/") return respond(request, await dashboard(db, url.searchParams), 200, "text/html; charset=utf-8");
      if (path === "/foundation") return respond(request, foundationPage(), 200, "text/html; charset=utf-8");
      if (path === "/foundation/source.txt") {
        return respond(request, foundation.statement, 200, "text/plain; charset=utf-8");
      }
      if (path === "/civics/source.txt") return respond(request, civics.source, 200, "text/plain; charset=utf-8");
      if (path === "/civics") {
        const rubric = await findAssessment(db, "civics-mastery");
        if (!rubric) return failure(request, "Civics rubric is unavailable", 503);
        const practice = `<div id="practice">${masteryForm(url.searchParams, rubric, base + "/civics")}</div>`;
        return respond(request, layout("Comparative Civics & Legal Language", civics.html + practice), 200, "text/html; charset=utf-8");
      }
      if (path === "/blueprint.json") return await serveBlueprint(request, env, ctx);
      if (path === "/healthz") {
        const row = await db.prepare("SELECT COUNT(*) AS curricula FROM curricula").first();
        return json(request, { institution: "Tabor Academy", status: "ONLINE", pillars: labels.length, curricula: row.curricula, release });
      }
      if (path === "/api/pedagogy") return json(request, blueprint.pillars["6_pedagogical_method"]);
      const key = path.slice("/api/".length);
      if (path.startsWith("/api/") && Object.hasOwn(outlineQueries, key)) return json(request, await readOutline(db, key));
      return failure(request, "Route not found", 404);
    } catch (error) {
      console.error("Academy institution route failed", path, error?.name);
      return failure(request, "Academy service temporarily unavailable", 503);
    }
  };
}
