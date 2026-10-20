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
assert home.count("NavigationLink(destination: MatchThreeAdventureView())") == 1
match3 = (root / "Sources/MatchThreeAdventure.swift").read_text()
engine = (root / "Sources/MatchThreeEngine.swift").read_text()
assert "NavigationLink(destination: UnifiedAdventureView())" in match3, "Legacy adventures must remain accessible"
assert "MatchThreeStage.total" in match3 and "static let total = 96" in engine
assert "mammal.match3.v1" in match3, "Use isolated save domain"
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
print("PASS: one match-three primary game, 15 legacy routes intact, distinct saves and pace/Reduce Motion hooks.")
