import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dine_catalog import manifest

def test_unique_modules():
    ids=[m["module_id"] for m in manifest()["modules"]]
    assert len(ids)==len(set(ids))
    assert len(ids)==9

def test_default_unpublished():
    assert all(m["status"]=="DRAFT" for m in manifest()["modules"])

def test_original_projects_separate():
    assert "do not merge" in manifest()["existing_infrastructure"]
