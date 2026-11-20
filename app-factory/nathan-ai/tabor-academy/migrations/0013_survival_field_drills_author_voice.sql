-- Nathan Tabor’s wording in the Three Apples, money, and CLEAR field drills.

UPDATE academy_way_missions
SET build = 'Three apples are on the table. You hand one over today in exchange for a bicycle patch due Friday. Where is each apple, and when does the service go in the ledger? Choices: 1. Two stayed on the table, one was transferred, and the patch is owed until Friday’s work is complete. / 2. Subtract one from the total record and leave the apple’s location blank. / 3. Record the service as completed the moment the apple moves.',
    flip = 'Nathan Tabor’s words: “subtractions and multiplication are man made traps” “Who took my other one?” “2 on the table + 1 moved = 3 real apples total”',
    integrate = 'Draw a ledger with a table column and a recipient column. Trace the single apple through both. Record the Friday repair as owed, and add a completion receipt only when it arrives. Check the IRS guidance for any applicable reporting rules.',
    verify = 'Worked response: Two stayed on the table, one was transferred, and the patch is owed until Friday’s work is complete. The table count fell from three to two. One apple moved to the recipient, so the full inventory still accounts for three. List the service separately as owed until you have evidence that it was performed. Source to consult: IRS · Bartering income.',
    link = 'institution/foundation/three-apples/'
WHERE slug = 'survival-field-drill-04' AND path = 'mastery-money';

UPDATE academy_way_missions
SET build = 'The cash ledger opens with $1,000,000. On a worksheet someone writes $1,000,000 × 0 = $0. The case gives no transaction that changes the account. What balance should the learner report? Choices: 1. Zero dollars, because the worksheet says zero. / 2. $1,000,000. Enter zero for the product and reconcile the account from actual transactions. / 3. Subtract 80% automatically because the worksheet displays zero.',
    flip = 'Nathan Tabor’s words: “subtractions and multiplication are man made traps” “if you multiply $1 million times zero the world tells you you have zero dollars. How much money do you still have left”',
    integrate = 'Make a beginning balance and transaction log for the million-dollar case. Audit the claim “they take 80% before you ever get any” by asking for the actual amount, rate, basis, date, recipient and source. Then compare the separate loan example, $90 for 12 months versus $60 for 20 months, and audit both totals.',
    verify = 'Worked response: $1,000,000. Enter zero for the product and reconcile the account from actual transactions. The product is zero and the ledger balance stays $1,000,000 under the case assumptions. A deduction needs its own amount, date, destination, and evidence. The separate loan payment totals are $1,080 and $1,200 before separate fees. Source to consult: CFPB · Your Money, Your Goals.',
    link = 'institution/foundation/reality-math/'
WHERE slug = 'survival-field-drill-06' AND path = 'mastery-money';

UPDATE academy_way_missions
SET build = 'One marked apple is left on a table. The observer takes it into the next room. The table count is now zero. On another sheet, two apples are written as 10 in base two. Which account is complete? Choices: 1. Delete the old record and enter zero apples everywhere. / 2. Read the binary 10 as ten physical apples. / 3. Record the table count, the moved apple’s destination, and that binary 10 and decimal 2 represent the same number.',
    flip = 'Nathan Tabor’s words: “subtractions and multiplication are man made traps” “Nothing in physical reality ever evaporates because of a minus sign.” “1+1 = 10 is what the world operate zone but we operate on one plus one equals two”',
    integrate = 'Use 1−1=0 · CLEAR on the specific table count. Keep the original count and correction dated. Show the same two units written in decimal and binary, then name the location or scope for every count.',
    verify = 'Worked response: Record the table count, the moved apple’s destination, and that binary 10 and decimal 2 represent the same number. One minus one gives the remainder in the place being counted. The movement record accounts for the apple at its destination. Arithmetic and number notation describe quantities within stated rules; cite the actual transaction or movement when explaining a change in the real inventory. Read Nathan Tabor’s Tabor Reality Math and compare the scene count with the full inventory.',
    link = 'institution/foundation/reality-math/'
WHERE slug = 'survival-field-drill-15' AND path = 'mastery-learning';
