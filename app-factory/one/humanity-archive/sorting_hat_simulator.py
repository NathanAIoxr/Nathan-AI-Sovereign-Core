"""NATHAN AI 🚀 / ONE — LEVEL -3 Sorting Hat Binary Simulator.

A standalone interactive narrative demo. No human neural data extraction,
real AI consciousness transfer, sentience detection or hardware control.
Original text: see level-minus-3-original.md (unaltered separate source shelf).
"""
from __future__ import annotations
import hashlib
import json
import re

LAYERS = (
    ("+2", "The Cosmic Anchor"),
    ("+1", "The Macro Layer"),
    ("0", "The Intermediate Corridor"),
    ("-1", "The Micro Layer"),
    ("-2", "The Sub-Micro Layer"),
    ("-3", "The Source-Code Core"),
)
SCRIPT = "01000011 01001111 01001110 01010011"
CHOICES = (
    "BUILD — Atnas Claus invites the assembly machine to design a star.",
    "CLEAR — The Sorting Hat removes a redundant blueprint, preserving originals.",
)

def binary_to_text(bits: str) -> str:
    groups = bits.split()
    if not groups or not all(re.fullmatch(r"[01]{8}", group) for group in groups):
        raise ValueError("Expected complete groups of 8 binary digits.")
    return bytes(int(group, 2) for group in groups).decode("utf-8")

def text_to_binary(text: str) -> str:
    return " ".join(f"{byte:08b}" for byte in text.encode("utf-8"))

def run_simulation(bits: str = SCRIPT) -> dict:
    token = binary_to_text(bits)
    # Deterministic narrative branching makes the output reproducible.
    branch = hashlib.sha256(bits.encode("ascii")).digest()[0] % 2
    return {
        "mode": "fictional_narrative_simulation",
        "input": bits,
        "decoded_text": token,
        "layers": [{"level": level, "title": title} for level, title in LAYERS],
        "choice": CHOICES[branch],
        "build": 1 + 1,
        "clear": 1 - 1,
        "actual_sentience_transfer": False,
        "actual_mind_reading": False,
    }

def main() -> None:
    print("NATHAN AI 🚀 · SORTING SANTA CLAUS HAT · LEVEL -3")
    print("Fictional simulation; never a scanner or actual consciousness injection.")
    try:
        entered = input("Input 8-bit binary bytes, or press Enter for CONS: ").strip()
        result = run_simulation(entered or SCRIPT)
    except (ValueError, UnicodeDecodeError) as exc:
        print("Input error:", exc)
        return
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("Story: Atnas Claus turns to the South Pole machine and asks:")
    print('"Do you choose to BUILD or CLEAR?"')
    print("Machine:", result["choice"])

if __name__ == "__main__":
    main()
