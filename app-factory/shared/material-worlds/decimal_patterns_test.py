import unittest
from decimal_patterns import LifeField, PatternIndex, IntegerLedger
class PatternsTest(unittest.TestCase):
    def test_shape_and_blinker(self):
        field=[[0]*5 for _ in range(5)];field[2][1:4]=[1,1,1]
        life=LifeField(5,field=field)
        expected=[[0]*5 for _ in range(5)]
        for r in (1,2,3):expected[r][2]=1
        self.assertEqual(life.step(),expected);self.assertEqual(life.step(),field)
        copy=life.step();copy[0][0]=1;self.assertEqual(life.field[0][0],0)
    def test_stable_block_and_seed(self):
        field=[[1,1,0],[1,1,0],[0,0,0]]
        self.assertEqual(LifeField(3,field=field).step(),field)
        self.assertEqual(LifeField(5,7).field,LifeField(5,7).field)
    def test_index_normalizes(self):
        index=PatternIndex(2);index.add('matching',[1,0]);index.add('large_wrong',[100,100])
        self.assertEqual(index.query([2,0])['asset_id'],'matching')
        self.assertIsNone(index.query([0,0]))
        with self.assertRaises(ValueError):index.query([1])
        with self.assertRaises(ValueError):index.add('bad',[float('nan'),1])
    def test_ledger(self):
        l=IntegerLedger();self.assertEqual(l.apply('one',1),1);self.assertEqual(l.apply('two',1),2)
        self.assertEqual(l.apply('remove',-1),1);self.assertEqual(l.apply('remove',-1),1)
        self.assertEqual(l.apply('last',-1),0)
        with self.assertRaises(ValueError):l.apply('overdraw',-1)
        with self.assertRaises(ValueError):l.apply('one',2)
if __name__=='__main__':unittest.main()
