"""Offline, deterministic safety and identity tests for scheduled triage."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from worker import triage, case_key, case_from_news, safe_url


class IdentityDefenseTests(unittest.TestCase):
    def test_no_name(self):
        self.assertIsNone(triage("Other author", "other book"))

    def test_name_alone_never_verified(self):
        self.assertEqual(triage("Nathan Tabor", "")[0], "NEEDS_REVIEW")

    def test_positive_requires_human_confirmation(self):
        self.assertEqual(triage("Nathan Tabor: Handling Life", "")[0], "NEEDS_REVIEW")

    def test_explicit_name_twin(self):
        self.assertEqual(triage("Nathan Tabor children's book", "")[0], "NAME_TWIN")

    def test_conflict_remains_review(self):
        self.assertEqual(triage("Nathan Tabor Handling Life children's book", "")[0], "NEEDS_REVIEW")

    def test_media_forensics_not_claimed(self):
        self.assertEqual(triage("Nathan Tabor deepfake report", "")[0], "FAKE_AI_IMPERSONATION")

    def test_private_exposure_flagged_not_proven(self):
        self.assertEqual(triage("Nathan Tabor data broker listing", "")[0], "REPUTATION_THREAT")

    def test_tracking_query_is_not_stored(self):
        self.assertEqual(safe_url("https://example.org/path?email=private#x"),"https://example.org/path")

    def test_case_id_is_stable(self):
        self.assertEqual(case_key("https://example.org/1"),case_key("https://example.org/1"))

    def test_owner_approval_is_required(self):
        r=case_from_news({"title":"Nathan Tabor Handling Life",
            "source_url":"https://example.org/a?token=secret",
            "description":""})
        self.assertTrue(r["Owner Approval Required"])
        self.assertEqual(r["Verification"],"Unverified")
        self.assertNotIn("token",str(r))


if __name__=="__main__":
    unittest.main()
