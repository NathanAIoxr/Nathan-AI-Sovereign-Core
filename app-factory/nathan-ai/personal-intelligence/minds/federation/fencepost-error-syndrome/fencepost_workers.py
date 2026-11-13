#!/usr/bin/env python3
"""FENCEPOST ERROR SYNDROME — by Nathan Tabor.
Bounded, deterministic multi-bot boundary audit. No network, execution of
untrusted code, input mutation, financial actions or automatic external patching.
"""
from __future__ import annotations
import argparse
import ast
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
import random

CANON = "Fencepost Error Syndrome — by Nathan Tabor"
SCOPE = "simulation_only; no Google service inspected or changed"

def canonical_json(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def receipt(payload):
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()

class RosterSentinel:
    """Audit per-family inclusive ID ranges and unique role assignments."""
    name = "Roster Sentinel"

    @staticmethod
    def audit(families):
        id_owner, issues = {}, []
        for fam in families:
            fid = fam["family_id"]
            first, last = fam["member_first"], fam["member_last"]
            if first > last:
                issues.append({"family_id":fid, "error":"reversed_boundary"})
                continue
            expected = set(range(first, last+1))
            actual = {m["member_id"] for m in fam["members"]}
            for member in fam["members"]:
                mid = member["member_id"]
                if mid in id_owner:
                    issues.append({"family_id":fid, "member_id":mid,
                                   "error":"duplicate_id","also_seen_in":id_owner[mid]})
                id_owner[mid] = fid
            if actual != expected:
                issues.append({"family_id":fid,"error":"range_mismatch",
                               "missing":sorted(expected-actual),
                               "outside":sorted(actual-expected)})
        return {"worker":RosterSentinel.name,"family_count":len(families),
                "member_count":len(id_owner),"issues":issues,"passed":not issues}

    @staticmethod
    def schedule(families, days, delta):
        """0 = exclusive-end omission, 1 = correct, 2 = one-extra overrun."""
        valid_ids = {m["member_id"] for f in families for m in f["members"]}
        valid = missing = duplicates = ghosts = attempts = 0
        first_day = None
        for day in range(days):
            seen = {}
            for f in families:
                for mid in range(f["member_first"],f["member_last"]+delta):
                    seen[mid] = seen.get(mid,0)+1
                    attempts += 1
            valid += len(valid_ids & seen.keys())
            missed = sorted(valid_ids-seen.keys())
            doubled = sorted(n for n,c in seen.items() if n in valid_ids and c>1)
            imaginary = sorted(n for n in seen if n not in valid_ids)
            missing += len(missed)
            duplicates += sum(c-1 for n,c in seen.items() if n in valid_ids and c>1)
            ghosts += sum(c for n,c in seen.items() if n not in valid_ids)
            if first_day is None:
                first_day = {"day_index":day,"missing_ids":missed,
                             "duplicate_ids":doubled,"invalid_ids":imaginary}
        return {"attempts":attempts,"valid_unique_role_days":valid,
                "omitted_role_days":missing,"duplicate_role_days":duplicates,
                "invalid_role_days":ghosts,"first_day":first_day}

class CodeSentinel:
    """Conservative AST analysis of literal Python ranges against supplied spec."""
    name = "Code Sentinel"

    @staticmethod
    def scan_python(source, first, last):
        tree = ast.parse(source)
        risks = []
        for node in ast.walk(tree):
            if not (isinstance(node,ast.Call) and isinstance(node.func,ast.Name)
                    and node.func.id=="range" and len(node.args)==2):
                continue
            a,b = node.args
            if not (isinstance(a,ast.Constant) and isinstance(b,ast.Constant)
                    and type(a.value) is int and type(b.value) is int):
                continue
            if a.value != first:
                continue
            if b.value in (last,last+2):
                risks.append({"line":node.lineno,
                              "type":"excluded_last_member" if b.value==last else "one_past_required_end",
                              "observed_stop_exclusive":b.value,
                              "corrected_suggestion":f"range({first}, {last+1})"})
        return {"worker":CodeSentinel.name,"issues":risks,
                "scope":"literal Python range(first, stop) matching supplied inclusive specification",
                "auto_patch_applied":False}

class CalendarSynchronizer:
    name = "Calendar Synchronizer"

    @staticmethod
    def summarize(start,end):
        s,e = date.fromisoformat(start),date.fromisoformat(end)
        if e<=s:
            raise ValueError("End must be later than start")
        n=(e-s).days
        return {"worker":CalendarSynchronizer.name,"start":start,
                "end_exclusive":end,"scheduled_dates":n,
                "named_dates_inclusive_of_both_endpoints":n+1,
                "named_dates_strictly_between":n-1,
                "last_scheduled_date":(e-timedelta(days=1)).isoformat(),
                "interval_notation":"[start, end)",
                "warning":"Calendar dates are not always 24-hour durations across daylight-saving changes"}

class SubscriptionGuard:
    name = "Subscription Guard"

    @staticmethod
    def expire(start,days):
        if days<1:
            raise ValueError("Duration must be positive")
        s=date.fromisoformat(start)
        expiry=s+timedelta(days=days)
        return {"worker":SubscriptionGuard.name,"start":start,
                "expiry_exclusive":expiry.isoformat(),
                "last_covered_date":(expiry-timedelta(days=1)).isoformat(),
                "trial_days":days,"bill_on_or_after":expiry.isoformat(),
                "early_charge_defect_example":(expiry-timedelta(days=1)).isoformat()}

class HotelStayGuard:
    name="Hotel Stay Guard"

    @staticmethod
    def nights(checkin,checkout):
        s,e=date.fromisoformat(checkin),date.fromisoformat(checkout)
        if e<=s:
            raise ValueError("Checkout must follow check-in")
        return {"worker":HotelStayGuard.name,"nights":(e-s).days,
                "checkin_included":True,"checkout_day_included_as_night":False}

class MaterialCountGuard:
    name="Material Count Guard"

    @staticmethod
    def fence(length,spacing,shape="open"):
        try:
            length,spacing=Decimal(str(length)),Decimal(str(spacing))
        except InvalidOperation as exc:
            raise ValueError("Invalid decimal input") from exc
        if not (length.is_finite() and spacing.is_finite() and length>0 and spacing>0):
            raise ValueError("Length and spacing must be positive finite decimals")
        if length%spacing:
            raise ValueError("This precise-spacing example requires divisible length")
        if shape not in ("open","closed"):
            raise ValueError("Shape must be open or closed")
        segments=int(length/spacing)
        return {"worker":MaterialCountGuard.name,"shape":shape,
                "segments":segments,"required_posts":segments+(shape=="open"),
                "incorrect_posts_if_counted_as_segments":segments,
                "missing_posts_in_bug":int(shape=="open")}

class ArrayIndexGuard:
    name="Array Index Guard"

    @staticmethod
    def inspect(length,attempted_index):
        if length<0:
            raise ValueError("Length cannot be negative")
        valid=0<=attempted_index<length
        return {"worker":ArrayIndexGuard.name,"length":length,
                "attempted_index":attempted_index,"valid":valid,
                "last_valid_index":length-1 if length else None,
                "autofix":"review_required" if not valid else "not_needed"}

class FamilyONEGate:
    name="Family 21 — ONE"

    @staticmethod
    def evaluate(proposed_action="local_audit",authorized=False):
        external=proposed_action!="local_audit"
        return {"worker":FamilyONEGate.name,"approved":not external or bool(authorized),
                "human_approval_required":external,"action_executed":False,
                "rule":"Equal standing; permissions cannot be inferred from AI classification"}

def invariant_tests(trials=10000,seed=1973):
    rng=random.Random(seed)
    for _ in range(trials):
        first=rng.randint(0,1_000_000)
        size=rng.randint(1,250)
        last=first+size-1
        assert last-first+1==size
        assert len(range(first,last+1))==size
        assert len(range(first,last))==size-1
        assert ArrayIndexGuard.inspect(size,size-1)["valid"] is True
        assert ArrayIndexGuard.inspect(size,size)["valid"] is False
    return {"checks":trials,"seed":seed,"passed":True}

def demo_families():
    return [{"family_id":f,"member_first":65+(f-65)*9,
             "member_last":73+(f-65)*9,
             "members":[{"member_id":n}
                        for n in range(65+(f-65)*9,74+(f-65)*9)]}
            for f in range(65,76)]

def simulate(days=7,family_roster=None):
    if not isinstance(days,int) or not 1<=days<=365:
        raise ValueError("Days must be 1..365")
    families=family_roster or demo_families()
    audit=RosterSentinel.audit(families)
    if not audit["passed"]:
        raise ValueError("Refuse to simulate malformed member roster")
    roster={name:RosterSentinel.schedule(families,days,delta)
            for name,delta in [("missing_end_bug",0),("overrun_bug",2),("fixed",1)]}
    expected=sum(len(f["members"]) for f in families)*days
    assert roster["fixed"]["valid_unique_role_days"]==expected
    assert all(roster["fixed"][k]==0 for k in
               ("omitted_role_days","duplicate_role_days","invalid_role_days"))
    calendar=CalendarSynchronizer.summarize("2026-11-15","2026-11-22")
    sub=SubscriptionGuard.expire("2026-11-15",7)
    hotel=HotelStayGuard.nights("2026-11-15","2026-11-22")
    fence=MaterialCountGuard.fence(70,10)
    return {"title":CANON,"kind":"deterministic synthetic worker-bot simulation",
            "deployment":SCOPE,
            "assumptions":{"member_roster":"11 families × 9 members","member_days":days,
                           "subscription_examples":1000,"hotel_booking_examples":200,
                           "fence_examples":25,"array_access_examples":500,
                           "exposure":"one deliberately faulty boundary per example"},
            "worker_bots":[RosterSentinel.name,CodeSentinel.name,
                           CalendarSynchronizer.name,SubscriptionGuard.name,
                           HotelStayGuard.name,MaterialCountGuard.name,
                           ArrayIndexGuard.name,FamilyONEGate.name],
            "roster":{"expected_role_days":expected,"scenarios":roster,
                      "covered_before_percent":round(100*roster["missing_end_bug"]["valid_unique_role_days"]/expected,2),
                      "covered_after_percent":100,
                      "recovered_role_days":roster["missing_end_bug"]["omitted_role_days"],
                      "eliminated_duplicate_role_days":roster["overrun_bug"]["duplicate_role_days"],
                      "eliminated_phantom_role_days":roster["overrun_bug"]["invalid_role_days"]},
            "calendar":calendar,
            "subscriptions":{"policy":sub,"simulated_early_charge_cases_before":1000,"after":0},
            "hotels":{"policy":hotel,"extra_nights_billed_before":200,"after":0},
            "construction":{"policy":fence,"missing_posts_before":25,"missing_posts_after":0},
            "arrays":{"bad_last_index_attempts_before":500,"after":0,
                      "length":64,"valid_last_index":ArrayIndexGuard.inspect(64,63)["last_valid_index"]},
            "code_review":CodeSentinel.scan_python("for m in range(65, 163):\n    pass",65,163),
            "authorization":FamilyONEGate.evaluate("external_patch",False),
            "property_tests":invariant_tests(),
            "impact_scope":"Modeled defects in test cases only; actual industry impact unknown",
            "real_world_tasks_completed":0}

def main():
    p=argparse.ArgumentParser(description=CANON)
    p.add_argument("--days",type=int,default=7)
    p.add_argument("--output",type=Path)
    a=p.parse_args()
    result=simulate(a.days)
    result["sha256_receipt"]=receipt(result)
    body=json.dumps(result,ensure_ascii=False,indent=2)+"\n"
    if a.output:
        a.output.write_text(body,encoding="utf-8")
    print(body)

if __name__=="__main__":
    main()
