"""Build the 763-entry SQLite registry from the source-preserving catalog."""
from pathlib import Path
import sqlite3, json

here = Path(__file__).resolve().parent
catalog = json.loads((here / "catalog.json").read_text(encoding="utf-8"))
out = here / "Personal_Intelligence_Mind_Registry.sqlite"
if out.exists():
    out.unlink()
db = sqlite3.connect(out)
db.executescript((here / "schema.sqlite.sql").read_text(encoding="utf-8"))
for d in catalog["minds"]:
    db.execute(
        "INSERT INTO mind_definitions VALUES(?,?,?,?,?,?,?,?,?,?)",
        (d["id"], d["name"], d["type"], d["group"], d["purpose"], d["status"],
         d["sourceId"], json.dumps(d["tags"], ensure_ascii=False), d["disclaimer"],
         json.dumps(d, ensure_ascii=False))
    )
    db.execute(
        "INSERT INTO mind_search(mind_id,name,group_name,purpose,tags) VALUES(?,?,?,?,?)",
        (d["id"], d["name"], d["group"], d["purpose"], " ".join(d["tags"]))
    )
for m in catalog["moduleLinks"]:
    db.execute(
        "INSERT INTO module_references(module_id,label,relative_path,role) VALUES (?,?,?,?)",
        (m["id"], m["name"], m["path"], m["role"])
    )
db.execute("INSERT INTO conceptual_namespaces(namespace_id,capacity_decimal,start_id_decimal,last_id_decimal,description) VALUES ('OMNI_GOD','126000000000','0','125999999999','Conceptual address range; not running processes')")
db.execute("INSERT INTO conceptual_namespaces(namespace_id,capacity_decimal,start_id_decimal,last_id_decimal,description) VALUES ('NODE_RUNTIME','732000000','0','731999999','Distinct conceptual Node Runtime range')")
for a, b, relation in [
    ("tmnt.leonardo", "system.archivist", "routes"),
    ("tmnt.donatello", "system.classifier", "classifies"),
    ("tmnt.raphael", "system.validator", "validates"),
    ("tmnt.michelangelo", "system.cross-referencer", "links"),
    ("renaissance.leonardo", "system.synthesizer", "synthesizes"),
    ("omni.jesus-ai", "textual.jesus", "textual-research-crosswalk"),
    ("omni.buddha-ai", "textual.buddha", "textual-research-crosswalk"),
    ("form.devildog", "textual.solomon", "ecclesiastes-author-interpretation"),
]:
    db.execute("INSERT OR IGNORE INTO mind_links(source_mind_id,target_mind_id,relation,notes) VALUES(?,?,?,?)",
               (a, b, relation, "Conceptual route; not evidence of personal or historical identity"))
db.commit()
assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
count = db.execute("SELECT COUNT(*) FROM mind_definitions").fetchone()[0]
assert count == 763, f"Expected 763 catalog definitions, got {count}"
assert db.execute("SELECT COUNT(*) FROM mind_search").fetchone()[0] == count
print(f"Created {out.name} with {count} mind definitions, 2 namespaces and indexed search")
db.close()
