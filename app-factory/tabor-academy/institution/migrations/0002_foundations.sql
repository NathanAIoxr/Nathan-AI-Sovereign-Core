INSERT INTO curricula
  (id, title, grade_band, standards_json, graduation_requirements, description)
VALUES
  ('foundations', 'Tabor Academy Foundations', 'Open learning',
   '["Distinguish an observation from a claim","Use a source to support a claim","Revise a claim when the evidence changes"]',
   'Complete the Foundations lessons and demonstrate at least 90% mastery. This starter curriculum carries no course credit.',
   'Learn to trace a claim to its source and explain what the evidence supports.') ON CONFLICT(id) DO NOTHING;

INSERT INTO syllabi
  (id, curriculum_id, course_code, course_title, instructor, grading_weights_json, policies_text, weekly_schedule, credits)
VALUES
  ('question-to-evidence', 'foundations', 'TA-101', 'From Question to Evidence', 'Tabor Academy',
   '{"summative":100,"formative":0}',
   'Keep a source trail, show your reasoning, and repeat the assessment after reviewing any missed criteria.',
   'Week 1: distinguish a claim, an observation, and a source.', 0) ON CONFLICT(id) DO NOTHING;

INSERT INTO scope_sequence
  (id, syllabus_id, sequence_order, unit_title, target_weeks, skill_nodes_json)
VALUES ('evidence-1', 'question-to-evidence', 1, 'Trace a claim to its source', 1,
        '["Record a claim","Inspect a source","State what the source supports","Name an unanswered question"]') ON CONFLICT(id) DO NOTHING;

INSERT INTO lesson_plans
  (id, scope_id, day_number, duration_minutes, warm_up_hook, direct_instruction, guided_practice, independent_work, exit_check)
VALUES
  ('claim-and-source', 'evidence-1', 1, 50,
   '5 min. Write down one claim you heard today. What would allow you to check it?',
   '10 min. Compare a direct observation, an inference, and a quotation. Record the author, title, and location of the relevant passage.',
   '15 min. With a partner, match two sample claims to the specific passage that supports each one. Mark any gap.',
   '15 min. Pick a witness, document, or catalog record from the Library. Make a claim, cite the exact evidence, and record a limit.',
   '5 min. Hand in three lines: one claim, one citation, and one question you still have.') ON CONFLICT(id) DO NOTHING;

INSERT INTO assessments
  (id, lesson_id, assessment_type, pedagogy_mode, rubric_json, mastery_cutoff)
VALUES
  ('source-check', 'claim-and-source', 'formative', 'socratic_dialogue',
   '[{"criterion":"Write a checkable claim","points":25},{"criterion":"Locate a source","points":25},{"criterion":"Explain the connection","points":25},{"criterion":"Name a limit","points":25}]', 90),
  ('evidence-mastery', 'claim-and-source', 'summative', 'mastery_progression',
   '[{"criterion":"State a precise claim","points":20},{"criterion":"Cite a traceable source","points":30},{"criterion":"Explain what the evidence supports","points":30},{"criterion":"Identify an uncertainty and next check","points":20}]', 90) ON CONFLICT(id) DO NOTHING;

INSERT INTO library_catalog
  (id, title, author, classification_code, r2_object_key, material_type, public_url)
VALUES
  ('institution-blueprint', 'Nine-Pillar Academy Blueprint', 'Talking Mammal Nathan Tabor', 'TA.ARCH.001',
   'institution/blueprint-1.0.0.json', 'Architecture', '/tabor-academy/institution/blueprint.json'),
  ('library-of-tabor', 'Library of Tabor', 'Tabor Academy', 'TA.LIB.001', NULL, 'Source library', '/tabor-academy/library/'),
  ('tabor-workbench', 'Tabor Workbench', 'Tabor Academy', 'TA.LAB.001', NULL, 'Practice', '/tabor-academy/workbench/') ON CONFLICT(id) DO NOTHING;

INSERT INTO governance_records
  (id, record_type, title, content, effective_date, is_public)
VALUES
  ('instruction-charter', 'mission_charter', 'Instruction and mastery',
   'Tabor Academy uses direct instruction, Socratic dialogue, mastery progression, and tactile application. Published assessments require at least 90% mastery.', '2026-11-20', 1),
  ('student-records', 'records_policy', 'Student records',
   'Public mastery practice does not create a student record. Authorized staff manage enrollment, attendance, and transcript entries.', '2026-11-20', 1),
  ('registration-review', 'state_registration', 'Registration review',
   'The governance register is ready to record filing and verification dates when confirmed.', '2026-11-20', 1) ON CONFLICT(id) DO NOTHING;
