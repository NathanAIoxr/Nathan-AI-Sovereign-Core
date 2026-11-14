#!/usr/bin/env python3
"""Run: python -m unittest -v test_hives.py"""
from collections import Counter
import tempfile
from pathlib import Path
import unittest

from hives import (connect, read_roster, WORKERS_PER_HIVE, EPI_ROLES,
                   COPIES_PER_ROLE, build_atom, capacity_by_particles,
                   worker_address, validate_spec, record_review, execute_worker, execute_family_leads, summary)

class ParticleHiveTests(unittest.TestCase):
    def test_role_roster_exact(self):
        roster = read_roster()
        self.assertEqual(len(roster), 100)
        self.assertEqual([r['id'] for r in roster], list(range(1233,1333)))
        self.assertEqual(COPIES_PER_ROLE, 500)

    def test_exact_very_large_counts(self):
        self.assertEqual(capacity_by_particles(101*10**50),505*10**54)
        self.assertEqual(capacity_by_particles(232*10**78),116*10**83)
        self.assertRaises(ValueError,capacity_by_particles,-1)
        self.assertRaises(ValueError,capacity_by_particles,1.0)

    def test_distinct_roles_and_ids(self):
        roster=read_roster()
        a=worker_address('demo/proton/000001',0,roster)
        b=worker_address('demo/neutron/000001',0,roster)
        self.assertNotEqual(a['worker_id'],b['worker_id'])
        self.assertEqual(a['role_id'],1233)
        self.assertEqual(worker_address('demo/proton/000001',499,roster)['role_id'],1233)
        self.assertEqual(worker_address('demo/proton/000001',500,roster)['role_id'],1234)
        self.assertEqual(worker_address('demo/proton/000001',49999,roster)['role_id'],1332)

    def test_three_hives_materialized_individually(self):
        with tempfile.TemporaryDirectory() as folder:
            db=connect(Path(folder)/'test.sqlite')
            try:
                with db:
                    h=build_atom(db,'H2',1,1,1,'An explicit human-approved purpose',True)
                self.assertEqual(len(h),3)
                self.assertEqual(len(set(h)),3)
                report=summary(db)
                self.assertEqual(report['registered_hives'],3)
                self.assertEqual(report['addressable_worker_slots'],150000)
                self.assertEqual(report['materialized_worker_records'],150000)
                self.assertEqual(db.execute('SELECT COUNT(DISTINCT worker_id) FROM workers').fetchone()[0],150000)
                counts = db.execute('SELECT hive_id,COUNT(*),COUNT(DISTINCT role_id) FROM workers GROUP BY hive_id').fetchall()
                self.assertEqual(len(counts),3)
                self.assertTrue(all((n,roles)==(50000,100) for _,n,roles in counts))
                self.assertEqual(db.execute('SELECT COUNT(*) FROM workers WHERE role_id=1233').fetchone()[0],1500)
                with db:
                    self.assertEqual(build_atom(db,'H2',1,1,1,'An explicit human-approved purpose',True),h)
                self.assertEqual(summary(db)['materialized_worker_records'],150000)
                with db:
                    result=record_review(db,h[0],{'claims':[{'tier':'DOS'}],
                    'fractions':[{'numerator':1,'denominator':0}]})
                self.assertEqual(result['result']['errors'][0]['rule'],13)
                self.assertEqual(summary(db)['events'],1)
                with db:
                    executed=execute_worker(db,h[0],0,{'claims':[{'tier':'DOS'}]})
                    family_results=execute_family_leads(db,h[0],{'claims':[{'tier':'DOS'}]})
                self.assertEqual(executed['worker']['role_id'],1233)
                self.assertEqual(len(family_results),10)
                self.assertEqual(len({r['worker']['family'] for r in family_results}),10)
                self.assertEqual(summary(db)['events'],12)
            finally:
                db.close()

    def test_checks_are_not_a_false_proof(self):
        out=validate_spec({'measurements':[{'value':'0.1','unit':'meters'}],
                          'intervals':[{'start':0,'end':10}],
                          'fractions':[{'numerator':1,'denominator':2}],
                          'items':[{'id':'a'},{'id':'b'}],
                          'ordered_steps':[{'sequence':0}],
                          'claims':[{'tier':'CERO'}],
                          'time':{'utc_iso':'2026-11-13T19:00:00Z','duration_monotonic_seconds':1.2}})
        self.assertEqual(out['errors'],[])
        self.assertEqual(out['status'],'requires_review')
        self.assertIn(13,out['rules_attempted'])
        self.assertEqual(validate_spec({'items':[{'id':'a'},{'id':'a'}]})['errors'][0]['rule'],5)

if __name__=='__main__':unittest.main()
