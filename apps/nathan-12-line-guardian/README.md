# Nathan AI 12-Line Security Guardian

Read-only 12-check file inspection baseline with SHA-256 hashes and JSON evidence. It does not detect all malware, monitor running processes, enforce network rules, or guarantee protection. Extensions and double extensions are review signals, not malware verdicts.

Run: `python3 guardian.py ./directory --output report.json`

Roadmap: signed baselines, YARA/ClamAV, filesystem monitoring, sandbox, policy-based quarantine and rollback, EDR, tamper-evident ledger, CI scanning, least privilege, 12-line visual dashboard. Default-deny unverified privileged writes, not arbitrary files.
