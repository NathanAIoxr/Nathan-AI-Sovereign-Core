"""Run the four agents and generate the Cloudflare Worker from the shared matrix."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "matrix.json").read_text())
WORD_MATRIX = DATA["matrix"]
LINGUISTIC_RULES = DATA["rules"]


class EpenthesisEngine:
    @classmethod
    def apply_intrusive_r(cls, first_word, second_word):
        first, second = first_word.strip(), second_word.strip()
        if first.lower().endswith(tuple(DATA["endings"])) and second.lower().startswith(tuple(DATA["starts"])):
            return f"{first}-r-{second}"
        return f"{first} {second}"

    @classmethod
    def apply_paragogic_s(cls, word):
        word = word.strip()
        return word if word.lower().endswith("s") else f"{word}s"


class MatrixWorkerAgent:
    def __init__(self, name, axis_key):
        self.name, self.axis_key = name, axis_key
        self.data = WORD_MATRIX.get(axis_key, {})

    def process_node(self, node_index, next_token="is"):
        nodes = self.data.get("nodes", [])
        if not 0 <= node_index < len(nodes):
            return {"error": "Node index out of range"}
        node = nodes[node_index]
        return {
            "agent": self.name,
            "axis": self.axis_key,
            "orientation": self.data["orientation"],
            "raw_node": node,
            "paragogic_s_node": EpenthesisEngine.apply_paragogic_s(node),
            "intrusive_r_bridge": EpenthesisEngine.apply_intrusive_r(node, next_token),
            "theme": self.data["theme"],
            "status": "locked_and_ready",
        }


def generate_project_files():
    template = (ROOT / "src/worker-template.mjs").read_text()
    script = "const DATA = " + json.dumps(DATA, ensure_ascii=False) + ";\n" + template
    (ROOT / "src/index.mjs").write_text(script)


if __name__ == "__main__":
    for axis, spec in WORD_MATRIX.items():
        print(json.dumps(MatrixWorkerAgent(spec["agent"], axis).process_node(2, "always")))
    generate_project_files()
