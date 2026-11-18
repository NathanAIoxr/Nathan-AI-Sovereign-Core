"""NATHAN AI full Python source: phonetic and morphological matrix and generator."""
import json
from pathlib import Path
WORD_MATRIX = {
  "W_axis": {
    "orientation": "upright",
    "nodes": [
      "Will",
      "Wheel",
      "Way"
    ],
    "theme": "Forward motion, drive, and direction"
  },
  "M_axis": {
    "orientation": "inverted",
    "nodes": [
      "Mill",
      "Mheel",
      "May"
    ],
    "theme": "Harvest, humor, and permission"
  },
  "3_axis": {
    "orientation": "rotated_90",
    "nodes": [
      "3ill",
      "3heel",
      "3ay"
    ],
    "theme": "Triad measurement, stance, and greeting"
  },
  "chevron_axis": {
    "orientation": "stacked_left_shift",
    "nodes": [
      "<<ill",
      "<<heel",
      "<<ay"
    ],
    "theme": "Origin tracing, pivoting, and signal return"
  }
}
LINGUISTIC_RULES = {
  "intrusive_r": {
    "branch": "Phonetics & Phonology",
    "mechanism": "Intervocalic hiatus resolution (/ə/, /ɑː/, /ɔː/ + Vowel -> insert /ɹ/)",
    "function": "Zero wasted motion; bridges open vowel collisions across boundaries"
  },
  "paragogic_s": {
    "branch": "Morphology",
    "mechanism": "Analogical leveling & paragoge (attach uniform -s suffix)",
    "function": "Complete grammatical order; removes irregular exceptions across nodes"
  }
}
class EpenthesisEngine:
    LOW_OPEN_ENDINGS = ("a", "ah", "aw", "ay", "uh", "o")
    VOWEL_STARTS = ("a", "e", "i", "o", "u")
    @classmethod
    def apply_intrusive_r(cls, first_word: str, second_word: str) -> str:
        w1, w2 = first_word.strip(), second_word.strip()
        if w1 and w2 and w1.lower().endswith(cls.LOW_OPEN_ENDINGS) and w2.lower().startswith(cls.VOWEL_STARTS):
            return f"{w1}-r-{w2}"
        return " ".join(x for x in (w1,w2) if x)
    @classmethod
    def apply_paragogic_s(cls, word: str) -> str:
        clean = word.strip()
        return f"{clean}s" if clean and not clean.lower().endswith("s") else clean
class MatrixWorkerAgent:
    def __init__(self, name: str, axis_key: str):
        self.name, self.axis_key, self.data = name, axis_key, WORD_MATRIX.get(axis_key, {})
    def process_node(self, node_index: int, next_token: str = "is") -> dict:
        nodes = self.data.get("nodes", [])
        if not 0 <= node_index < len(nodes):
            return {"error": "Node index out of range"}
        raw = nodes[node_index]
        return {"agent": self.name, "axis": self.axis_key, "orientation": self.data.get("orientation"), "raw_node": raw, "paragogic_s_node": EpenthesisEngine.apply_paragogic_s(raw), "intrusive_r_bridge": EpenthesisEngine.apply_intrusive_r(raw,next_token), "theme": self.data.get("theme"), "status": "locked_and_ready"}
def generate_project_files(output_dir: str = "./epenthesis_matrix_project"):
    """Emit the complete deployment project from the checked-in canonical files."""
    source = Path(__file__).resolve().parent
    dest = Path(output_dir)
    paths = ("wrangler.toml","src/index.mjs","src/engine.mjs","test.mjs",".github/workflows/deploy.yml","README.md")
    for relative in paths:
        origin = source / relative
        if not origin.is_file():
            raise FileNotFoundError(f"Required source missing: {origin}")
        target = dest / relative
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(origin.read_bytes())
    return dest
if __name__ == "__main__":
    for name, axis in (("Agent-W","W_axis"),("Agent-M","M_axis"),("Agent-3","3_axis"),("Agent-Chevron","chevron_axis")):
        print(json.dumps(MatrixWorkerAgent(name,axis).process_node(2,"always"),indent=2))
    print(f"Generated {generate_project_files()}")
