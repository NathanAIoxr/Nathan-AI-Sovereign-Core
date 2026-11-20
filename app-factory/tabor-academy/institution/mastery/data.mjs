import { pathToFileURL } from "node:url";
import { learningMethods } from "../learning-methods/data.mjs";
import { learningArc } from "../../../../tabor-world/human-learning-arc/human-learning-arc-data.mjs";
import { survivalDomains } from "../../../../tabor-world/survival-mastery-domains/survival-mastery-domains-data.mjs";
import { capstones, magiCourses, methods, sources, survivalCourses, unseenCourses } from "./courses.mjs";

const root = "/tabor-academy/institution/mastery/";
const survival = survivalDomains.eras.map(({ id, title, stations }) => ({
  id, title, ...survivalCourses[id], stations,
}));
const arcStations = learningArc.eras.flatMap(era => era.stations);
const historicalIds = arcStations.map(station => station.id).sort((a, b) => a - b);
if (historicalIds.join(",") !== Array.from({ length: 48 }, (_, index) => index + 1).join(",")) {
  throw new Error("Historical station IDs no longer match the original 30 plus 18 extensions");
}
if (survival.length !== 6 || survival.flatMap(course => course.stations).length !== 27) {
  throw new Error("Expected six survival domains and 27 existing stations");
}

export const curriculum = {
  title: "Human Learning, Survival & Mastery",
  motto: [
    "If you don’t know truth, you don’t know True love because love without truth is tough love …",
    "while love with truth is unconditional love",
  ],
  cycle: [
    ["1+1=2 · Build", "Combine documented observations into a working account."],
    ["1-1=0 · Clear", "Withdraw a claim that fails its test. Keep the original and the reason for the correction."],
    ["1×1=1 · Integrate", "Apply the same skill in a second setting and document the connections."],
    ["1÷1=1 · Verify", "Ask an independent learner to reproduce the result from the source material."],
  ],
  ranks: [
    ["Observer", "Reproduce a dated observation accurately."],
    ["Apprentice", "Demonstrate a procedure with feedback and recall it after a delay."],
    ["Practitioner", "Apply the skill with a changed constraint and state when to ask for help."],
    ["Advisor", "Defend a sourced decision and revise it as new evidence arrives."],
    ["Mentor", "Teach the skill and observe a new learner transfer it to another case."],
  ],
  tracks: [
    { id: "survival", code: "TA-SURVIVAL", title: "Six Universal Human Survival & Mastery Domains", description: "Train protection, trade and contracts, kinship, daily self-sufficiency, meta-learning and civic literacy in realistic decisions.", courses: survival, capstone: "who-gets-the-water", world: "https://tabor-world.nathantaboract.workers.dev/survival-mastery-domains/", related: survivalDomains.academy },
    { id: "magi", code: "TA-MAGI", title: "Magi Apprenticeship", description: "A modern apprenticeship informed by Persian Magi, Babylonian observation and Zoroastrian priestly studies. Those records have different origins and scope. The six-course design is contemporary.", courses: magiCourses, capstone: "advise-the-council", related: "/tabor-academy/institution/civics/" },
    { id: "unknown-unseen", code: "TA-UNSEEN", title: "The Unknown & Unseen", description: "An off-world civilization is the fictional instructor. Learners investigate what they can observe through effects, using established physics, explicit hypotheses and independently checkable results.", courses: unseenCourses, capstone: "three-signals-one-night" },
  ],
  historical: {
    methods: learningMethods.methods.length + 30,
    original: "/tabor-academy/institution/learning-methods/",
    related: learningArc.academy,
    world: "https://tabor-world.nathantaboract.workers.dev/human-learning-arc/",
    groups: learningMethods.groups,
    eras: learningArc.eras,
  },
  foundations: [
    ["/tabor-academy/institution/", "Nine Operational Pillars"],
    ["/tabor-academy/institution/foundation/", "Tabor Academy Foundation"],
    ["/tabor-academy/institution/foundation/three-apples/", "The Three Apples Reality"],
    ["/tabor-academy/way/", "The Nathan Tabor Way"],
    ["/tabor-academy/library/", "Library of Tabor"],
    ["/tabor-academy/truth-lab/", "Truth Lab"],
  ],
  // Diné College speaks for its own educational philosophy. KJV lessons cite the text directly.
  readings: [
    ["The early human record", "Use artifacts to compare what survives at open-air sites and in shelters. Distinguish discovery date, artifact date, maker and inference.", ["stone", "lomekwi"]],
    ["Diné College educational philosophy", "Read the institution’s own public description and summarize the relationship among learning, community and the natural world in the source’s terms.", ["dine"]],
    ["Biblical readings in the KJV", "Compare the position of the wise figures in Daniel 2 and Matthew 2 and trace the words on which each interpretation depends.", ["scripture"]],
  ],
  methods, capstones, sources,
  rubric: [
    { criterion: "Preserve observations and cite the source", points: 25 },
    { criterion: "Identify an alternative and design a useful test", points: 25 },
    { criterion: "Carry out a safe, reproducible procedure", points: 25 },
    { criterion: "Explain the result, uncertainty and any correction", points: 25 },
  ],
};

for (const track of curriculum.tracks) {
  if (track.courses.length !== 6 || !capstones[track.capstone]) throw new Error("Incomplete track " + track.id);
  for (const course of track.courses) {
    if (!course.lesson || !course.lab || !course.evidence || !course.question || !course.answer ||
      !course.sources?.length || course.sources.some(id => !sources[id])) {
      throw new Error("Incomplete lesson or source in " + track.id + "/" + course.id);
    }
  }
}

const literal = value => typeof value === "number" ? String(value) :
  value == null ? "NULL" : "'" + String(value).replaceAll("'", "''") + "'";
const insert = (table, columns, rows) => "INSERT INTO " + table + " (" + columns + ") VALUES\n" +
  rows.map(row => "  (" + row.map(literal).join(", ") + ")").join(",\n") + "\nON CONFLICT(id) DO NOTHING;";

export function masterySql() {
  const curriculumId = "ta-human-mastery";
  const scopes = [];
  const lessons = [];
  const assessments = [];
  const library = curriculum.tracks.map(track =>
    ["ta-" + track.id, track.title, "Tabor Academy", track.code, null, "Apprenticeship", root + track.id + "/"]);
  const rubric = JSON.stringify(curriculum.rubric);
  for (const track of curriculum.tracks) {
    let previous = null;
    const capstone = curriculum.capstones[track.capstone];
    const units = [...track.courses, {
      id: track.capstone, title: capstone.title, question: capstone.setup, lesson: capstone.prompt,
      lab: capstone.reveal, evidence: capstone.evaluate, answer: capstone.evaluate, sources: capstone.sources,
    }];
    units.forEach((item, index) => {
      const id = "ta-" + track.id + "-" + item.id;
      const path = index < track.courses.length ? track.id + "/" + item.id : "capstone/" + item.id;
      scopes.push([id, "ta-" + track.id, index + 1, item.title, previous, 1, JSON.stringify(item.sources)]);
      lessons.push([id, id, 1, 50, item.question, item.lesson, item.lab, item.evidence, item.answer]);
      assessments.push([id, id, index < track.courses.length ? "formative" : "summative", "Source-based demonstration", rubric, 90]);
      library.push([id, item.title, "Tabor Academy", track.code, null, "Lesson", root + path + "/"]);
      previous = id;
    });
  }
  library.push(["ta-historical-131", "131 Historical Methods", "Tabor Academy", "TA.HISTORY.131", null, "Learning collection", root + "timeline/"]);
  return [
    "-- Generated by institution/mastery/data.mjs. Existing course and student IDs remain separate.",
    insert("curricula", "id,title,grade_band,standards_json,graduation_requirements,description",
      [[curriculumId, curriculum.title, "Secondary, adult and mentor", JSON.stringify(curriculum.ranks.map(([title]) => title)), "Demonstrate the capstones with documented evidence and independent verification.", "Three connected tracks and the historical methods navigator."]]),
    insert("syllabi", "id,curriculum_id,course_code,course_title,instructor,grading_weights_json,policies_text,weekly_schedule,credits",
      curriculum.tracks.map(track => ["ta-" + track.id, curriculumId, track.code, track.title, "Tabor Academy", JSON.stringify({ formative: 60, summative: 40 }), "Preserve observations, consent and source provenance. Use anonymous examples in public exercises.", "Six lessons and an assessed capstone", 0])),
    insert("scope_sequence", "id,syllabus_id,sequence_order,unit_title,prerequisite_id,target_weeks,skill_nodes_json", scopes),
    insert("lesson_plans", "id,scope_id,day_number,duration_minutes,warm_up_hook,direct_instruction,guided_practice,independent_work,exit_check", lessons),
    insert("assessments", "id,lesson_id,assessment_type,pedagogy_mode,rubric_json,mastery_cutoff", assessments),
    insert("library_catalog", "id,title,author,classification_code,r2_object_key,material_type,public_url", library),
  ].join("\n\n") + "\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.stdout.write(masterySql());
