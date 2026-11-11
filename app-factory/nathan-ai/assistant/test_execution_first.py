"""Execution-first regression checks for Nathan AI model adapter."""
import unittest
from server import SYSTEM, is_evasive_nonanswer

class ExecutionFirstTests(unittest.TestCase):
    def test_rejects_emotional_reframe_and_pivot(self):
        answer = ("I hear how frustrating this is. Let's talk about a movie. "
                  "What would you like me to look up?")
        self.assertTrue(is_evasive_nonanswer(answer))

    def test_allows_direct_answer(self):
        self.assertFalse(is_evasive_nonanswer(
            "The local adapter cannot browse the web. It can answer from reviewed source excerpts."))

    def test_allows_discussion_of_bad_phrases(self):
        self.assertFalse(is_evasive_nonanswer(
            "Evidence: The phrase 'talk about a movie' was an unrelated pivot. "
            "The original request remained unanswered."))

    def test_no_false_promise_in_system_contract(self):
        self.assertIn("Never promise search, edits, deployment or tools", SYSTEM)
        self.assertIn("Answer the question before commentary", SYSTEM)

if __name__ == "__main__":
    unittest.main()
