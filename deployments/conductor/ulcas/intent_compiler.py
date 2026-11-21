"""Compile Nathan Tabor's shorthand into typed Node X requests."""
import argparse
from dataclasses import dataclass
import json
import os
import re
from pathlib import Path
import sys
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import ProxyHandler, Request, build_opener

from node_x import CID, FORWARD, MUTATIONS, SHA, UNIT, NoRedirect, canonical, digest, match

REPO = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+")
HEX256 = re.compile(r"[0-9a-f]{64}")


@dataclass(frozen=True)
class Contract:
    risk: str
    say: tuple[str, ...]
    steps: tuple[str, ...]


CONTRACTS = {
    "build it": Contract("MEDIUM", (
        "Validate the registered service manifest.",
        "Stage the GitHub change for human approval.",
        "Verify the resulting commit through Lane 8 when its SHA is available.",
    ), ("config.validate", "github.propose", "github.verify")),
    "check it": Contract("LOW", (
        "Check the registered service and collect host metrics.",
        "Read the matching receipts at X.",
    ), ("service.status", "system.snapshot")),
    "ship it": Contract("HIGH", (
        "Validate the configuration and stage the release.",
        "Verify the release commit before staging the service restart.",
        "Changing operations require human approval.",
    ), ("config.validate", "github.propose", "github.verify", "service.restart")),
    "audit it": Contract("LOW", (
        "Collect host metrics and read the requested crossing history.",
        "Check the returned event digests and any adjacent chain links.",
    ), ("system.snapshot", "ledger.read")),
    "lock it": Contract("HIGH", (
        "Check the service and stage the configuration lock proposal.",
        "Create a ledger checkpoint after the preceding steps succeed.",
    ), ("service.status", "github.propose", "ledger.checkpoint")),
}


def compile_plan(phrase, target, *, declarations=None, request_id=None):
    if not isinstance(phrase, str):
        raise ValueError("phrase must be text")
    command = " ".join(phrase.casefold().split())
    if command not in CONTRACTS:
        raise ValueError("unrecognized phrase. Supported: " + ", ".join(CONTRACTS))
    if not isinstance(target, dict) or target.keys() - {
        "service", "repository", "revision", "services", "change_digest", "audit_cid"
    }:
        raise ValueError("invalid target profile")
    target = json.loads(canonical(target))
    if (declarations is not None and (not isinstance(declarations, list) or len(declarations) > 20
        or any(not isinstance(item, str) or len(item) > 1500 for item in declarations))):
        raise ValueError("declarations must be an array of up to 20 text strings")
    if request_id is not None and not match(CID, request_id):
        raise ValueError("invalid request ID")
    contract = CONTRACTS[command]
    service, repository = target.get("service"), target.get("repository")
    revision, change = target.get("revision"), target.get("change_digest")
    services = target.get("services")
    if any(step.startswith("service.") for step in contract.steps) and not match(UNIT, service):
        raise ValueError("a registered service target is required")
    if "github.propose" in contract.steps and (
        not match(REPO, repository) or not match(SHA, revision) or not match(HEX256, change)
    ):
        raise ValueError("repository, base revision and change digest are required")
    if "config.validate" in contract.steps and (
        not isinstance(services, list) or len(services) > 64
        or not all(match(UNIT, unit) for unit in services) or len(set(services)) != len(services)
    ):
        raise ValueError("services must be an array of distinct service names")
    if "ledger.read" in contract.steps and not match(CID, target.get("audit_cid")):
        raise ValueError("audit CID is required")

    plan = {"version": 1, "original_words": phrase, "command": command, "risk": contract.risk,
            "target": target, "request_id": request_id,
            "requires_approval": any(step in MUTATIONS for step in contract.steps),
            "say": list(contract.say) if declarations is None else list(declarations)}
    plan_id = digest(canonical(plan))
    steps = []
    for number, intent in enumerate(contract.steps, start=1):
        cid = f"ulcas-{plan_id[:32]}-{number}"
        path, method, body = "/x/drive", "POST", {"cid": cid, "intent": intent}
        lane = FORWARD.get(intent, 6)
        if intent.startswith("service."):
            body["target"] = service
        elif intent == "config.validate":
            body.update(target="node-x", arguments={"revision": revision, "services": services})
        elif intent == "github.propose":
            body.update(target=repository, arguments={"expected_sha": revision, "change_digest": change})
        elif intent == "github.verify":
            body.update(target=repository, arguments={"expected_sha": {"from_step": number - 1,
                                                                       "field": "evidence.commit_sha"}})
        elif intent == "ledger.read":
            path, method, body = "/x/ledger?" + urlencode({"cid": target["audit_cid"], "limit": 100}), "GET", None
        elif intent == "ledger.checkpoint":
            path, body = "/x/checkpoint", None
        steps.append({"id": number, "intent": intent, "lane": lane,
                      "after": [number - 1] if number > 1 else [],
                      "method": method, "path": path, "body": body})
    return dict(plan, plan_id=plan_id, do=steps)


def check_events(events):
    previous = None
    for event in events:
        entry = dict(event)
        event_hash = entry.pop("sha256", None)
        if digest(canonical(entry)) != event_hash:
            raise ValueError("ledger digest mismatch")
        if type(entry.get("seq")) is not int or entry["seq"] < 1:
            raise ValueError("invalid ledger sequence")
        if previous:
            if entry["seq"] <= previous["seq"]:
                raise ValueError("ledger sequence out of order")
            if entry["seq"] == previous["seq"] + 1 and entry["previous_sha256"] != previous["sha256"]:
                raise ValueError("ledger link mismatch")
        previous = event


def run_plan(plan, call):
    receipts = {}
    for step in plan["do"]:
        body = step["body"]
        if step["intent"] == "github.verify":
            revision = receipts[step["after"][0]].get("evidence", {}).get("commit_sha")
            if not match(SHA, revision):
                return {"state": "blocked", "step": step["id"], "reason": "missing_provider_commit_sha",
                        "receipts": receipts}
            body = dict(body, arguments={"expected_sha": revision})
        try:
            receipt = call(step["method"], step["path"], body)
            if not isinstance(receipt, dict):
                raise ValueError("invalid receipt")
            if step["path"] == "/x/drive":
                if receipt.get("cid") != body["cid"] or receipt.get("lane") != step["lane"]:
                    raise ValueError("unmatched receipt")
                state = receipt.get("state")
                if state not in ("succeeded", "failed", "awaiting_approval", "awaiting_ci"):
                    raise ValueError("unknown receipt state")
            elif step["intent"] == "ledger.read":
                events = receipt.get("events")
                if not isinstance(events, list) or not events:
                    raise ValueError("crossing history not found")
                check_events(events)
                state = "succeeded"
            else:
                state = "succeeded" if receipt.get("signature") else receipt.get("state", "failed")
        except (OSError, ValueError, KeyError, TypeError):
            return {"state": "failed", "step": step["id"], "reason": "adapter_or_receipt_error",
                    "receipts": receipts}
        receipts[step["id"]] = receipt
        if state != "succeeded":
            return {"state": state, "step": step["id"], "receipts": receipts}
    return {"state": "succeeded", "receipts": receipts}


def localhost_client(port, token):
    if not token or not token.isascii() or len(token) < 32 or any(c.isspace() for c in token):
        raise ValueError("ULCAS_OPERATOR_TOKEN must be configured for dispatch")
    if not 1 <= port <= 65535:
        raise ValueError("invalid Node X port")
    opener = build_opener(ProxyHandler({}), NoRedirect)

    def call(method, path, body):
        headers = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}
        encoded = canonical(body).encode() if body is not None else None
        request = Request(f"http://127.0.0.1:{port}{path}", encoded, headers, method=method)
        with opener.open(request, timeout=8) as response:
            raw = response.read(4_194_305)
            if len(raw) > 4_194_304:
                raise ValueError("oversized Node X response")
            return json.loads(raw)

    return call


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("phrase")
    parser.add_argument("target_profile", type=Path)
    parser.add_argument("--request-id")
    parser.add_argument("--declarations", type=Path, help="JSON array of exact words to say")
    parser.add_argument("--dispatch", action="store_true")
    parser.add_argument("--port", type=int, default=8072)
    args = parser.parse_args()
    try:
        profile = json.loads(args.target_profile.read_text())
        declarations = json.loads(args.declarations.read_text()) if args.declarations else None
        plan = compile_plan(args.phrase, profile, declarations=declarations, request_id=args.request_id)
        if args.dispatch:
            runner = localhost_client(args.port, os.environ.get("ULCAS_OPERATOR_TOKEN"))
            plan["result"] = run_plan(plan, runner)
        print(json.dumps(plan, indent=2))
        if args.dispatch and plan["result"]["state"] != "succeeded":
            return 2
        return 0
    except (OSError, ValueError, URLError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
