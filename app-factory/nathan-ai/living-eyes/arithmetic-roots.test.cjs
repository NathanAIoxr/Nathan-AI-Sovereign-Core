const {test}=require('node:test');const assert=require('node:assert/strict');const R=require('./arithmetic-roots.js');
test('retained encodings and binary logic calculate correctly',()=>{
 assert.equal(R.pingalaUddishta(R.pingalaNashta(5,4)),5);
 assert.equal(R.baconEncode('CODE'),'aaaba abbab aaabb aabaa');
 assert.equal(R.leibnizAdd(R.leibnizBinary(13),R.leibnizBinary(19)),'100000');
 assert.equal(R.booleXor(1,0),1);
});
test('Bacon classical 24-letter cipher round trips',()=>{for(const c of 'ABCDEFGHIKLMNOPQRSTUWXYZ')assert.equal(R.baconDecode(R.baconEncode(c)),c);assert.equal(R.baconDecode(R.baconEncode('J')), 'I')});
test('Napier letter locations round trip',()=>{for(let i=0;i<=1000;i++)assert.equal(R.fromNapier(R.toNapier(i)),i)});
test('Leibniz binary carries correctly',()=>{for(let a=0;a<100;a++)for(let b=0;b<100;b++)assert.equal(parseInt(R.leibnizAdd(a.toString(2),b.toString(2)),2),a+b)});
test('Boole arithmetic equivalent to truth tables',()=>{for(const a of [0,1])for(const b of [0,1]){assert.equal(R.booleAnd(a,b),a&b);assert.equal(R.booleOr(a,b),a|b);assert.equal(R.booleXor(a,b),a^b);assert.equal(R.booleNot(a),1-a)}});
test('all 4096 I Ching state transitions are valid',()=>{assert.equal(R.verify().transitions,4096);for(let s=0;s<64;s++)for(let mask=0;mask<64;mask++)assert.equal(R.iChingChange(R.iChingChange(s,mask),mask),s)});
test('all bounded Pingala patterns keep their index', () => {
  let limit = 1;
  for (let length = 1; length <= 10; length++) {
    limit += limit;
    for (let index = 1; index <= limit; index++) {
      assert.equal(R.pingalaUddishta(R.pingalaNashta(index, length)), index);
    }
  }
  assert.throws(() => R.pingalaNashta(3, 1), RangeError);
});

test('bounded base-60 conversions keep their quantity', () => {
  for (let number = 0; number <= 10000; number++) {
    assert.equal(R.sexagesimalDecode(R.sexagesimalEncode(number)), number);
  }
  assert.equal(R.sexagesimalDecode(R.sexagesimalEncode(1e9)), 1e9);
  assert.equal(R.sexagesimalDecode([0, 0, 0, 0, 0, 0, 1]), 1);
  assert.throws(() => R.sexagesimalDecode([59, 0, 0, 0, 0, 0]), RangeError);
});

test('BUILD and CLEAR validate their counts', () => {
  assert.equal(R.build(1, 1), 2);
  assert.equal(R.clear(1, 1), 0);
  assert.throws(() => R.build(-1, 2), RangeError);
  assert.throws(() => R.clear(1, 2), RangeError);
});

test('zero selected leaves nine items present', () => {
  assert.deepEqual(R.inventory(9, 0), { presentBefore: 9, selected: 0, moved: 0, presentAfter: 9 });
  assert.equal(R.inventory(9, 3).presentAfter, 9);
  assert.throws(() => R.inventory(9, 10), RangeError);
});

test('one transfer records Nunn at the origin and two entries for one movement', () => {
  assert.deepEqual(R.transfer(1, 1), {
    originBefore: 1, destinationBefore: 0, moved: 1, originAfter: 0, destinationAfter: 1,
    totalAfter: 1, ledgerEntries: 2, originReading: 'Nunn'
  });
  assert.equal(R.transfer(1, 0).ledgerEntries, 0);
  assert.equal(R.transfer(2, 1).originReading, undefined);
  assert.throws(() => R.transfer(1, 2), RangeError);
});

test('operation removals are reflected by the public API and the controls', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'arithmetic-roots.html'), 'utf8');
  assert.doesNotMatch(html, /value="(?:egypt|reciprocal|egyptFractions|euclid)"/);
  assert.match(html, /value="inventory"/);
  for (const name of ['egyptianMultiply', 'napierMultiply', 'reciprocalRegular', 'egyptianUnitFractions', 'euclidGcd']) {
    assert.equal(R[name], undefined);
  }
});
