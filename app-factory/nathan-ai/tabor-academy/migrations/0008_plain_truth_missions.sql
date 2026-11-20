-- Public lessons only. Preserve published rows when replaying the migration.

INSERT INTO academy_way_missions
  (slug, path, position, title, outcome, build, flip, integrate, verify, link)
SELECT 'gaslighting-and-plain-truth', 'language', COALESCE(MAX(position), 0) + 1,
  'Gaslighting, deflection, and plain truth',
  'Answer the question that was asked. When a reply changes the question or misstates the record, name the change and correct it. Use the same standard with a person, an institution, or an AI.',
  '1+1=2. Copy the question and reply exactly. Try the Academy case: “Does the Declaration guarantee happiness?” Put the question beside the words “the pursuit of Happiness.”',
  '1−1=0. QI · Quick Intellingence. Identify the first sentence that answers the question. Mark any change of subject, inaccurate paraphrase, or assumption about someone’s motives. Deflection shifts attention away. Talking past someone answers a different point. Gaslighting involves manipulation that makes a person doubt their perceptions or experience.',
  '1×1=1. QE · Quintessential Empathy. Restate the person''s point and let them correct your reading. Answer directly: “The Declaration says ‘the pursuit of Happiness.’ It gives no guarantee of attaining happiness.” If your earlier answer dodged the question, say exactly where and give the correction.',
  '1÷1=1. Have a second reader compare the original question, the reply, and the correction. Mark what the record shows and what you still do not know. Use the listening practice from Talking Mammals and the record-restoration theme of The War of Mammals.',
  'way/humanities/dine-we-the-people-and-pursuit/'
FROM academy_way_missions
WHERE true
ON CONFLICT(slug) DO NOTHING;

INSERT INTO academy_way_missions
  (slug, path, position, title, outcome, build, flip, integrate, verify, link)
SELECT 'dine-we-the-people-and-pursuit', 'humanities', COALESCE(MAX(position), 0) + 1,
  'Diné, We the People, and the pursuit of happiness',
  'Explain how official wording, legal power, and lived experience can diverge. Show whose words counted, what each document says, and what the people affected could actually exercise.',
  'Compare section 1 of the Virginia Declaration of Rights, Jefferson’s rough draft, and the final U.S. Declaration. Underline “pursuing and obtaining” in the Virginia text and “pursuit” in the federal texts. Read the Navajo Nation’s Diné Fundamental Laws and its copy of the 1868 treaty.',
  'Separate exact wording from an inference about motives. Read the Three-Fifths clause in Article I, section 2: it counted enslaved people in allocating House seats and direct taxes while giving them no vote. Explain who gained representation and who could exercise it.',
  'Put the 1868 treaty alongside an account of the Long Walk and forced confinement. Compare the written terms with Diné accounts of what happened. Carry forward the questions about authority and protection from The Time of Peace and the Law of Order.',
  'Write a sentence on what each source establishes. The U.S. Declaration gives no guarantee of attaining happiness. Jefferson’s surviving rough draft already uses “pursuit.” Ask a reader to trace each claim to its source and mark any claim about motive or borrowing that needs more evidence.',
  'order/time-of-peace/'
FROM academy_way_missions
WHERE true
ON CONFLICT(slug) DO NOTHING;

INSERT INTO academy_way_missions
  (slug, path, position, title, outcome, build, flip, integrate, verify, link)
SELECT 'read-back-the-exact-words', 'language', COALESCE(MAX(position), 0) + 1,
  'Read back the exact words',
  'A side-by-side record of what was said, what was repeated, and what changed.',
  'Read this fictional exchange aloud: “I agreed to help Saturday morning.” The reply is “You promised to be there all weekend.” Write both lines exactly and underline the time in each.',
  'Clear the added promise and any guess about why someone made it. Use QI · Quick Intellingence to name the changed scope in one sentence.',
  'Use QE · Quintessential Empathy to check the readback: “I heard Saturday morning. Is that the commitment you made?” Record the answer next to the source line with a time or turn number.',
  'Give the original and your record to a partner. They should be able to spot the added time and reproduce the correction without knowing either speaker.',
  'way/language/gaslighting-and-plain-truth/'
FROM academy_way_missions
WHERE true
ON CONFLICT(slug) DO NOTHING;

INSERT INTO academy_way_missions
  (slug, path, position, title, outcome, build, flip, integrate, verify, link)
SELECT 'check-an-ai-answer-against-the-record', 'computing', COALESCE(MAX(position), 0) + 1,
  'Check an AI answer against the record',
  'An AI answer audit that records what the source supports and gives a direct correction.',
  'Use this fictional bulletin: “The library closes at 4 p.m. Thursday. Friday hours will be announced.” An example AI answer says “The library closes at 4 p.m. Thursday and Friday, according to the updated schedule.” Copy the bulletin and answer into separate columns.',
  'Underline each claim in the answer. Mark the Thursday time as supported and Friday’s time as unresolved. Mark “updated schedule” as a citation claim that requires a real source.',
  'Write the corrected answer in two sentences. Quote the supporting line and identify what evidence would establish Friday’s hours. For further reading, see NIST AI 600-1, section 2.2.',
  'Test the same approach with a new bulletin that directly contradicts a sample answer. Have someone replay both cases and confirm that unsupported and contradicted claims get different entries.',
  'way/language/read-back-the-exact-words/'
FROM academy_way_missions
WHERE true
ON CONFLICT(slug) DO NOTHING;

INSERT INTO academy_way_missions
  (slug, path, position, title, outcome, build, flip, integrate, verify, link)
SELECT 'correct-the-record-without-erasing-it', 'life', COALESCE(MAX(position), 0) + 1,
  'Correct the record without erasing it',
  'A dated correction someone can see, verify, and compare with the original.',
  'Start with a fictional club notice announcing 2 p.m. and a dated organizer message confirming 3 p.m. Save both versions with a source and timestamp.',
  'Remove excuses and assumptions about who noticed. Identify the exact field that was wrong and the people who received it.',
  'Write a correction that names the error, gives the new time, and points to the source. Put it alongside the old notice so the history can be followed.',
  'Give the two versions and the correction to a partner. They should find the current time, see which earlier version was wrong, and identify where the update belongs.',
  'way/computing/check-an-ai-answer-against-the-record/'
FROM academy_way_missions
WHERE true
ON CONFLICT(slug) DO NOTHING;

INSERT INTO academy_way_missions
  (slug, path, position, title, outcome, build, flip, integrate, verify, link)
SELECT 'compare-a-public-promise-with-the-rule', 'humanities', COALESCE(MAX(position), 0) + 1,
  'Compare a public promise with the rule',
  'A comparison showing who a public statement includes, what the operative rule does, and who can exercise the benefit.',
  'Start with two fictional town records: a meeting invitation says “Everyone is welcome to speak.” The adopted rules permit any attendee to observe and reserve speaking time for registered district residents.',
  'Circle the people each document names. Separate attendance, speaking, and voting. Mark whether the actual rules even say anything about voting.',
  'Put the invitation and rule beside a fictional meeting record showing a visitor was present and denied a speaking slot. Compare the public wording with the rule and the outcome.',
  'Ask a partner to identify the source of each conclusion and one fact still open. Use the Diné and We the People lesson to apply the same reading method to a historical case.',
  'way/humanities/dine-we-the-people-and-pursuit/'
FROM academy_way_missions
WHERE true
ON CONFLICT(slug) DO NOTHING;
