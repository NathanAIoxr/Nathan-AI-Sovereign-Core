-- Restore the Three Apples subtraction scenario and retain Nathan Tabor’s original words.
UPDATE academy_way_missions
SET title = 'Field drill · Three Apples · Subtraction',
    outcome = 'Use subtraction to count the apples on the table and account for all three.',
    build = 'Three apples are on the table. One apple is moved into a person’s hand. After subtracting one from the table count, where are all three apples? Choices: 1. Two apples are on the table and one is in the person’s hand. All three apples are accounted for. / 2. Two apples are on the table, so only two apples exist. / 3. All three apples are still on the table.',
    integrate = 'Start with three apples or tokens on a table. Move one into your hand. Write 3 − 1 = 2 for the table count. Then write two on the table plus one in your hand equals three.',
    verify = 'Worked response: Three minus one equals two apples on the table. The apple in the person’s hand is still there. Two on the table plus one in the hand accounts for all three.'
WHERE slug = 'survival-field-drill-04' AND path = 'mastery-money';
