#!/usr/bin/env python3
"""Smoke-check the single adventure map's destination coverage and pace hooks."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
unified = (root / "Sources/UnifiedAdventureView.swift").read_text()
home = (root / "Sources/Home.swift").read_text()
settings = (root / "Sources/MammalPlayroom.swift").read_text()
catalog = {
    "Original 48 boards": "CampaignMapView()",
    "Polar Family": "PolarFamilyQuestView()",
    "Puzzle Pals": "PuzzleView()",
    "Treasure exploration": "ExploreView()",
    "Challenge Lab": "MammalChallengeLabView()",
    "Biscuit Factory": "BiscuitView()",
    "Sticker playroom": "MammalPlayroomView()",
    "Mirror Bridge": "PawMirrorBridgeView()",
    "Middle C": "PolarMiddleCView()",
    "Champ Snack": "ChampSnackView()",
    "Character family": "FamilyView()",
    "Ace dance": "AceDanceView()",
    "Trust quiz": "TrustQuizView()",
    "Family story time": "MammalStoryMomentsView()",
    "Grown-Up Corner": "MammalFamilyGuideView()",
}
missing = [name for name, view in catalog.items() if view not in unified]
assert not missing, "Unlinked game routes: " + ", ".join(missing)
assert home.count("NavigationLink(destination: UnifiedAdventureView())") == 1
assert "NavigationLink(destination: PolarFamilyQuestView())" not in home
assert "adventureLink(" not in home
assert "expandedZone = -1" in unified
assert "mammal.campaign.v3" in unified
assert "mammal.polar.quest.v1" in unified
assert 'GamePace.restored(paceValue)' in unified and 'mammal.pace.v1' in settings
for name in ("Puzzle", "AdventureCampaign"):
    code = (root / "Sources" / (name + ".swift")).read_text()
    assert "mismatchRevealSeconds" in code, name + " uses a fixed wrong-pair delay"
assert "if reduceMotion" in (root / "Sources/PolarFamilyQuestView.swift").read_text()
print("PASS: all 15 routes connected, existing saves preserved, pace and Reduce Motion hooks present.")
