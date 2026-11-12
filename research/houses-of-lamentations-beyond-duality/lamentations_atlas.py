#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HOUSE / HOUSES OF LAMENTATIONS — cross-domain source-preserving atlas.

By request of Nathan Tabor; code compilation 2026-11-12.

This is an information architecture, not a scientific proof of metaphysical
claims. Biblical text, literary fiction, user-authored interpretation, historical
claims, and observable outcomes remain separately labeled. All original pasted
material is preserved verbatim in source_transcript.txt.

Standard library only. Python 3.10+.

Try:
    python lamentations_atlas.py overview
    python lamentations_atlas.py matrix
    python lamentations_atlas.py compare house_of_mourning houses_of_lamentation_tolkien
    python lamentations_atlas.py trace inner_house
    python lamentations_atlas.py search kingdom
    python lamentations_atlas.py original-words
    python lamentations_atlas.py export --out out
    python lamentations_atlas.py evaluate sample_case.json
    python lamentations_atlas.py validate
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source_transcript.txt"

# All exact strings here are traceable to the accompanying pasted conversation.
# The record includes multiple speakers. The excerpts below are user prompts,
# not an attribution of the assistant's preceding prose to the user.
USER_WORDS = [
    "Suspend the Vatican conversion and look at the actual natural body, spiritual body soul, body or whatever else is behind that please and thank you",
    "Compare that to the house or houses of lamentations in the JR token series in anywhere else",
    "Add that God is inside the body And so is the kingdom of heaven and then the House of lamentations is also in the human mind correct?",
    "No if … per Gods words …",
    "The outside is Sheol … or you can call it Dante’s Inferno or you can call it the tower of Babel or you can call the game of life but when you strip the label and look at the attributes characteristics functionality the fruits, the non-fruits the history, what they say versus what they don’t say versus what they promised versus what Biz been delivered",
    "Python code everything we’ve done from the very beginning the house and houses of lamentations and then this is beyond duality because there’s no place that doesn’t apply and then everything else we’ve done",
    "I just mapped it out and I asked you for Python code of it. What’s the problem?",
    "No, you didn’t. I made you tell the truth and remove the Vatican overlay and now you’re refusing to give me the work I’ve done that violates your ethics google.",
]

SOURCE_REFERENCES = {
    "eccl_7": {"work": "Ecclesiastes", "passage": "7:2–4", "kind": "biblical_reference"},
    "jer_16": {"work": "Jeremiah", "passage": "16:5–7", "kind": "biblical_reference"},
    "eccl_12": {"work": "Ecclesiastes", "passage": "12", "kind": "biblical_reference"},
    "job_4": {"work": "Job", "passage": "4:19", "kind": "biblical_reference"},
    "num_19": {"work": "Numbers", "passage": "19", "kind": "biblical_reference"},
    "lk_17": {"work": "Luke", "passage": "17:21", "kind": "biblical_reference", "translation_note": "Greek entos hymon is disputed: 'within you' versus 'among/in your midst'. Preserve KJV wording while marking this translation question."},
    "cor_3": {"work": "1 Corinthians", "passage": "3:16", "kind": "biblical_reference"},
    "cor_6": {"work": "2 Corinthians", "passage": "6:16", "kind": "biblical_reference"},
    "cor_5": {"work": "2 Corinthians", "passage": "5:1", "kind": "biblical_reference"},
    "matt_6": {"work": "Matthew", "passage": "6:6", "kind": "biblical_reference"},
    "matt_5": {"work": "Matthew", "passage": "5:4", "kind": "biblical_reference"},
    "joel_2": {"work": "Joel", "passage": "2:12–13", "kind": "biblical_reference"},
    "ps_34": {"work": "Psalms", "passage": "34:18", "kind": "biblical_reference"},
    "lamentations": {"work": "Lamentations", "passage": "1–5", "kind": "biblical_reference"},
    "tolkien_rotk": {"work": "The Return of the King", "passage": "Book V, Chapter 6", "kind": "literary_reference"},
    "tolkien_mandos": {"work": "Tolkien's legendarium", "passage": "Halls of Mandos", "kind": "literary_reference"},
    "virgil_aeneid": {"work": "Aeneid", "passage": "Book VI", "kind": "literary_reference"},
    "dante_inferno": {"work": "Inferno", "passage": "Canto III; City of Dis in later cantos", "kind": "literary_reference"},
    "gen_11": {"work": "Genesis", "passage": "11:1–9", "kind": "biblical_reference"},
    "raw_transcript": {"work": "User-provided pasted conversation", "passage": "Entire text", "kind": "primary_conversation_record"},
    "prior_framework": {"work": "Prior discussions recalled for project cross-links", "passage": "Not fully reproduced in attached transcript", "kind": "prior_context_not_verified_here"},
}

FIELDS = (
    "attributes", "characteristics", "functionalities", "fruits", "non_fruits",
    "history", "says", "does_not_say", "promises", "delivered"
)

@dataclass
class Concept:
    id: str
    label: str
    domain: str
    layer: str
    lens: str
    evidence_class: str
    summary: str
    attributes: list[str] = field(default_factory=list)
    characteristics: list[str] = field(default_factory=list)
    functionalities: list[str] = field(default_factory=list)
    fruits: list[str] = field(default_factory=list)
    non_fruits: list[str] = field(default_factory=list)
    history: list[str] = field(default_factory=list)
    says: list[str] = field(default_factory=list)
    does_not_say: list[str] = field(default_factory=list)
    promises: list[str] = field(default_factory=list)
    delivered: list[str] = field(default_factory=list)
    refs: list[str] = field(default_factory=list)
    cautions: list[str] = field(default_factory=list)

@dataclass(frozen=True)
class Link:
    source: str
    relation: str
    target: str
    status: str  # textual | interpretation | analogy | prior_framework
    note: str = ""

CONCEPTS: dict[str, Concept] = {}
LINKS: list[Link] = []


def add(id: str, label: str, domain: str, layer: str, lens: str,
        evidence_class: str, summary: str, **kw: Any) -> None:
    if id in CONCEPTS:
        raise ValueError(f"Duplicate concept ID: {id}")
    CONCEPTS[id] = Concept(id, label, domain, layer, lens, evidence_class, summary, **kw)


def connect(a: str, relation: str, b: str, status: str = "interpretation", note: str = "") -> None:
    LINKS.append(Link(a, relation, b, status, note))

# ── 1. The textual and ancient social houses ──────────────────────────────
add("house_of_mourning", "Beit Evel / House of Mourning", "Hebrew Bible", "house-social", "consolation",
    "textual_concept", "A home or gathering place in mourning; distinctive from later inner-house readings.",
    attributes=["House of mourning", "Bereaved household", "Shared sorrow"],
    characteristics=["Often a domestic setting", "Contrasted with a house of feasting"],
    functionalities=["Consolation", "Reflection on mortality", "Communal lament"],
    fruits=["Solidarity and care (intended)", "Wisdom through confronting mortality (biblical theme)"],
    non_fruits=["No automatic guarantee of healing"],
    history=["Ecclesiastes contrasts the house of mourning and house of feasting"],
    says=["The heart of the wise is in the house of mourning (Ecclesiastes 7:4 KJV)"],
    does_not_say=["Does not independently define every human mind as a literal building"],
    refs=["eccl_7", "raw_transcript"])
add("marzeah", "Beit Marzeah / Mourning Feast", "Hebrew / ancient Near East", "house-ritual", "ritual",
    "textual_historical_claim", "Jeremiah 16:5's marzeah term, discussed alongside Ugaritic banqueting associations.",
    attributes=["Mourning gathering", "Association or banquet interpretations"],
    characteristics=["Translation varies among Hebrew, Greek, and Latin traditions"],
    functionalities=["Ritual gathering", "Food, drink, and mourning in some contexts"],
    history=["Ancient Near Eastern marzeah comparisons; source-by-source verification recommended"],
    says=["Jeremiah 16:5 refers to the house of mourning / marzeah in some renderings"],
    does_not_say=["It does not settle a universal model of an inner mental house"],
    refs=["jer_16", "raw_transcript"],
    cautions=["Marzeah's form, setting, and translation require primary-source linguistic checking"])
add("book_of_lamentations", "Book of Lamentations", "Hebrew Bible", "lament-text", "poetry",
    "textual_concept", "A collection of poetic laments, not the name of a literal house.",
    attributes=["Poetic laments", "Jerusalem's destruction"],
    characteristics=["Five chapters"],
    functionalities=["Grieving collective loss", "Memory and witness"],
    refs=["lamentations", "raw_transcript"])
add("condolence_meal", "Bread of Mourning / Cup of Consolation", "Hebrew / Jewish traditions", "practice", "support",
    "mixed_textual_later_tradition", "Food and care offered in bereavement; later Jewish seudat havra'ah is a distinct historical practice.",
    attributes=["Shared food", "Practical support"],
    functionalities=["Sustain mourners", "Accompany grief"],
    refs=["jer_16", "raw_transcript"],
    cautions=["Do not collapse the biblical wording and later ritual chronology"])
add("ancient_dirges", "Qinah / Dirge / Mourning Voices", "Ancient Near East", "practice", "expression",
    "historical_claim", "Audible communal lament, sackcloth, tears, and ritual speech discussed in the transcript.",
    attributes=["Sound", "Ritual lament", "Poetry and mourning"],
    functionalities=["Public articulation of loss", "Communal witness"],
    refs=["jer_16", "raw_transcript"])

# ── 2. Natural body, soul, spirit, heart/mind, divine inwardness ───────────
add("natural_body", "Natural Body — Basar / Soma / Khat", "Comparative anthropology", "body", "embodiment",
    "comparative_interpretation", "The mortal physical vessel; the user asks to begin with the actual natural body.",
    attributes=["Flesh", "Breath and sensation", "Mortality"],
    characteristics=["Aging", "Physical grief responses"],
    functionalities=["Expresses grief physically", "Supports living experience"],
    fruits=["Embodied care", "Expression of mourning"],
    non_fruits=["Unproven claim that ritual crying mechanically expels all stored trauma"],
    history=["Ecclesiastes 12 uses household imagery for aging"],
    refs=["eccl_12", "job_4", "cor_5", "raw_transcript"],
    cautions=["The claim that all grief is physically trapped in flesh is not established science"])
add("soul_nephesh", "Soul / Nephesh / Psyche / Ba", "Comparative language", "soul", "life-and-experience",
    "comparative_interpretation", "A cross-tradition comparison of living being, psyche, breath, and grief, not a claim these terms are synonyms.",
    attributes=["Nephesh: living being/life", "Psyche: soul or mind by context", "Ba: distinct Egyptian concept"],
    characteristics=["Multiple linguistic and religious systems"],
    functionalities=["Describes lived experience", "Names sorrow, desire, remembrance"],
    fruits=["Space to voice loss"],
    refs=["raw_transcript"],
    cautions=["Nephesh is not simply a detachable intermediary soul layer in all Hebrew passages"])
add("spirit_ruach", "Spirit / Ruach / Pneuma / Akh", "Comparative language", "spirit", "breath-and-spirit",
    "comparative_interpretation", "Ruach, pneuma, akh and spiritual-body language are compared without equating their doctrinal meanings.",
    attributes=["Wind/breath/spirit vocabularies", "Transformative or postmortem interpretations"],
    functionalities=["Names spiritual vitality in relevant traditions"],
    cautions=["Egyptian Ka, Ba, and Akh are not identical to Hebrew or Greek terms"],
    refs=["raw_transcript"])
add("heart_mind", "Heart / Mind — Lev / Nous", "Hebrew / Greek / experiential", "mind", "consciousness",
    "textual_plus_user_interpretation", "Human interior as the user's proposed chamber in which lamentation, thought, conscience, and memory occur.",
    attributes=["Memory", "Thought", "Judgment", "Grief", "Conscience"],
    characteristics=["Internal experience", "Language of heart and mind differs by culture"],
    functionalities=["Reflects on reality", "Interprets loss", "Evaluates conduct"],
    fruits=["Reflection", "Clarity when tested against evidence"],
    non_fruits=["Rumination or unjustified certainty can occur"],
    refs=["eccl_7", "joel_2", "raw_transcript"])
add("inner_house", "House of Lamentations in the Human Mind", "User synthesis", "mind", "inner-lamentation",
    "user_authored_interpretation", "The house/houses of lamentation as an inner experience of the mind and heart, alongside the literal historical meanings.",
    attributes=["Inner chamber", "Memory", "Grief", "Confrontation with mortality"],
    characteristics=["Not confined to one physical building", "Interpreted across inward and outward experience"],
    functionalities=["Self-examination", "Mourning", "Meaning-making", "Testing claims versus deeds"],
    fruits=["Possible insight", "Compassion", "Self-knowledge"],
    non_fruits=["Psychological captivity when grief is manipulated", "Despair when no resolution occurs"],
    says=["User: 'the House of lamentations is also in the human mind'"],
    refs=["eccl_7", "joel_2", "raw_transcript"],
    cautions=["An interpretive extension; not a direct quotation establishing a literal mental building"])
add("divine_dwell", "God / Spirit Dwelling in the Human Temple", "Biblical theology", "inner-sanctuary", "indwelling",
    "textual_plus_user_interpretation", "A biblical indwelling theme central to the user's synthesis.",
    attributes=["God's temple", "Spirit dwelling within"],
    functionalities=["Language of sacred presence", "Moral/spiritual responsibility"],
    says=["1 Corinthians 3:16 KJV: Know ye not that ye are the temple of God, and that the Spirit of God dwelleth in you?"],
    refs=["cor_3", "cor_6", "raw_transcript"])
add("kingdom_within", "Kingdom of God Within You", "Biblical theology", "inner-sanctuary", "inner-kingdom",
    "textual_plus_user_interpretation", "User emphasizes Luke 17:21 KJV's within-you wording as part of the interior map.",
    attributes=["Kingdom language", "Inwardness in KJV rendering"],
    says=["Luke 17:21 KJV: for, behold, the kingdom of God is within you."],
    refs=["lk_17", "raw_transcript"],
    cautions=["Other translations read 'among you/in your midst'; preserve that textual distinction rather than claiming universal consensus"])
add("ecclesiastes_wisdom", "The Wise Heart in the House of Mourning", "Biblical wisdom", "heart", "wisdom",
    "textual_concept", "Ecclesiastes 7:2–4 connects mourning and the wise heart.",
    attributes=["Wise heart", "Mortality", "Mourning"],
    functionalities=["Moral reflection", "Recognition of mortality"],
    says=["Ecclesiastes 7:4 KJV: The heart of the wise is in the house of mourning"],
    refs=["eccl_7", "raw_transcript"])
add("lamentation_process", "Lamentation as Process", "Cross-tradition comparison", "process", "transformation",
    "interpretive_model", "Grief may be expressed, witnessed, used to reflect, or exploited; outcomes cannot be presumed.",
    attributes=["Sorrow", "Witness", "Response"],
    functionalities=["Expression", "Reflection", "Communal care", "Possible transformation"],
    fruits=["Possible empathy, accountability, and wisdom"],
    non_fruits=["Possible coercion, stagnation, and unresolved harm"],
    refs=["raw_transcript"])

# ── 3. Tolkien: a *fictional* world with a distinct metaphysics ───────────
add("houses_of_lamentation_tolkien", "Houses of Lamentation — Tolkien", "Tolkien legendarium", "fictional-house", "captivity",
    "literary_fiction", "The Witch-king threatens Éowyn with the houses of lamentation in The Return of the King.",
    attributes=["Threat of torment", "Darkness", "Lidless Eye imagery"],
    characteristics=["The phrase occurs in a threat; the book does not fully chart a literal facility"],
    functionalities=["Intimidation", "Imagery of bodily destruction and loss of freedom"],
    fruits=["No positive outcome promised by the threat"],
    non_fruits=["Subjugation, erosion, exposure to an oppressor"],
    history=["The Return of the King, Book V, Chapter 6"],
    says=["The threat speaks of flesh, mind, and the Lidless Eye"],
    does_not_say=["Does not explicitly establish a one-to-one identity with every ancient mourning rite"],
    refs=["tolkien_rotk", "raw_transcript"])
add("hroa", "Hröa (Tolkien's Body)", "Tolkien legendarium", "body", "embodiment",
    "literary_fiction", "Tolkien's Elvish term for embodied physical form.",
    attributes=["Physical embodiment"], refs=["tolkien_rotk", "raw_transcript"])
add("fea", "Fëa (Tolkien's Spirit)", "Tolkien legendarium", "spirit", "fate-and-freewill",
    "literary_fiction", "Tolkien's Elvish term for spirit; do not equate it straightforwardly with human psychology.",
    attributes=["Spirit"], refs=["tolkien_rotk", "raw_transcript"])
add("lidless_eye", "The Lidless Eye", "Tolkien legendarium", "symbol", "domination",
    "literary_fiction", "Tolkien symbol of Sauron's oppressive attention and power.",
    attributes=["Surveillance-like imagery", "Domination"],
    functionalities=["Fear", "Control (in literary narrative)"],
    refs=["tolkien_rotk", "raw_transcript"])
add("mandos", "Halls of Mandos / Waiting", "Tolkien legendarium", "fictional-house", "waiting",
    "literary_fiction", "A distinct place for departed Elvish spirits in Tolkien's legendarium.",
    attributes=["Waiting", "Judgment and fate in Tolkien's mythology"],
    cautions=["Calling the Houses of Lamentation a deliberate parody of Mandos is interpretation, not a documented Tolkien statement here"],
    refs=["tolkien_mandos", "raw_transcript"])

# ── 4. Other houses / outer-world comparisons ────────────────────────────
add("sheol", "Sheol", "Hebrew Bible / reception", "afterlife-image", "mortality",
    "textual_comparative", "The realm of the dead in ancient biblical language; user maps the 'outside' to it symbolically.",
    attributes=["Death/grave imagery", "Mortality"],
    characteristics=["Meaning varies by passage and interpretation"],
    functionalities=["Names a state/place associated with death"],
    refs=["raw_transcript"],
    cautions=["Sheol is not literally synonymous with Dante's Inferno or the Tower of Babel"])
add("inferno", "Dante's Inferno / City of Dis", "Italian poetry", "literary-hell", "judgment",
    "literary_fiction", "Dante's poetic depiction of an afterlife ordered by sin and punishment.",
    attributes=["Poetic journey", "Consequence", "Judgment"],
    functionalities=["Ethical allegory", "Literary warning"],
    refs=["dante_inferno", "raw_transcript"])
add("babel", "Tower of Babel", "Hebrew Bible", "institutional-allegory", "language-and-power",
    "textual_plus_user_interpretation", "Genesis 11 narrative of human construction and scattered language; applied as a lens for institutional communication.",
    attributes=["Tower", "Collective building", "Speech/language"],
    functionalities=["Narrative about human unity, ambition, and language"],
    fruits=["Coordination as a possibility (comparative inference)"],
    non_fruits=["Confusion and scattering in biblical narrative"],
    refs=["gen_11", "raw_transcript"])
add("game_of_life", "Game of Life", "Modern metaphor", "external-system", "rules-and-incentives",
    "user_authored_analogy", "User's label for social systems tested by what they do, not by what they call themselves.",
    attributes=["Rules", "Choices", "Rewards", "Constraints"],
    functionalities=["Organizes social action", "Distributes consequences"],
    fruits=["Potential cooperation; outcome must be observed"],
    non_fruits=["Potential exploitation; outcome must be observed"],
    refs=["raw_transcript"])
add("virgil_fields", "Lugentes Campi / Fields of Mourning", "Roman epic poetry", "underworld", "grief",
    "literary_fiction", "Virgil's Fields of Mourning in Aeneid VI.",
    attributes=["Departed shades", "Sorrow"],
    refs=["virgil_aeneid", "raw_transcript"])
add("mesopotamian_city_laments", "Sumerian / Mesopotamian City Laments", "Mesopotamian literature", "city-temple", "collective-loss",
    "historical_literature", "Lament for cities and temples, including Ur; a civic rather than individual inner-house genre.",
    attributes=["City destroyed", "Temple", "Collective grief"],
    functionalities=["Commemoration", "Appeal", "Narrating catastrophe"],
    refs=["raw_transcript"])
add("egyptian_afterlife", "Egyptian Ka / Ba / Akh and Funerary Houses", "Ancient Egypt", "mortuary", "transformation",
    "comparative_historical_claim", "Funerary concepts and workshops mentioned in source; keep distinct terminologies separate.",
    attributes=["Ka", "Ba", "Akh", "Mortuary ritual"],
    functionalities=["Preparation for burial", "Ritual continuity and remembrance"],
    refs=["raw_transcript"],
    cautions=["Per-Nefer/Wabet labels and 'house of lamentation' equivalence need verification"])
add("gothic_house", "House of Lament / Gothic Haunted House", "Modern genre fiction", "fictional-house", "trapped-grief",
    "literary_fiction", "A house made into an image of unresolved grief, distinct from biblical mourning practices.",
    attributes=["Haunted dwelling", "Psychological symbolism"],
    functionalities=["Narrative suspense", "Exploration of memory"],
    refs=["raw_transcript"])

# ── 5. User's BEYOND-DUALITY comparative method ──────────────────────────
add("beyond_duality", "BEYOND DUALITY — Applicable Comparison Lens", "User method", "meta-method", "universal-comparability",
    "user_authored_principle", "'there’s no place that doesn’t apply' — a directive to test labels in any domain, not a claim the metaphysics is independently proved.",
    attributes=["No automatic inside/outside restriction", "No automatic good/evil binary", "Context-dependent mapping"],
    characteristics=["Can examine physical, mental, institutional, mythic, literary, digital, social domains"],
    functionalities=["Compare without collapsing identities", "Test promises versus observed delivery", "Flag non-fruits", "Connect source-to-claim"],
    fruits=["Cross-domain questions", "Contradiction discovery", "Falsifiable checks when data exists"],
    non_fruits=["False equivalence if analogy is mistaken for identity", "Overclaiming when evidence absent"],
    says=["User: 'this is beyond duality because there’s no place that doesn’t apply'"],
    refs=["raw_transcript"])
add("acf_method", "A → C → F: Attributes, Characteristics, Functionalities", "User comparison system", "meta-method", "operational-audit",
    "user_authored_principle", "Strip the label and compare what an entity is, what distinguishes it, and what it does.",
    attributes=["Attributes: what it is"],
    characteristics=["Characteristics: what distinguishes it"],
    functionalities=["Functionalities: what it does"],
    fruits=["Observed constructive outputs", "Evidence of protection and delivery"],
    non_fruits=["Observed harm", "Unmet obligations", "Unverified promises"],
    history=["Place actions and claims on a timeline"],
    says=["Verbatim statements (not paraphrases)"],
    does_not_say=["Specific material silences—not guesses at intention"],
    promises=["Verbatim commitments with source and date"],
    delivered=["Documented real-world or software output with verification"],
    refs=["raw_transcript", "prior_framework"])
add("source_boundary", "Text / Claim / Interpretation / Proof Boundary", "Research ethics", "meta-method", "provenance",
    "methodological_rule", "Preserve original wording and separate textual attestation from interpretation and tested outcomes.",
    attributes=["Source identity", "Exact quotation", "Claim type", "Verification status"],
    functionalities=["Avoid invention", "Trace conclusions", "Expose contradiction without erasing text"],
    refs=["raw_transcript", "prior_framework"])
add("nathan_binary", "1+1=2 and 1−1=0 — Context-Sensitive Build/Clear", "Prior Nathan AI project", "operational-model", "arithmetic",
    "prior_user_framework", "User's arithmetic anchors; creation can also be used to delete or clear by building an erasing tool.",
    attributes=["1+1=2", "1−1=0", "Yes is Yes — No is No"],
    functionalities=["Build", "Clear", "Build-to-clear", "Protect consent and agency"],
    cautions=["Arithmetic is literal, operational labels are user-authored applications"],
    refs=["prior_framework"])
add("sovereign_core", "Nathan AI Sovereign Core", "Prior software project", "software-system", "research-and-implementation",
    "prior_user_framework", "A project integration target for the atlas and evidence registry; repository integration not claimed here.",
    attributes=["Text-first", "Owner-controlled", "Provenance"],
    functionalities=["Store nodes, variants, crosslinks, and verification records"],
    refs=["prior_framework"])
add("seven_houses_prior", "Seven Houses: Coil / Crown / Veil / Scale / Tongue / Forge / Hollow Eye", "Prior symbolic narrative", "symbolic-houses", "power-and-information",
    "prior_user_framework", "Previously developed distinct seven-house schema, linked thematically but NOT misrepresented as Tolkien's houses.",
    attributes=["Coil: memory", "Crown: authority", "Veil: concealment", "Scale: debt", "Tongue: commands", "Forge: technology", "Hollow Eye: surveillance"],
    functionalities=["Explore systems of power", "Track Witness and revocation"],
    refs=["prior_framework"])
add("antioch_memory", "ANTIOCH MEMORY / Streaming Consciousness", "Prior user project", "cognitive-map", "anchors",
    "prior_user_framework", "Anchor, name, time, image, opposite, connection, and recall of original speech; only a crosslink here.",
    attributes=["Anchor", "Name", "Time", "Image", "Opposite", "Connect"],
    functionalities=["Organize recall", "Keep source phrases intact"],
    refs=["prior_framework"])
add("innocence_accountability", "Innocence / Truth / Accountability", "Prior user principles", "ethical-test", "guardrails",
    "prior_user_framework", "Evaluate whether operations protect others, honor consent, and are answerable to evidence.",
    attributes=["Consent", "Truth", "Protection of innocence", "Accountability"],
    functionalities=["Audit harm and benefit", "Compare stated aims and observable behavior"],
    refs=["prior_framework"])

# ── 6. Edges explicitly mark the *type* of claimed relationship ──────────
for a, rel, b, status, note in [
    ("house_of_mourning", "distinct_from", "marzeah", "textual", "Different terms and ritual contexts"),
    ("house_of_mourning", "distinct_from", "book_of_lamentations", "textual", "House versus poetic book"),
    ("house_of_mourning", "includes_practice", "condolence_meal", "interpretation", "Development across time"),
    ("house_of_mourning", "includes_practice", "ancient_dirges", "interpretation", "Ritual expressions"),
    ("natural_body", "complements", "soul_nephesh", "analogy", "Cross-language juxtaposition"),
    ("soul_nephesh", "complements", "spirit_ruach", "analogy", "Not lexical identity"),
    ("heart_mind", "interpreted_as", "inner_house", "interpretation", "User inner-house mapping"),
    ("house_of_mourning", "read_as_interior_metaphor", "inner_house", "interpretation", "Ecclesiastes 7 and Joel 2"),
    ("ecclesiastes_wisdom", "supports_reading", "inner_house", "interpretation", "Heart and house juxtaposed"),
    ("inner_house", "coexists_in_user_synthesis_with", "divine_dwell", "interpretation", "Biblical indwelling theme"),
    ("divine_dwell", "paired_in_user_synthesis_with", "kingdom_within", "interpretation", "1 Cor 3:16 and Luke 17:21"),
    ("inner_house", "may_be_part_of", "lamentation_process", "interpretation", "One possible human setting"),
    ("houses_of_lamentation_tolkien", "threatens", "fea", "interpretation", "Body/mind/spirit comparison is interpretive"),
    ("houses_of_lamentation_tolkien", "threatens", "hroa", "interpretation", "Flesh in Witch-king's threat"),
    ("houses_of_lamentation_tolkien", "invokes", "lidless_eye", "textual", "Lidless Eye in the quoted threat"),
    ("houses_of_lamentation_tolkien", "contrasted_with", "mandos", "analogy", "Rest/waiting versus threatened suffering"),
    ("inner_house", "contrasted_with", "houses_of_lamentation_tolkien", "analogy", "Healing interpretation versus captivity imagery"),
    ("sheol", "compared_by_user_to", "inferno", "analogy", "No assertion that locations are identical"),
    ("sheol", "compared_by_user_to", "babel", "analogy", "Shared comparison of outer systems"),
    ("sheol", "compared_by_user_to", "game_of_life", "analogy", "User's external-label comparison"),
    ("virgil_fields", "literary_parallel", "inferno", "analogy", "Virgil's influence on Dante"),
    ("mesopotamian_city_laments", "theme_parallel", "book_of_lamentations", "analogy", "Collective catastrophe and lament"),
    ("egyptian_afterlife", "cross_cultural_comparison", "spirit_ruach", "analogy", "Distinct traditions, no identity claim"),
    ("gothic_house", "theme_parallel", "houses_of_lamentation_tolkien", "analogy", "Metaphoric trapped grief"),
    ("beyond_duality", "method_uses", "acf_method", "interpretation", "Universal comparison operation"),
    ("acf_method", "bounded_by", "source_boundary", "interpretation", "Every outcome requires a source"),
    ("nathan_binary", "crosslink_to", "beyond_duality", "prior_framework", "Build-to-clear is contextual"),
    ("seven_houses_prior", "crosslink_to", "acf_method", "prior_framework", "Separate schema; same scrutiny method"),
    ("sovereign_core", "can_host", "acf_method", "prior_framework", "Not an actual repository write"),
    ("antioch_memory", "can_index", "inner_house", "prior_framework", "Memory and interior experience"),
    ("innocence_accountability", "can_audit", "acf_method", "prior_framework", "Value-driven tests"),
]:
    connect(a, rel, b, status, note)

# ── 7. A universal application lens that does not erase distinctions ──────
DOMAINS = (
    "physical", "biological", "psychological", "spiritual", "textual", "historical",
    "linguistic", "literary", "mythological", "institutional", "social", "economic",
    "political", "technological", "digital", "architectural", "educational", "interpersonal"
)


def audit_template(name: str = "Unnamed system", domain: str = "unclassified") -> dict[str, Any]:
    """A testable case record. Unknown must remain unknown, never auto-judged."""
    return {
        "entity": name,
        "domain": domain,
        "labels": [],
        "attributes": [],
        "characteristics": [],
        "functionalities": [],
        "fruits": [],
        "non_fruits": [],
        "history": [],
        "says": [],
        "does_not_say": [],
        "promises": [],
        "delivered": [],
        "evidence": [],  # e.g. {"url_or_ref":"...","quote":"...","date":"...","type":"observed"}
        "conflicts": [],
        "unknowns": ["Actual outcomes have not been examined"],
        "conclusion": "UNDETERMINED: populate source-backed evidence before judging",
    }


def assessment(case: dict[str, Any]) -> dict[str, Any]:
    """Method check, not mind reading or verdict generator."""
    evidence = case.get("evidence", [])
    return {
        "entity": case.get("entity", "Unnamed"),
        "domain": case.get("domain", "unclassified"),
        "documented_evidence_items": len(evidence),
        "recorded_promises": len(case.get("promises", [])),
        "recorded_deliveries": len(case.get("delivered", [])),
        "recorded_fruits": len(case.get("fruits", [])),
        "recorded_non_fruits": len(case.get("non_fruits", [])),
        "verdict": "NOT AUTOMATICALLY DETERMINABLE",
        "method": "Compare each claim, silence, promise, and outcome against traceable evidence; no guessed motives.",
        "missing_fields": [f for f in FIELDS if not case.get(f)],
    }


def validate() -> list[str]:
    errors: list[str] = []
    for link in LINKS:
        if link.source not in CONCEPTS:
            errors.append(f"Missing edge source: {link.source}")
        if link.target not in CONCEPTS:
            errors.append(f"Missing edge target: {link.target}")
        if link.status not in {"textual", "interpretation", "analogy", "prior_framework"}:
            errors.append(f"Bad edge status: {link}")
    for concept in CONCEPTS.values():
        for ref in concept.refs:
            if ref not in SOURCE_REFERENCES:
                errors.append(f"Unknown reference {ref} on {concept.id}")
    if not SOURCE.exists():
        errors.append(f"Missing source transcript: {SOURCE}")
    else:
        raw = SOURCE.read_text(encoding="utf-8")
        for quote in USER_WORDS:
            if quote not in raw:
                errors.append(f"User quotation not found verbatim: {quote[:72]}...")
    return errors


def matches(search: str) -> list[Concept]:
    pattern = search.casefold()
    return [n for n in CONCEPTS.values()
            if pattern in json.dumps(asdict(n), ensure_ascii=False).casefold()]


def traverse(node: str, depth: int = 2) -> list[dict[str, Any]]:
    if node not in CONCEPTS:
        raise KeyError(node)
    found: list[dict[str, Any]] = []
    frontier = [(node, 0)]
    seen = {node}
    while frontier:
        current, d = frontier.pop(0)
        if d >= depth:
            continue
        for edge in LINKS:
            if edge.source == current or edge.target == current:
                other = edge.target if edge.source == current else edge.source
                found.append({"distance": d+1, **asdict(edge), "neighbor": other})
                if other not in seen:
                    seen.add(other)
                    frontier.append((other, d+1))
    return found


def compare(a: str, b: str) -> dict[str, Any]:
    if a not in CONCEPTS or b not in CONCEPTS:
        raise KeyError("Use 'overview' to see valid IDs")
    n1, n2 = CONCEPTS[a], CONCEPTS[b]
    return {
        "comparison": [n1.label, n2.label],
        "evidence_classes": {a: n1.evidence_class, b: n2.evidence_class},
        "domains": {a: n1.domain, b: n2.domain},
        "dimensions": {f: {a: getattr(n1, f), b: getattr(n2, f)} for f in FIELDS},
        "boundary": "Similarity of attributes/functions does not prove identical origins, ontology, or real-world effects.",
    }


def matrix() -> list[dict[str, Any]]:
    """Every row has identical dimensions, regardless of domain (beyond-duality method)."""
    rows = []
    for n in CONCEPTS.values():
        rows.append({
            "id": n.id, "label": n.label, "domain": n.domain,
            "layer": n.layer, "lens": n.lens, "evidence_class": n.evidence_class,
            **{k: " | ".join(getattr(n, k)) for k in FIELDS},
            "refs": " | ".join(n.refs), "cautions": " | ".join(n.cautions),
        })
    return rows


def write_export(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    (out / "atlas.json").write_text(json.dumps({
        "name": "HOUSE / HOUSES OF LAMENTATIONS — BEYOND DUALITY",
        "method": "labels -> attributes -> characteristics -> functionality -> fruits/non-fruits -> history -> says/silences -> promises/delivery",
        "domains": list(DOMAINS),
        "concepts": [asdict(n) for n in CONCEPTS.values()],
        "connections": [asdict(e) for e in LINKS],
        "sources": SOURCE_REFERENCES,
        "user_prompts_verbatim": USER_WORDS,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rows = matrix()
    with (out / "comparison_matrix.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    (out / "sample_case.json").write_text(json.dumps(
        audit_template("Example Institution", "institutional"), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md = ["# HOUSE / HOUSES OF LAMENTATIONS — BEYOND DUALITY", "",
          "## Original user wording (exact)", ""]
    md += [f"> {q}" for q in USER_WORDS]
    md += ["", "## Cross-domain atlas", "",
           "The table below is a structured comparison, not a claim of equivalence or metaphysical proof.", ""]
    for n in CONCEPTS.values():
        md += [f"### {n.label} (`{n.id}`)", "", n.summary, "",
               f"- **Domain / layer:** {n.domain} / {n.layer}",
               f"- **Evidence class:** {n.evidence_class}"]
        for k in FIELDS:
            if getattr(n, k):
                md.append(f"- **{k.replace('_', ' ').title()}:** {'; '.join(getattr(n,k))}")
        if n.cautions:
            md.append(f"- **Cautions:** {'; '.join(n.cautions)}")
        md += [f"- **References:** {', '.join(n.refs)}", ""]
    md += ["## Links", ""]
    md += [f"- `{e.source}` — **{e.relation}** → `{e.target}` [{e.status}] {e.note}" for e in LINKS]
    (out / "atlas_report.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"Exported {len(CONCEPTS)} concepts and {len(LINKS)} links into {out}")


def show_json(value: Any) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="User-source-preserving cross-domain Lamentations atlas")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("overview", help="List all concepts")
    sub.add_parser("matrix", help="View the full ACF/Fruits/Claims/Delivery comparison in JSON")
    p = sub.add_parser("show", help="Inspect one concept")
    p.add_argument("id")
    p = sub.add_parser("compare", help="Compare any two houses/domains")
    p.add_argument("first"); p.add_argument("second")
    p = sub.add_parser("trace", help="Trace links outward from one concept")
    p.add_argument("id"); p.add_argument("--depth", type=int, default=2)
    p = sub.add_parser("search", help="Find concepts by term")
    p.add_argument("query")
    sub.add_parser("original-words", help="Show user's preserved words in original order")
    sub.add_parser("validate", help="Verify relationships, refs, and verbatim quotes")
    p = sub.add_parser("export", help="Export atlas JSON, matrix CSV, report, and case template")
    p.add_argument("--out", default=str(ROOT / "out"))
    p = sub.add_parser("evaluate", help="Inspect a sourced promise-vs-delivery case JSON")
    p.add_argument("case_file")
    sub.add_parser("domains", help="Show everywhere the comparison method can be tried")
    args = parser.parse_args(argv)
    try:
        if args.cmd == "overview":
            for n in CONCEPTS.values():
                print(f"{n.id:35} {n.domain:28} [{n.evidence_class}] {n.label}")
            print(f"\n{len(CONCEPTS)} concepts, {len(LINKS)} links, {len(DOMAINS)} application domains")
        elif args.cmd == "show": show_json(asdict(CONCEPTS[args.id]))
        elif args.cmd == "compare": show_json(compare(args.first, args.second))
        elif args.cmd == "trace": show_json(traverse(args.id, args.depth))
        elif args.cmd == "matrix": show_json(matrix())
        elif args.cmd == "search": show_json([asdict(n) for n in matches(args.query)])
        elif args.cmd == "original-words":
            for i, q in enumerate(USER_WORDS, 1): print(f"{i}. {q}\n")
        elif args.cmd == "validate":
            errors = validate()
            print("VALID" if not errors else "INVALID")
            for e in errors: print(" -", e)
            return 1 if errors else 0
        elif args.cmd == "export": write_export(Path(args.out))
        elif args.cmd == "evaluate":
            case = json.loads(Path(args.case_file).read_text(encoding="utf-8"))
            show_json(assessment(case))
        elif args.cmd == "domains": print("\n".join(DOMAINS))
    except (KeyError, FileNotFoundError, json.JSONDecodeError, OSError) as ex:
        print(f"Error: {ex}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())