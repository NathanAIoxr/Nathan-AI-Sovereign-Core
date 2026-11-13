import unittest
from boundary_engine import execute, self_test, demo, VERSION, NAME
from nathan_ai_boundary_gateway import dispatch_boundary_request


def call(kind, **kw):
    return execute({'kind': kind, 'inputs': kw})


class TestWorkerBoundaryGateway(unittest.TestCase):
    def test_author_title(self):
        self.assertEqual(NAME, 'FENCEPOST ERROR SYNDROME — by Nathan Tabor')

    def test_zero_one_two_half_open(self):
        for n in (0, 1, 2):
            self.assertEqual(call('points',start=0,end=n,include_start=True,include_end=False)['result']['count'], n)

    def test_zero_one_two_closed(self):
        for n in (0, 1, 2):
            self.assertEqual(call('points',start=0,end=n,include_start=True,include_end=True)['result']['count'], n+1)

    def test_open_points_start_equals_end(self):
        self.assertEqual(call('points',start=9,end=9,include_start=False,include_end=False)['result']['count'], 0)

    def test_single_inclusive_point(self):
        r=call('points',start=9,end=9,include_start=True,include_end=True)['result']
        self.assertEqual((r['count'],r['first_included'],r['last_included']),(1,9,9))

    def test_reverse_fencepost(self):
        self.assertEqual(call('geometry',shape='open',measure='posts',quantity=10)['result']['sections'], 9)

    def test_regular_fencepost(self):
        self.assertEqual(call('geometry',shape='open',measure='sections',quantity=10)['result']['posts'], 11)

    def test_closed_shape(self):
        self.assertEqual(call('geometry',shape='closed',measure='sections',quantity=10)['result']['posts'],10)

    def test_closed_shape_invalid(self):
        self.assertEqual(call('geometry',shape='closed',measure='sections',quantity=2)['status'],'blocked')

    def test_dates_six_seven_eight(self):
        expected={'half_open_dates':7,'both_endpoint_dates':8,'strictly_between_dates':6}
        for m,n in expected.items():
            self.assertEqual(call('calendar',start='2026-11-15',end='2026-11-22',measure=m)['result']['count'],n)

    def test_hotel_nights(self):
        self.assertEqual(call('calendar',start='2026-06-01',end='2026-06-05',measure='hotel_nights')['result']['count'],4)

    def test_dst_clock_march(self):
        r=call('clock',start='2026-03-08T00:00:00-05:00',end='2026-03-09T00:00:00-04:00')['result']
        self.assertEqual(r['elapsed_hours'],23)

    def test_dst_clock_november(self):
        r=call('clock',start='2026-11-01T00:00:00-04:00',end='2026-11-02T00:00:00-05:00')['result']
        self.assertEqual(r['elapsed_hours'],25)

    def test_clock_requires_offset(self):
        self.assertEqual(call('clock',start='2026-03-08T00:00:00',end='2026-03-09T00:00:00')['status'],'blocked')

    def test_subscription_expiry(self):
        r=call('subscription',start='2026-11-15',covered_dates=7)['result']
        self.assertEqual((r['last_covered_date'],r['expiry_exclusive']),('2026-11-21','2026-11-22'))

    def test_array_ten(self):
        self.assertTrue(call('array',length=10,index=9)['result']['valid'])
        self.assertFalse(call('array',length=10,index=10)['result']['valid'])

    def test_long_timeline(self):
        r=call('timeline',first_year=1993,interval_years=10,number_of_events=120)['result']
        self.assertEqual((r['last_event_year_coordinate'],r['end_of_full_period_year_coordinate']),(3183,3193))

    def test_music_shared_endpoint(self):
        r=call('music',first_degree=1,middle_degree=3,last_degree=5)['result']
        self.assertEqual((r['first_inclusive_degree_span'],r['second_inclusive_degree_span'],r['combined_degree_span']),(3,3,5))

    def test_python_scan_catches_undercount(self):
        r=call('python_range',source='for i in range(65, 163): pass',first_id=65,last_id=163)['result']
        self.assertEqual(r['issues'][0]['reason'],'omission')

    def test_python_scan_catches_overcount(self):
        r=call('python_range',source='for i in range(65, 165): pass',first_id=65,last_id=163)['result']
        self.assertEqual(r['issues'][0]['reason'],'overrun')

    def test_python_scan_not_executed(self):
        r=call('python_range',source='__import__("os").system("echo SHOULD_NOT_RUN")',first_id=0,last_id=1)
        self.assertEqual(r['status'],'verified')
        self.assertEqual(r['result']['issues'],[])

    def test_untyped_days_blocked(self):
        self.assertEqual(call('calendar',start='2026-11-15',end='2026-11-22',measure='days')['status'],'blocked')

    def test_missing_endpoint_flag_blocked(self):
        self.assertEqual(call('points',start=0,end=1,include_start=True)['status'],'blocked')

    def test_unknown_action_blocked(self):
        self.assertEqual(call('remote_write',url='https://example.org')['status'],'blocked')

    def test_extra_field_blocked(self):
        self.assertEqual(call('array',length=10,index=10,autofix=True)['status'],'blocked')

    def test_boolean_not_integer(self):
        self.assertEqual(call('array',length=True,index=0)['status'],'blocked')

    def test_expected_mismatch_blocks(self):
        req={'kind':'points','inputs':{'start':0,'end':2,'include_start':True,'include_end':False},'expected':{'count':3}}
        self.assertEqual(execute(req)['status'],'blocked')

    def test_receipt_determinism(self):
        r=call('array',length=10,index=9)
        self.assertEqual(r['sha256_receipt'],call('array',length=10,index=9)['sha256_receipt'])

    def test_gw_delegates_identically(self):
        q={'kind':'array','inputs':{'length':10,'index':10}}
        self.assertEqual(dispatch_boundary_request(q),execute(q))

    def test_demo(self):
        d=demo()
        self.assertEqual(len(d['cases']),14)
        self.assertEqual(d['cases']['unknown_mode_blocked']['status'],'blocked')
        self.assertEqual(d['property_test']['checks'],10000)
        self.assertEqual(d['real_systems_mutated'],0)

    def test_property_10000(self):
        self.assertTrue(self_test()['passed'])


if __name__=='__main__': unittest.main()
