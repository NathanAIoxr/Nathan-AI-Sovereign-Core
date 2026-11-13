#!/usr/bin/env python3
"""Handling Life public-source identity-triage worker. No takedown submissions.

This is a bounded scheduled harvester, not image/audio forensics. It writes
case METADATA to the owner's private Airtable ONLY when explicitly configured.
No PII scraped from article bodies, no auto 'verified me' conclusion.
"""
import argparse
import hashlib
import html
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

NAME = "Nathan Tabor"
POSITIVE = (
    "Handling Life", "Revival Soy", "Renatus", "Law of Order",
    "Beast on the East River", "Modern-Day Jonah", "123 Easy Install",
    "The Conservative Voice", "apartment flipping", "Ivy Lee Method",
)
NOT_ME = (
    "children's book", "childrens book", "toddler book",
    "picture book", "bedtime story",
)
RISK = {
    "FAKE_AI_IMPERSONATION": ("deepfake", "fake endorsement", "voice clone",
                              "impersonation account", "fake profile"),
    "REPUTATION_THREAT": ("doxxing", "private address exposed",
                          "phone number exposed", "data broker listing"),
}
UA = "HandlingLifeIdentityDefense/0.3 (+public-news-rss; owner-operated)"
MAX_ITEMS = 30


def case_key(link):
    return "IDDEF-" + hashlib.sha256(link.encode("utf-8")).hexdigest()[:24]


def clean(value):
    return html.unescape(re.sub(r"<[^>]*>", "", value or "")).strip()


def triage(title, summary):
    """Buckets describe *unverified leads*, never legal or forensic findings."""
    t = clean(title + " " + summary).casefold()
    if NAME.casefold() not in t and "john nathan tabor" not in t:
        return None
    positive = [x for x in POSITIVE if x.casefold() in t]
    negative = [x for x in NOT_ME if x.casefold() in t]
    if positive and negative:
        return ("NEEDS_REVIEW", "Conflicting identity anchors; manual source check required")
    if negative:
        return ("NAME_TWIN", "Other-person keyword; verify source before final exclusion")
    for bucket, terms in RISK.items():
        if any(k in t for k in terms):
            return (bucket, "Potential issue from public snippet; human assessment required")
    if positive:
        return ("NEEDS_REVIEW", "Positive identity anchor present; owner confirmation required")
    return ("NEEDS_REVIEW", "Name alone does not establish identity")


def get_news(max_items=MAX_ITEMS):
    query = urllib.parse.urlencode({"q": '"' + NAME + '"', "hl": "en-US",
                                     "gl": "US", "ceid": "US:en"})
    url = "https://news.google.com/rss/search?" + query
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=12) as response:
        body = response.read(1_500_000)
    root = ET.fromstring(body)
    records = []
    for item in root.findall(".//item")[:max_items]:
        def field(tag):
            node = item.find(tag)
            return clean(node.text if node is not None else "")
        link = field("link")
        if not link.startswith(("https://", "http://")):
            continue
        records.append({"title": field("title"), "source_url": link,
                        "description": field("description"),
                        "published": field("pubDate")})
    return records


def safe_url(link):
    """Remove query and fragment to avoid syncing tracking/personal tokens."""
    u = urllib.parse.urlsplit(link)
    if u.scheme not in ("http", "https") or not u.hostname:
        return ""
    return urllib.parse.urlunsplit((u.scheme, u.netloc, u.path, "", ""))


def case_from_news(item):
    decision = triage(item["title"], item["description"])
    if not decision:
        return None
    bucket, why = decision
    link = safe_url(item["source_url"])
    if not link:
        return None
    return {"Case Label": clean(item["title"])[:150],
            "Case Key": case_key(link),
            "Profile Key": "HANDLING-LIFE-NATHAN-TABOR",
            "Source URL": link,
            "Source Type": "Google News RSS snippet",
            "Classification": bucket,
            "Verification": "Unverified",
            "Assignee Worker": "identity-triage",
            "Owner Approval Required": True,
            "Safe Summary": why,
            "Next Action": "Review underlying source, verify identity and evidence; do not auto-submit takedowns"}


def airtable_sync(cases, token, base_id, table_id):
    """Create new leads ONLY: preserve any prior owner reviews and resolutions."""
    endpoint = ("https://api.airtable.com/v0/" +
                urllib.parse.quote(base_id, safe="") + "/" +
                urllib.parse.quote(table_id, safe=""))
    synced = 0
    headers = {"Authorization": "Bearer " + token,
               "Content-Type": "application/json", "User-Agent": UA}
    for case in cases:
        # Case Key is generated as IDDEF-[0-9a-f], safe to embed in the formula.
        key = case["Case Key"]
        formula = "{Case Key}='" + key + "'"
        lookup = endpoint + "?" + urllib.parse.urlencode({"filterByFormula": formula,
                                                             "maxRecords": 1})
        with urllib.request.urlopen(urllib.request.Request(lookup, headers=headers),
                                    timeout=20) as response:
            existing = json.load(response).get("records", [])
        if existing:
            continue
        payload = json.dumps({"records": [{"fields": case}], "typecast": False}).encode("utf-8")
        req = urllib.request.Request(endpoint, data=payload, method="POST",
                                     headers=headers)
        with urllib.request.urlopen(req, timeout=20) as response:
            response.read(65536)
        synced += 1
    return synced


def run(scan):
    if scan:
        try:
            records = get_news()
        except (OSError, ET.ParseError, urllib.error.URLError) as e:
            print("Collection unavailable; no changes made.", file=sys.stderr)
            return 0  # intermittent RSS failures must not modify stored cases
    else:
        records = [
          {"title": "Nathan Tabor discusses Handling Life", "source_url":
           "https://example.org/handling-life", "description": "Handling Life"},
          {"title": "Nathan Tabor bedtime story author", "source_url":
           "https://example.org/bedtime", "description": "children's book"}
        ]
    cases = []
    seen = set()
    for item in records:
        c = case_from_news(item)
        if c and c["Case Key"] not in seen:
            cases.append(c)
            seen.add(c["Case Key"])
    token = os.getenv("AIRTABLE_TOKEN", "").strip()
    base = os.getenv("AIRTABLE_BASE_ID", "").strip()
    table = os.getenv("AIRTABLE_CASE_TABLE_ID", "").strip()
    sync_enabled = bool(token and base and table and scan)
    synced = airtable_sync(cases, token, base, table) if sync_enabled else 0
    print(json.dumps({"source": "Google News RSS" if scan else "offline fixtures",
        "scanned": len(records), "case_candidates": len(cases),
        "synced_private_airtable": synced, "integration_active": sync_enabled,
        "human_verified": 0, "takedowns_sent": 0}, sort_keys=True))
    return 0


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--scan", action="store_true", help="Bounded real RSS scan")
    args = p.parse_args()
    sys.exit(run(args.scan))
