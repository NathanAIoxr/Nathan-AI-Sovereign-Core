INSERT INTO curricula
  (id, title, grade_band, standards_json, graduation_requirements, description)
VALUES
  ('comparative-civics', 'Comparative Civics & Legal Language', 'Open learning',
   '["Compare exact primary-source language","Read the Navajo Nation’s Fundamental Laws in their own context","Trace a treaty provision to an implementation question"]',
   'Complete the lesson and reach at least 90% on its rubric. This open-learning unit carries zero credit.',
   'Compare belonging, authority, and promises across the 1776 declarations, Diné Fundamental Laws, the U.S. Constitution, and the 1868 treaty.')
ON CONFLICT(id) DO NOTHING;

INSERT INTO syllabi
  (id, curriculum_id, course_code, course_title, instructor, grading_weights_json, policies_text, weekly_schedule, credits)
VALUES
  ('comparative-civics', 'comparative-civics', 'TA-CIV-101', 'Comparative Civics & Legal Language', 'Tabor Academy',
   '{"summative":100,"formative":0}',
   'Quote primary texts precisely. Explain what each passage supports and identify where implementation needs additional records.',
   'Week 1: read the declarations, compare legal frameworks, and trace a treaty commitment.', 0)
ON CONFLICT(id) DO NOTHING;

INSERT INTO scope_sequence
  (id, syllabus_id, sequence_order, unit_title, target_weeks, skill_nodes_json)
VALUES
  ('comparative-civics-1', 'comparative-civics', 1, 'Pursuit, belonging, and treaty commitments', 1,
   '["Mark changes in wording","Identify a source’s community and obligations","Cite a treaty article","Name the implementation evidence"]')
ON CONFLICT(id) DO NOTHING;

INSERT INTO lesson_plans
  (id, scope_id, day_number, duration_minutes, warm_up_hook, direct_instruction, guided_practice, independent_work, exit_check)
VALUES
  ('pursuit-and-belonging', 'comparative-civics-1', 1, 50,
   '5 min. Give an example of pursuing something and of obtaining it.',
   '10 min. Underline the verbs in the Virginia and U.S. declarations. Explain how pursuing and obtaining are worded.',
   '15 min. Chart obligations and inclusion in the Diné Fundamental Laws and the U.S. Constitution.',
   '15 min. Use a provision of the 1868 treaty and Article VI to identify an obligation and an implementation question.',
   '5 min. State what changes when obtaining is absent. Cite the text and name one thing it leaves open.')
ON CONFLICT(id) DO NOTHING;

INSERT INTO assessments
  (id, lesson_id, assessment_type, pedagogy_mode, rubric_json, mastery_cutoff)
VALUES
  ('civics-source-check', 'pursuit-and-belonging', 'formative', 'socratic_dialogue',
   '[{"criterion":"Locate the Virginia text","points":25},{"criterion":"Locate the federal text","points":25},{"criterion":"Quote the verbs exactly","points":25},{"criterion":"Explain the difference","points":25}]', 90),
  ('civics-mastery', 'pursuit-and-belonging', 'summative', 'mastery_progression',
   '[{"criterion":"Compare the wording precisely","points":30},{"criterion":"Cite the Navajo Nation and U.S. records","points":25},{"criterion":"Identify a treaty commitment and who owed it","points":25},{"criterion":"Explain what further evidence would establish implementation","points":20}]', 90)
ON CONFLICT(id) DO NOTHING;

INSERT INTO library_catalog
  (id, title, author, classification_code, r2_object_key, material_type, public_url)
VALUES
  ('comparative-civics-lesson', 'Comparative Civics & Legal Language', 'Tabor Academy', 'TA.CIV.001', NULL, 'Lesson', '/tabor-academy/institution/civics/'),
  ('comparative-civics-source', 'Comparative Civics Original Submission', 'Nathan Tabor and supplied dialogue', 'TA.CIV.002', NULL, 'Source transcript', '/tabor-academy/institution/civics/source.txt'),
  ('civics-virginia-rights', 'Virginia Declaration of Rights', 'Virginia Convention', 'TA.CIV.003', NULL, 'Primary text', 'https://www.archives.gov/founding-docs/virginia-declaration-of-rights'),
  ('civics-declaration', 'Declaration of Independence', 'Continental Congress', 'TA.CIV.004', NULL, 'Primary text', 'https://www.archives.gov/founding-docs/declaration-transcript'),
  ('civics-dine-fundamental-laws', 'The Fundamental Laws of the Diné', 'Navajo Nation', 'TA.CIV.005', NULL, 'Primary text', 'https://courts.navajo-nsn.gov/dine.htm'),
  ('civics-constitution', 'Constitution of the United States', 'Constitutional Convention', 'TA.CIV.006', NULL, 'Primary text', 'https://www.archives.gov/founding-docs/constitution-transcript'),
  ('civics-navajo-treaty', 'Navajo Treaty of 1868', 'Navajo Nation and the United States', 'TA.CIV.007', NULL, 'Primary text', 'https://americanindian.si.edu/nationtonation/pdf/Navajo-Treaty-1868.pdf')
ON CONFLICT(id) DO NOTHING;
