#!/usr/bin/env python3
"""Nathan AI: Fencepost Error Syndrome worker service, by Nathan Tabor.

Independent deterministic boundary math. No network, credential access, edits,
charges, external actions, or execution of user-provided code.
"""
from __future__ import annotations
import argparse
from datetime import date, datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import random

VERSION = "one-boundary-workers.v1"
NAME = "FENCEPOST ERROR SYNDROME — by Nathan Tabor"
WORKERS = {
    "points": "Endpoint & Inclusive-Count Worker",
    "geometry": "Construction & Marker Worker",
    "calendar": "Calendar & Hospitality Worker",
    "subscription": "Subscription Boundary Worker",
    "clock": "DST-Safe Duration Worker",
    "array": "Index & Buffer Bounds Worker",
    "timeline": "Decade & Historical Anchor Worker",
    "music": "Shared-Endpoint Music Worker",
    "python_range": "Code Range Static-Review Worker",
}
ALLOWED_FIELDS = {
    "points": {"start", "end", "include_start", "include_end"},
    "geometry": {"shape", "measure", "quantity"},
    "calendar": {"start", "end", "measure"},
    "subscription": {"start", "covered_dates"},
    "clock": {"start", "end"},
    "array": {"length", "index"},
    "timeline": {"first_year", "interval_years", "number_of_events"},
    "music": {"first_degree", "middle_degree", "last_degree"},
    "python_range": {"source", "first_id", "last_id"},
}

class BoundaryContractError(ValueError):
    """Fail-closed error when the caller has not specified an exact contract."""


def integer(obj, name, minimum=None):
    value = obj.get(name)
    if type(value) is not int:
        raise BoundaryContractError(f"{name} requires a real integer; no string/bool coercion")
    if minimum is not None and value < minimum:
        raise BoundaryContractError(f"{name} must be >= {minimum}")
    return value


def string(obj, name):
    value = obj.get(name)
    if type(value) is not str or not value:
        raise BoundaryContractError(f"{name} requires a nonempty string")
    return value


def iso_date(obj, name):
    s = string(obj, name)
    try:
        parsed = date.fromisoformat(s)
    except ValueError as exc:
        raise BoundaryContractError(f"{name} must be ISO calendar date") from exc
    if parsed.isoformat() != s:
        raise BoundaryContractError(f"{name} must use YYYY-MM-DD")
    return parsed


def points(p):
    start, end = integer(p,"start"), integer(p,"end")
    a,b=p.get("include_start"),p.get("include_end")
    if type(a) is not bool or type(b) is not bool:
        raise BoundaryContractError("Both inclusive endpoint flags must be explicit booleans")
    if end < start:
        raise BoundaryContractError("Reversed range requires a separate directional contract")
    count = max(0, end-start+int(a)+int(b)-1)
    return {"count":count,"point_unit":"integer coordinates","gap_count":end-start,
            "first_included":start+int(not a) if count else None,
            "last_included":end-int(not b) if count else None}


def geometry(p):
    shape, measure = string(p,"shape"),string(p,"measure")
    if shape not in ("open","closed") or measure not in ("posts","sections"):
        raise BoundaryContractError("Explicit shape=open|closed and measure=posts|sections required")
    n=integer(p,"quantity",0)
    if shape=="closed" and n in (1,2):
        raise BoundaryContractError("Simple closed fence requires at least three posts/sections")
    if measure=="sections":
        posts=n+1 if shape=="open" and n else n
        return {"sections":n,"posts":posts,"shape":shape}
    sections=max(0,n-1) if shape=="open" else n
    return {"sections":sections,"posts":n,"shape":shape}


def calendar(p):
    s,e=iso_date(p,"start"),iso_date(p,"end")
    mode=string(p,"measure")
    if e<s:
        raise BoundaryContractError("End is before start")
    days=(e-s).days
    modes={"half_open_dates":days,"both_endpoint_dates":days+1,
           "strictly_between_dates":max(0,days-1),"hotel_nights":days}
    if mode not in modes:
        raise BoundaryContractError("calendar measure must be one of " + ", ".join(modes))
    return {"measure":mode,"count":modes[mode],"start":s.isoformat(),
            "end":e.isoformat(),"end_included":mode=="both_endpoint_dates",
            "last_covered_date":(e-timedelta(days=1)).isoformat() if days else None,
            "elapsed_calendar_days":days,
            "caution":"Night/date count is not elapsed seconds / 86400 across DST"}


def subscription(p):
    start=iso_date(p,"start")
    days=integer(p,"covered_dates",1)
    if days>100000:
        raise BoundaryContractError("Excessive duration")
    try:
        expiry=start+timedelta(days=days)
    except OverflowError as exc:
        raise BoundaryContractError("Date is out of supported range") from exc
    return {"start":start.isoformat(),"covered_dates":days,
            "last_covered_date":(expiry-timedelta(days=1)).isoformat(),
            "expiry_exclusive":expiry.isoformat(),
            "first_eligible_charge_date":expiry.isoformat(),
            "note":"No actual charge is performed; contract terms and time zone may alter billing"}


def clock(p):
    def parse(key):
        try:
            x=datetime.fromisoformat(string(p,key))
        except ValueError as exc:
            raise BoundaryContractError(f"{key} must be ISO timestamp with explicit UTC offset") from exc
        if x.tzinfo is None or x.utcoffset() is None:
            raise BoundaryContractError("A UTC offset is mandatory; do not guess a local time zone")
        return x.astimezone(timezone.utc)
    s,e=parse("start"),parse("end")
    if e<s:
        raise BoundaryContractError("End is before start")
    seconds=int((e-s).total_seconds())
    return {"elapsed_seconds":seconds,"elapsed_hours":seconds/3600,
            "whole_24_hour_periods":seconds//86400,
            "warning":"A calendar day can be 23 or 25 hours during daylight saving transitions"}


def array(p):
    n,i=integer(p,"length",0), integer(p,"index")
    ok=0<=i<n
    return {"valid":ok,"length":n,"last_valid_index":n-1 if n else None,
            "index":i,"requires_review":not ok}


def timeline(p):
    first=integer(p,"first_year")
    step=integer(p,"interval_years",1)
    count=integer(p,"number_of_events",1)
    last=first+(count-1)*step
    return {"first_event_year_coordinate":first,
            "last_event_year_coordinate":last,"event_count":count,
            "elapsed_years_to_last_event":(count-1)*step,
            "end_of_full_period_year_coordinate":first+count*step,
            "year_zero_model":"integer coordinates only; historical calendars may not have year zero"}


def music(p):
    a,b,c=(integer(p,k) for k in ("first_degree","middle_degree","last_degree"))
    if not a<=b<=c:
        raise BoundaryContractError("Music scale degrees must be in ascending order")
    first=b-a+1
    second=c-b+1
    combined=c-a+1
    assert first+second-1==combined
    return {"first_inclusive_degree_span":first,"second_inclusive_degree_span":second,
            "combined_degree_span":combined,"shared_degree_counted_once":b,
            "note":"Diatonic letter-degree count, not semitone distance or acoustic measurement"}


def python_range(p):
    import ast
    source=string(p,"source")
    if len(source)>100000:
        raise BoundaryContractError("Source text too large for bounded review")
    first,last=integer(p,"first_id"),integer(p,"last_id")
    if first>last:
        raise BoundaryContractError("Reversed target range")
    try:
        root=ast.parse(source)
    except SyntaxError as exc:
        raise BoundaryContractError("Source is not syntactically valid Python") from exc
    issues=[]
    for n in ast.walk(root):
        if not (isinstance(n,ast.Call) and isinstance(n.func,ast.Name)
                and n.func.id=="range" and len(n.args)==2):
            continue
        a,b=n.args
        if (isinstance(a,ast.Constant) and isinstance(b,ast.Constant)
                and type(a.value) is int and type(b.value) is int
                and a.value==first and b.value in (last,last+2)):
            issues.append({"line":n.lineno,"wrong_exclusive_stop":b.value,
                           "expected_exclusive_stop":last+1,
                           "reason":"omission" if b.value==last else "overrun"})
    return {"issues":issues,"auto_patch":False,
            "limit":"Literal two-argument Python range calls with provided target IDs only"}

IMPLEMENTATIONS={"points":points,"geometry":geometry,"calendar":calendar,
                 "subscription":subscription,"clock":clock,"array":array,
                 "timeline":timeline,"music":music,"python_range":python_range}


def execute(request):
    """Typed worker dispatcher. Every unknown or ambiguous request is blocked."""
    request_id=request.get("request_id") if isinstance(request,dict) else None
    base={"contract_version":VERSION,"name":NAME,"request_id":request_id,
          "remote_actions_performed":0,"authorization":"read_only"}
    try:
        if not isinstance(request,dict):
            raise BoundaryContractError("Request must be a JSON object")
        if set(request)-{"request_id","kind","inputs","expected"}:
            raise BoundaryContractError("Unexpected top-level fields")
        kind=string(request,"kind")
        if kind not in IMPLEMENTATIONS:
            raise BoundaryContractError("Unsupported or untyped boundary operation")
        p=request.get("inputs")
        if not isinstance(p,dict) or set(p)!=ALLOWED_FIELDS[kind]:
            raise BoundaryContractError("Inputs must contain exactly the specified fields: " + ", ".join(sorted(ALLOWED_FIELDS[kind])))
        outcome=IMPLEMENTATIONS[kind](p)
        expected=request.get("expected",{})
        if not isinstance(expected,dict) or any(k not in outcome or outcome[k]!=v for k,v in expected.items()):
            raise BoundaryContractError("Expected output mismatch; manual review required")
        body={**base,"status":"verified","worker":WORKERS[kind],"kind":kind,"result":outcome}
    except (BoundaryContractError,OverflowError) as exc:
        body={**base,"status":"blocked","reason":str(exc),"requires_review":True}
    body["sha256_receipt"]=hashlib.sha256(json.dumps(body,ensure_ascii=False,sort_keys=True,
                              separators=(",",":")).encode()).hexdigest()
    return body


def self_test(seed=1973,samples=10000):
    r=random.Random(seed)
    for _ in range(samples):
        s=r.randint(0,100000)
        n=r.randint(0,1000)
        p=points({"start":s,"end":s+n,"include_start":True,"include_end":False})
        q=points({"start":s,"end":s+n,"include_start":True,"include_end":True})
        assert p["count"]==n and q["count"]==n+1
        assert geometry({"shape":"open","measure":"sections","quantity":n})["posts"]==n+(n>0)
        assert array({"length":n,"index":n})["valid"] is False
        assert array({"length":n,"index":n-1})["valid"] is (n>0)
    return {"checks":samples,"passed":True,"seed":seed}


def demo():
    cases={
       "range_99":{"kind":"points","inputs":{"start":65,"end":163,"include_start":True,"include_end":True},"expected":{"count":99}},
       "reverse_fencepost":{"kind":"geometry","inputs":{"shape":"open","measure":"posts","quantity":10},"expected":{"sections":9}},
       "regular_fencepost":{"kind":"geometry","inputs":{"shape":"open","measure":"sections","quantity":10},"expected":{"posts":11}},
       "seven_dates":{"kind":"calendar","inputs":{"start":"2026-11-15","end":"2026-11-22","measure":"half_open_dates"},"expected":{"count":7}},
       "eight_date_names":{"kind":"calendar","inputs":{"start":"2026-11-15","end":"2026-11-22","measure":"both_endpoint_dates"},"expected":{"count":8}},
       "six_interior":{"kind":"calendar","inputs":{"start":"2026-11-15","end":"2026-11-22","measure":"strictly_between_dates"},"expected":{"count":6}},
       "dst_23_hour_day":{"kind":"clock","inputs":{"start":"2026-03-08T00:00:00-05:00","end":"2026-03-09T00:00:00-04:00"},"expected":{"elapsed_hours":23.0}},
       "trial_expiry":{"kind":"subscription","inputs":{"start":"2026-11-15","covered_dates":7}},
       "hotel_nights":{"kind":"calendar","inputs":{"start":"2026-06-01","end":"2026-06-05","measure":"hotel_nights"},"expected":{"count":4}},
       "array_last_index":{"kind":"array","inputs":{"length":10,"index":10},"expected":{"valid":False}},
       "long_cycle":{"kind":"timeline","inputs":{"first_year":1993,"interval_years":10,"number_of_events":120},"expected":{"last_event_year_coordinate":3183}},
       "third_plus_third":{"kind":"music","inputs":{"first_degree":1,"middle_degree":3,"last_degree":5},"expected":{"combined_degree_span":5}},
       "python_overrun":{"kind":"python_range","inputs":{"source":"for x in range(0, 11): pass","first_id":0,"last_id":9},"expected":{"issues":[{"line":1,"wrong_exclusive_stop":11,"expected_exclusive_stop":10,"reason":"overrun"}]}},
       "unknown_mode_blocked":{"kind":"calendar","inputs":{"start":"2026-11-15","end":"2026-11-22","measure":"days"}},
    }
    responses={k:execute(v) for k,v in cases.items()}
    assert all(v["status"]=="verified" for k,v in responses.items() if k!="unknown_mode_blocked")
    assert responses["unknown_mode_blocked"]["status"]=="blocked"
    return {"name":NAME,"service":VERSION,"cases":responses,"property_test":self_test(),
            "live_google_systems_tested":0,"real_systems_mutated":0}


def main():
    ap=argparse.ArgumentParser(description=NAME)
    ap.add_argument("--demo",action="store_true")
    ap.add_argument("--request-file",type=Path)
    ap.add_argument("--output",type=Path)
    args=ap.parse_args()
    if args.demo==bool(args.request_file):
        ap.error("Supply exactly one of --demo or --request-file")
    output=demo() if args.demo else execute(json.loads(args.request_file.read_text(encoding="utf-8")))
    text=json.dumps(output,ensure_ascii=False,indent=2)+"\n"
    if args.output:
        args.output.write_text(text,encoding="utf-8")
    print(text)

if __name__=="__main__":
    main()
