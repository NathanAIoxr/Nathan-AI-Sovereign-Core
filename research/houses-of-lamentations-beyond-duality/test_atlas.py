"""Standard-library tests for the cross-domain atlas."""
import unittest
from pathlib import Path
from lamentations_atlas import (
    CONCEPTS, LINKS, DOMAINS, USER_WORDS, SOURCE,
    assessment, audit_template, compare, matrix, matches, traverse, validate
)


class AtlasTests(unittest.TestCase):
    def test_source_verbatim(self):
        text = SOURCE.read_text(encoding="utf-8")
        self.assertTrue(all(x in text for x in USER_WORDS))

    def test_validate(self):
        self.assertEqual(validate(), [])

    def test_ids_unique(self):
        self.assertEqual(len(CONCEPTS), len({x.id for x in CONCEPTS.values()}))

    def test_edges_have_valid_endpoints(self):
        self.assertTrue(all(e.source in CONCEPTS and e.target in CONCEPTS for e in LINKS))

    def test_fruits_delivery_not_conflated(self):
        case = audit_template("Example", "digital")
        case["promises"] = ["We will ship"]
        result = assessment(case)
        self.assertEqual(result["recorded_deliveries"], 0)
        self.assertEqual(result["recorded_promises"], 1)
        self.assertEqual(result["verdict"], "NOT AUTOMATICALLY DETERMINABLE")

    def test_compare_crosses_domains_without_identity_claim(self):
        result = compare("house_of_mourning", "houses_of_lamentation_tolkien")
        self.assertIn("Similarity", result["boundary"])

    def test_matrix_all_nodes(self):
        self.assertEqual(len(matrix()), len(CONCEPTS))
        self.assertGreaterEqual(len(DOMAINS), 12)

    def test_navigation(self):
        self.assertTrue(traverse("inner_house", 2))
        self.assertIn("kingdom_within", [x.id for x in matches("Kingdom")])


if __name__ == "__main__":
    unittest.main()
