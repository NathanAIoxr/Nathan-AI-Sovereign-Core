"""Construct a repair candidate from trusted GitHub run metadata."""

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess

CHECKS = {
    "Zeros and Ones · D1 and Worker": ".github/workflows/deploy.yml",
    "Unified Operations Cockpit": ".github/workflows/unified-cockpit-sync.yml",
    "Nathan AI Six Dogs CI": ".github/workflows/six-dogs-ci.yml",
}


def make_packet(event, repository, jobs):
    run = event["workflow_run"]
    name = run["name"]
    sha = run["head_sha"]
    run_id = run["id"]
    attempt = run["run_attempt"]
    if (name not in CHECKS or run["head_repository"]["full_name"] != repository
            or run["head_branch"] != "main" or run["event"] not in ("push", "workflow_dispatch")
            or run["conclusion"] != "failure" or not re.fullmatch("[a-f0-9]{40}", sha)
            or type(run_id) is not int or run_id < 1 or type(attempt) is not int or attempt < 1):
        raise ValueError("Unexpected workflow run.")
    failed = sorted(job["id"] for job in jobs if job.get("conclusion") == "failure")
    evidence = {
        "repository": repository,
        "workflow": name,
        "conclusion": "failure",
        "run_id": run_id,
        "attempt": attempt,
        "revision": sha,
        "failed_job_ids": failed,
        "workflow_path": CHECKS[name],
        "run_url": f"https://github.com/{repository}/actions/runs/{run_id}/attempts/{attempt}",
    }
    sealed = json.dumps(evidence, sort_keys=True, separators=(",", ":")).encode()
    return {
        "template": "1.0.0",
        "operation": "ci-repair",
        "outcome": "review-required",
        "evidence": evidence,
        "verification": [
            "Reproduce the failed check from the recorded source SHA in an isolated worktree.",
            "Run the affected workflow checks on the candidate patch.",
            "Apply the Conductor release gate before release.",
        ],
        "receipt": {
            "source": "ci-failure", "verdict": "triaged",
            "input_sha256": hashlib.sha256(f"{repository}:{run_id}:{attempt}".encode()).hexdigest(),
            "evidence_sha256": hashlib.sha256(sealed).hexdigest(),
        },
    }


def main():
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
    repository = os.environ["GITHUB_REPOSITORY"]
    run_id = int(event["workflow_run"]["id"])
    attempt = int(event["workflow_run"]["run_attempt"])
    jobs = subprocess.run(
        ["gh", "api", "--paginate", "--slurp",
         f"repos/{repository}/actions/runs/{run_id}/attempts/{attempt}/jobs?per_page=100"],
        check=True, capture_output=True, text=True, timeout=30,
    )
    packet = make_packet(event, repository, [
        job for page in json.loads(jobs.stdout) for job in page["jobs"]
    ])
    Path("ci-repair-candidate.json").write_text(json.dumps(packet, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
