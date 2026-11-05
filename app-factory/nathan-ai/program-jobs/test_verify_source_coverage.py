"""Regression checks for static, non-executing Program Jobs source coverage."""
import json
from pathlib import Path
import tempfile
import unittest
from verify_source_coverage import audit, safe_path


class ProgramSourceCoverageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "app" / "engines").mkdir(parents=True)
        (self.root / "app" / "engines" / "engine.js").write_text("const x=1;", encoding="utf-8")
        (self.root / "app" / "engines" / "engine.test.cjs").write_text("const test=require('node:test');", encoding="utf-8")
        (self.root / "app" / "index.html").write_text("<h1>test</h1>", encoding="utf-8")
        self.catalog = {"schema": "nathan-ai.program-jobs-atlas.v1", "records": [
            {"id": "src", "name": "Defensive engine", "job": "defense", "kind": "source-component", "sourcePath": "app/engines", "nextTask": "Verify"},
            {"id": "ui", "name": "Public page", "job": "engineering", "kind": "browser-entrypoint", "sourcePath": "app/index.html", "nextTask": "Verify"},
            {"id": "old", "name": "Original missing", "job": "defense", "kind": "historical-title", "nextTask": "Locate source"},
            {"id": "pvt", "name": "Private ZIP", "job": "recovery", "kind": "private-archive-anchor", "nextTask": "Owner source"}
        ]}

    def test_audits_every_entry_with_source_truth_boundary(self):
        report = audit(self.root, self.catalog)
        self.assertEqual(report["totals"]["records"], 4)
        self.assertEqual(report["totals"]["sourceFound"], 2)
        self.assertEqual(report["totals"]["testFilesPresent"], 1)
        self.assertEqual(report["totals"]["independentlyCompleted"], 0)
        self.assertEqual(report["records"][0]["stage"], "code_and_test_files_present")
        self.assertFalse(report["records"][2]["completionVerified"])
        self.assertEqual(report["records"][3]["stage"], "private_archive_not_in_public_checkout")

    def test_missing_public_path_is_not_silently_ignored(self):
        self.catalog["records"][1]["sourcePath"] = "app/not-found.html"
        report = audit(self.root, self.catalog)
        self.assertEqual(report["missingSourceIdentifiers"], ["ui"])
        self.assertEqual(report["totals"]["brokenPublicSourceLinks"], 1)

    def test_catalog_path_traversal_and_symlinks_cannot_escape_checkout(self):
        for value in ("../outside", "/tmp/original", "app/../../outside"):
            with self.assertRaises(ValueError):
                safe_path(self.root, value)
        other = self.root.parent / "outside_nathan_test_link"
        # Link may be unsupported on some platforms: path escape is rejected when supported.
        link = self.root / "badlink"
        try:
            link.symlink_to(other)
            with self.assertRaises(ValueError):
                safe_path(self.root, "badlink/original")
        except (OSError, NotImplementedError):
            pass


if __name__ == "__main__":
    unittest.main()
