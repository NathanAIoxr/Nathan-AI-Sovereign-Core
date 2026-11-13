"""NATHAN AI v074 creator-team tests: real git history, originals and approvals."""
import json
from pathlib import Path
import sqlite3
import subprocess
from tempfile import TemporaryDirectory
import unittest

from team_factory import (
    VERSION, TEAM_DDL, changed_paths, protect_sources, run_teams,
    restore_plan, apply_restoration_on_review_branch,
)


def git(root,*args):
    return subprocess.run(["git",*args],cwd=root,check=True,stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE).stdout.decode().strip()

def setup(tmp):
    root=Path(tmp)/"repo";root.mkdir()
    git(root,"init","-b","main")
    git(root,"config","user.name","Nathan Test")
    git(root,"config","user.email","test@example.com")
    repo_file=root/"originals"/"AUTHOR_ORIGINAL_WORDS.md"
    repo_file.parent.mkdir()
    repo_file.write_text("# AUTHOR WORDS\n\nNO IF, NO AMBIGUITY -- keep my exact words.\n")
    site=root/"app-factory/sites/sample/index.html"
    site.parent.mkdir(parents=True)
    site.write_text('<!doctype html><html lang="en"><head><title>Original Site</title></head><body><h1>Original</h1><a href="missing.html">Missing</a></body></html>')
    py=root/"app-factory/nathan-ai/code/engine.py"
    py.parent.mkdir(parents=True)
    py.write_text("def measure(x):\n    return x + 1\n")
    roles=root/"catalog.json"
    roles.write_text(json.dumps({"minds":[
        {"id":"site.creator","name":"Website Builder","type":"workshop-agent"},
        {"id":"editor","name":"Book Writer","type":"workshop-agent"},
        {"id":"nathan","name":"NATHAN AI","type":"owner-orchestrator"}
    ]}))
    method=root/"source-method.json"
    method.write_text("{}")
    git(root,"add",".")
    git(root,"commit","-m","preserve original creator files")
    pinned=git(root,"hash-object","originals/AUTHOR_ORIGINAL_WORDS.md")
    conf={
        "schema":VERSION,
        "teams":[
          {"id":"nathan_orchestrator","name":"Owner","keywords":["nathan"]},
          {"id":"websites","name":"Sites","keywords":["website"]},
          {"id":"books","name":"Books","keywords":["book"]},
          {"id":"code","name":"Code","keywords":["code"]},
          {"id":"database","name":"Data","keywords":["data"]},
          {"id":"research","name":"Research","keywords":["research"]},
          {"id":"education","name":"Education","keywords":["teaching"]},
          {"id":"marketing","name":"Marketing","keywords":["marketing"]},
          {"id":"quality","name":"QA","keywords":["quality"]},
          {"id":"watch","name":"Watch","keywords":["watch"]}
        ],
        "catalog":"catalog.json",
        "source_locks":[{"path":"originals/AUTHOR_ORIGINAL_WORDS.md","pinned_git_blob":pinned,"reason":"preserved verbatim"}],
        "public_sites_root":"app-factory/sites",
        "selected_book_source":"originals/AUTHOR_ORIGINAL_WORDS.md",
        "selected_course_source":"source-method.json"
    }
    c=root/"teams.json";c.write_text(json.dumps(conf))
    git(root,"add",".")
    git(root,"commit","-m","register work teams")
    return root,c,repo_file,site,pinned


class CreatorTeamsTests(unittest.TestCase):
    def test_real_worksite_and_book_edition_preserve_originals(self):
        with TemporaryDirectory() as temp:
            root,config,original,site,pinned=setup(temp)
            before=(original.read_bytes(),site.read_bytes())
            output=Path(temp)/"artifact"
            summary=run_teams(root,config,output,"HEAD^")
            self.assertEqual(summary["creator_teams"],10)
            self.assertEqual(summary["registered_roles_assigned"],3)
            self.assertEqual(summary["roles_excluded"],0)
            self.assertEqual(summary["book_sources_preserved"],1)
            self.assertEqual(summary["website_pages_checked"],1)
            self.assertGreater(summary["python_source_files_syntax_checked"],0)
            self.assertEqual(summary["protected_original_drift_count"],0)
            self.assertTrue((output/"website-inventory.html").exists())
            self.assertTrue((output/"books/THE_REBELLION_WORKING_EDITION.md").exists())
            self.assertTrue((output/"monitor/restore-proposals.md").exists())
            book=(output/"books/THE_REBELLION_WORKING_EDITION.md").read_text()
            self.assertIn("NO IF, NO AMBIGUITY -- keep my exact words.",book)
            self.assertIn("assistant-generated",book)
            self.assertEqual((original.read_bytes(),site.read_bytes()),before)
            changes=json.loads((output/"monitor/tracked-changes.json").read_text())
            self.assertEqual(changes[0]["path"],"teams.json")
            tasks=json.loads((output/"work-queue.json").read_text())
            self.assertTrue(any(t["kind"]=="broken_relative_links" and t["team"]=="websites" for t in tasks))
            con=sqlite3.connect(output/"ONE_CREATOR_TEAMS.sqlite3")
            self.assertEqual(con.execute("SELECT COUNT(*) FROM creator_team_roles").fetchone()[0],3)
            self.assertEqual(con.execute("SELECT COUNT(*) FROM creator_team_runs WHERE status='completed'").fetchone()[0],1)
            self.assertEqual(con.execute("PRAGMA quick_check").fetchone()[0],"ok")
            con.close()

    def test_drift_flag_and_restore_requires_review_branch(self):
        with TemporaryDirectory() as temp:
            root,config,original,site,pinned=setup(temp)
            original.write_text("changed original")
            git(root,"add",".")
            git(root,"commit","-m","change original")
            cfg=json.loads(config.read_text())
            status=protect_sources(root,cfg)
            self.assertEqual(status[0]["status"],"changed_against_pinned_original")
            self.assertEqual(status[0]["expected_git_blob"],pinned)
            self.assertIn("git cat-file blob",restore_plan(status))
            self.assertEqual(original.read_text(),"changed original")
            with self.assertRaisesRegex(ValueError,"dedicated bot review branch"):
                apply_restoration_on_review_branch(root,cfg)
            branch="bot/creator-source-restore-v074-review"
            git(root,"switch","-c",branch)
            restored=apply_restoration_on_review_branch(root,cfg)
            self.assertEqual(restored,["originals/AUTHOR_ORIGINAL_WORDS.md"])
            self.assertIn("NO IF, NO AMBIGUITY",original.read_text())
            self.assertEqual(protect_sources(root,cfg)[0]["status"],"original_verified")

    def test_real_tracked_changes_and_missing_original(self):
        with TemporaryDirectory() as temp:
            root,config,original,site,pinned=setup(temp)
            original.unlink()
            git(root,"add","-u")
            git(root,"commit","-m","delete original")
            changed=changed_paths(root,"HEAD^")
            self.assertEqual(len(changed),1)
            self.assertEqual(changed[0]["path"],"originals/AUTHOR_ORIGINAL_WORDS.md")
            self.assertEqual(changed[0]["status"],"D")
            cfg=json.loads(config.read_text())
            status=protect_sources(root,cfg)
            self.assertEqual(status[0]["status"],"source_missing")
            with self.assertRaises(ValueError):
                changed_paths(root,"--output=/tmp/hack")
            with self.assertRaisesRegex(ValueError,"source"):
                run_teams(root,config,Path(temp)/"out","HEAD^")

    def test_protection_blocks_artifacts_inside_original_tree(self):
        with TemporaryDirectory() as temp:
            root,config,original,site,pinned=setup(temp)
            with self.assertRaisesRegex(ValueError,"outside"):
                run_teams(root,config,root/"new-generated", "HEAD^")


if __name__=="__main__":
    unittest.main()
