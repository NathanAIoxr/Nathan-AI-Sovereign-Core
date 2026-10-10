"""Run with python -m unittest discover -s app-factory/radix-ladder -p 'test_*.py'."""
import unittest
from multibase_radix import encode, decode, table, connector_gate, RadixError

class TestRadix(unittest.TestCase):
    def test_decimal_33(self):
        expected={2:"100001",3:"1020",4:"201",5:"113",6:"53",7:"45",8:"41",9:"36",10:"33",12:"29",13:"27",17:"1G",21:"1C",33:"10",69:"X"}
        for base, value in expected.items():
            self.assertEqual(encode(33,base),value)

    def test_all_bases_round_trip(self):
        for base in range(2,70):
            for number in (0,1,11,33,69,102400,-997654321012345678901234567890):
                self.assertEqual(decode(encode(number,base),base),number)

    def test_duodecimal(self):
        self.assertEqual(encode(10,12),"↊")
        self.assertEqual(encode(11,12),"↋")
        self.assertEqual(decode("↊",12),10)

    def test_unary(self):
        self.assertEqual(encode(3,1),"111")
        self.assertEqual(decode("111",1),3)
        with self.assertRaises(RadixError): encode(10001,1)

    def test_zero_is_not_radix(self):
        with self.assertRaises(RadixError): encode(1,0)

    def test_gate(self):
        self.assertFalse(connector_gate(False,True,True)["can_send"])
        self.assertFalse(connector_gate(True,True,False)["can_send"])
        self.assertTrue(connector_gate(True,True,True)["can_send"])

    def test_bad_input(self):
        with self.assertRaises(RadixError): decode("Z",12)
        with self.assertRaises(TypeError): encode(0.1,12)

if __name__=="__main__":
    unittest.main()
