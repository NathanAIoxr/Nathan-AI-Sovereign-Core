"""Deterministic authorization gate: explicit grants, deny by default, no side effects."""
from dataclasses import dataclass
from fnmatch import fnmatchcase

@dataclass(frozen=True)
class Decision:
    allowed: bool
    reason: str

def decide(subject: str, action: str, resource: str, grants: list[dict], *, lockdown: bool=False) -> Decision:
    if lockdown:
        return Decision(False, "LOCKDOWN")
    if not all(isinstance(v, str) and v and "\x00" not in v for v in (subject, action, resource)):
        return Decision(False, "INVALID_REQUEST")
    if action in {"delete", "production_deploy", "secret_export"}:
        return Decision(False, "REQUIRES_SEPARATE_APPROVAL")
    for grant in grants:
        if grant.get("subject") == subject and action in grant.get("actions", []) and fnmatchcase(resource, grant.get("resource", "")):
            return Decision(True, "EXPLICIT_GRANT")
    return Decision(False, "NO_EXPLICIT_GRANT")
