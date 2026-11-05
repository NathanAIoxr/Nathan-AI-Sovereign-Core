#!/usr/bin/env python3
"""Nathan AI / ONE — The Brainstormer, additive Python expansion v0.0.2.

Original Brainstormer class is kept intact below. New features are provided by
BrainstormerPlus, with opt-in project persistence and interoperability with the
NathanAI_Brainstormer_Offline_v001.html JSON export format.

Python 3.9+, standard library only; local-first, no network or model service.
"""

# ─── ORIGINAL USER-AUTHORED CLASS: PRESERVED VERBATIM ─────────────────────────
class Brainstormer:
    def __init__(self, nathan_core):
        self.nathan = nathan_core
        self.session_log = []          # keeps every generated option
        self.active_seeds = []         # current story / theme seeds

    def release(self, raw_input: str, mode="story"):
        """
        Take anything that is in the mind/skull and expand it into
        concrete, usable options. Modes: story, layout, holiday,
        calendar, phrasing, character, scene.
        """
        seeds = self._extract_seeds(raw_input)
        options = self._generate_options(seeds, mode=mode)
        self.session_log.append({"input": raw_input, "options": options})
        return options

    def _extract_seeds(self, text):
        # Lightweight local extraction – expand later with better NLP
        return [t.strip() for t in text.replace(".", ",").split(",") if t.strip()]

    def _generate_options(self, seeds, mode="story", count=7):
        # Placeholder generative logic – replace with local model or rules
        base = " × ".join(seeds) if seeds else "open field"
        templates = {
            "story": [
                f"Core thread: {base} unfolds across three quiet rooms",
                f"Mirror version: the same events told backward from the last day",
                f"Object version: the story is carried by a single recurring object",
                f"Calendar version: every major turn is pinned to a specific date",
                f"Silence version: the most important part is never spoken",
                f"Dual version: two contradictory accounts that are both true",
                f"Scrapbook version: the story exists only as captions under images"
            ],
            "layout": [
                f"Grid locked to the 25-day Christmas matrix",
                f"Free-form canvas with push-pin anchors",
                f"Bottom-up text blocks that grow toward the top",
                f"Mirror-readable page (works upside-down or reversed)"
            ],
            "holiday": [
                f"Christmas fridge calendar with neon gridlines",
                f"Birthday multi-layer stack for the whole family",
                f"Quiet December evenings mode – low light, high warmth"
            ]
        }
        return templates.get(mode, templates["story"])[:count]

    def teach_communication(self, selected_option: str):
        """
        Turn a chosen option into clearer language the user can reuse.
        Returns a short communication scaffold.
        """
        return {
            "plain": selected_option,
            "spoken": f"What I mean is: {selected_option}",
            "short": selected_option.split(":")[-1].strip() if ":" in selected_option else selected_option,
            "for_canvas": f"[TEXT BLOCK] {selected_option}"
        }

    def handoff_to_workspace(self, chosen):
        """Push the selected idea straight into the scrapbook / calendar."""
        return self.nathan.workspace.receive_brainstorm(chosen)
# ─── END OF ORIGINAL USER-AUTHORED CLASS ──────────────────────────────────────

from datetime import date, datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
from uuid import uuid4

FORMAT = 'NathanAI-Brainstormer-v1'  # Matches the HTML prototype's package
MODES = ('story', 'layout', 'holiday', 'calendar', 'phrasing', 'character', 'scene')


def _now():
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def _id():
    return uuid4().hex[:18]


def _compact_json(value):
    """Compact JSON suitable for validating the HTML v001 project's SHA-256."""
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def _sha(project):
    return hashlib.sha256(_compact_json(project).encode('utf-8')).hexdigest()


def _default_project():
    return {
        'schema': 1, 'projectId': _id(), 'updatedAt': 0,
        'mode': 'story', 'count': 7, 'raw': '',
        'options': [], 'selectedId': None, 'garage': [],
        'canvas': [], 'events': [], 'calendarYear': date.today().year,
        'activeTab': 'brainstorm',
    }


class ProjectStore:
    """File-backed, offline idea garage + scrapbook + calendar.

    Using a JSON project rather than a database makes the project easy to move
    between the Python and browser prototypes. Export files are SHA-256 hashed;
    the hash detects accidental changes but is NOT a digital signature.
    """

    def __init__(self, path='nathan_brainstormer_project.json'):
        self.path = Path(path)
        self.project = _default_project()
        if self.path.is_file():
            data = json.loads(self.path.read_text(encoding='utf-8'))
            self.project = self._validate_project(data.get('project', data))

    @staticmethod
    def _validate_project(project):
        if not isinstance(project, dict) or not isinstance(project.get('garage', []), list):
            raise ValueError('Invalid Brainstormer project')
        merged = _default_project()
        merged.update(project)
        for field in ('options', 'garage', 'canvas', 'events'):
            if not isinstance(merged[field], list):
                raise ValueError(f'Expected list for {field}')
        return merged

    def save(self):
        self.project['updatedAt'] = int(datetime.now(timezone.utc).timestamp() * 1000)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        data = json.dumps(self.project, ensure_ascii=False, indent=2)
        # Atomic replacement helps avoid partial writes if interrupted.
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=self.path.parent,
                                         prefix='.brainstorm-', suffix='.tmp',
                                         delete=False) as tmp:
            temp_path = Path(tmp.name)
            try:
                tmp.write(data)
                tmp.flush()
                os.fsync(tmp.fileno())
            except Exception:
                temp_path.unlink(missing_ok=True)
                raise
        os.replace(temp_path, self.path)

    def record_batch(self, text, mode, count, options, seeds):
        timestamp = _now()
        entries = []
        for option in options:
            entry = {
                'id': _id(), 'text': option, 'mode': mode,
                'createdAt': timestamp, 'input': text, 'status': 'unreleased',
            }
            entries.append(entry)
        self.project.update(raw=text, mode=mode, count=count)
        self.project['options'] = [
            {k: entry[k] for k in ('id', 'text', 'mode', 'createdAt')} for entry in entries
        ]
        self.project['garage'].extend(entries)
        self.project['selectedId'] = entries[0]['id'] if entries else None
        self.save()
        return entries

    def list_ideas(self, status=None):
        return [dict(x) for x in self.project['garage']
                if status is None or x.get('status') == status]

    def find_idea(self, idea_id):
        return next((x for x in self.project['garage'] if x['id'] == idea_id), None)

    def find_idea_by_text_or_id(self, text_or_id):
        return self.find_idea(text_or_id) or next(
            (x for x in reversed(self.project['garage'])
             if x['text'] == text_or_id), None)

    def mark_used(self, text_or_id):
        # Resolve by ID first, then by exact text. Never silently delete an idea.
        item = self.find_idea_by_text_or_id(text_or_id)
        if item is not None:
            item['status'] = 'used'
            self.save()
        return item

    def export_browser_json(self, path):
        """Export a package that the existing HTML prototype can import."""
        # Snapshot uses same property order and compact hashing as JS JSON.stringify.
        project = dict(self.project)
        project['activeTab'] = 'brainstorm'
        package = {
            'format': FORMAT, 'createdAt': _now(),
            'watermark': 'NATHAN AI / ONE', 'sha256': _sha(project),
            'project': project,
        }
        out = Path(path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(package, ensure_ascii=False, indent=2), encoding='utf-8')
        return package

    def import_browser_json(self, path):
        """Import HTML v001 package, verifying its SHA-256 before replacing state."""
        package = json.loads(Path(path).read_text(encoding='utf-8'))
        if package.get('format') != FORMAT or 'project' not in package:
            raise ValueError('Unsupported Brainstormer export format')
        if package.get('sha256') is None or package['sha256'] != _sha(package['project']):
            raise ValueError('SHA-256 mismatch: export changed or incomplete')
        validated = self._validate_project(package['project'])
        self.project = validated
        self.save()
        return len(self.project['garage'])


class LocalWorkspace:
    def __init__(self, store):
        self.store = store

    def receive_brainstorm(self, chosen):
        item = self.store.find_idea_by_text_or_id(chosen)
        source_id = item['id'] if item else None
        text = item['text'] if item else chosen
        block = {'id': _id(), 'text': str(text), 'sourceId': source_id,
                 'createdAt': _now()}
        self.store.project['canvas'].append(block)
        self.store.mark_used(chosen)
        self.store.save()
        return dict(block)


class LocalCalendar:
    def __init__(self, store):
        self.store = store

    def receive_brainstorm(self, chosen, day, kind='event'):
        day = date.fromisoformat(str(day))  # Enforce YYYY-MM-DD valid date.
        item = self.store.find_idea_by_text_or_id(chosen)
        event = {
            'id': _id(), 'date': day.isoformat(),
            'title': item['text'] if item else str(chosen),
            'kind': kind, 'sourceId': item['id'] if item else None,
        }
        self.store.project['events'].append(event)
        self.store.mark_used(chosen)
        self.store.save()
        return dict(event)


class LocalNathanCore:
    """Small adapter; a real Nathan Core can expose the same workspace API."""
    def __init__(self, project_path='nathan_brainstormer_project.json'):
        self.store = ProjectStore(project_path)
        self.workspace = LocalWorkspace(self.store)
        self.calendar = LocalCalendar(self.store)


# Template structure is deliberately data-driven for later editing/translating.
# All 7 modes return exactly 5, 7 or 12 variations without external services.
_MODE_PATTERNS = {
    'story': [
        'Core thread: {seed} unfolds across three quiet rooms',
        'Mirror story: begin at the ending and retrace {seed}',
        'Object story: one recurring object carries {seed}',
        'Calendar story: pin every turn of {seed} to a date',
        'Silent story: what is never spoken changes {seed}',
        'Double account: two narrators interpret {seed} differently',
        'Scrapbook story: tell {seed} entirely through captions',
        'Across generations: {seed} passes from elder to child',
        'One day: tell {seed} within a single sunrise and sunset',
        'Many doors: each door reveals a different part of {seed}',
        'Letter format: {seed} is retold through correspondence',
        'Memory archive: organize the evidence around {seed}',
    ],
    'layout': [
        '25-day Christmas grid built around {seed}',
        'Push-pin refrigerator canvas organizing {seed}',
        'Bottom-up writing blocks containing {seed}',
        'Upside-down and mirrored reading page for {seed}',
        'Five-column gallery organizing {seed}',
        'Three-pane comparison page for {seed}',
        'One-object focal point surrounded by {seed}',
        'A–Z index tabs sorting {seed}',
        'Circular scrapbook wheel around {seed}',
        'Two-page foldout presentation of {seed}',
        'Timeline ribbon threading {seed} across panels',
        'Text-only minimalist page for {seed}',
    ],
    'holiday': [
        'Christmas refrigerator calendar featuring {seed}',
        'Layered birthday greeting centered on {seed}',
        'Holiday letter with handwritten motifs for {seed}',
        '25-day December idea prompts featuring {seed}',
        'Warm winter evening memory page for {seed}',
        'New Year reflection card featuring {seed}',
        'Thanksgiving gratitude scrapbook around {seed}',
        'Halloween storybook caption treatment for {seed}',
        'Springtime renewal layout featuring {seed}',
        'Independence Day family memory page for {seed}',
        'Anniversary time-capsule page for {seed}',
        'Create-your-own holiday around {seed}',
    ],
    'calendar': [
        'One-day milestone for {seed}',
        'Weekly repeating prompt for {seed}',
        'Monthly summary block for {seed}',
        'Birthday date stack connected to {seed}',
        'Christmas 25-day countdown for {seed}',
        'Annual family remembrance map for {seed}',
        'Historical then-and-now timeline for {seed}',
        'Decade overview showing changes in {seed}',
        'Before-and-after timeline for {seed}',
        'Date-free seasonal tracker for {seed}',
        'Personal celebration countdown for {seed}',
        'Printable fridge calendar featuring {seed}',
    ],
    'phrasing': [
        'Plain version: {seed}',
        'Spoken version: What I mean is {seed}',
        'Short version: {seed}',
        'Question version: What matters most about {seed}?',
        'Headline version: {seed}',
        'Letter opening: I want to tell you about {seed}',
        'Friendly invitation: Come explore {seed}',
        'Instruction version: Start with {seed}',
        'Poetic version: One thought returns — {seed}',
        'Teaching version: Let me explain {seed} one part at a time',
        'Parallel comparison: {seed}, viewed from both directions',
        'Closing line: This is what I want remembered about {seed}',
    ],
    'character': [
        'Main character who safeguards {seed}',
        'Historian preserving the memory of {seed}',
        'Family storyteller sharing {seed}',
        'Child discovering a story about {seed}',
        'Inventor reimagining {seed}',
        'Traveler encountering {seed}',
        'Skeptic evaluating accounts of {seed}',
        'Artist designing a symbol for {seed}',
        'Caretaker collecting mementos of {seed}',
        'Teacher explaining {seed} to newcomers',
        'Two friends debating the meaning of {seed}',
        'Narrator who can only speak in dates about {seed}',
    ],
    'scene': [
        'Kitchen table scene where {seed} begins',
        'Refrigerator covered with handwritten notes about {seed}',
        'Candlelit winter room displaying {seed}',
        'Garden scene with signs recalling {seed}',
        'Library archive that preserves {seed}',
        'Front porch conversation about {seed}',
        'Night-sky observation connected to {seed}',
        'Holiday family gathering organized around {seed}',
        'Historical room reconstructed from notes on {seed}',
        'Empty theater stage devoted to {seed}',
        'Desk of letters and calendars telling {seed}',
        'Final scrapbook page that resolves {seed}',
    ],
}


class BrainstormerPlus(Brainstormer):
    """Additive v002. Original class remains unchanged and usable."""

    def __init__(self, nathan_core):
        super().__init__(nathan_core)
        self.store = getattr(nathan_core, 'store', None)

    def release(self, raw_input: str, mode='story', count=7):
        if mode not in MODES:
            raise ValueError(f'Unknown mode {mode!r}; choose from {MODES}')
        if count not in (5, 7, 12):
            raise ValueError('Available option counts: 5, 7, 12')
        if not isinstance(raw_input, str):
            raise TypeError('raw_input must be text')
        # Keep every user word unchanged in original input; seed extraction is
        # only a heuristic used for generating proposed new text.
        seeds = self._extract_seeds(raw_input)
        self.active_seeds = list(seeds)
        choices = self._generate_options(seeds, mode=mode, count=count)
        self.session_log.append({'input': raw_input, 'options': list(choices)})
        if self.store is not None:
            self.store.record_batch(raw_input, mode, count, choices, seeds)
        return choices

    def _generate_options(self, seeds, mode='story', count=7):
        base = ' × '.join(seeds) if seeds else 'open field'
        return [pattern.format(seed=base) for pattern in _MODE_PATTERNS[mode][:count]]

    def teach_communication(self, selected_option: str):
        scaffold = super().teach_communication(selected_option)
        scaffold['original_unchanged'] = selected_option
        scaffold['question'] = f'How would you explain this to someone new? {selected_option}'
        scaffold['outline'] = [
            f'Main idea: {selected_option}',
            'Why it matters:', 'An example:', 'What happens next:',
        ]
        return scaffold

    def handoff_to_calendar(self, chosen, day, kind='event'):
        if not hasattr(self.nathan, 'calendar'):
            raise AttributeError('Nathan Core needs calendar.receive_brainstorm')
        return self.nathan.calendar.receive_brainstorm(chosen, day, kind)

    def idea_garage(self, status=None):
        if self.store is None:
            raise RuntimeError('A ProjectStore-backed core is required for persistence')
        return self.store.list_ideas(status)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Offline Nathan AI Brainstormer')
    parser.add_argument('idea', nargs='?', default='Christmas letters, birthdays, family stories')
    parser.add_argument('--mode', choices=MODES, default='story')
    parser.add_argument('--count', type=int, choices=(5, 7, 12), default=7)
    parser.add_argument('--project', default='nathan_brainstormer_project.json')
    parser.add_argument('--export', help='Save HTML-compatible JSON project package')
    args = parser.parse_args()
    core = LocalNathanCore(args.project)
    brain = BrainstormerPlus(core)
    for i, idea in enumerate(brain.release(args.idea, args.mode, args.count), 1):
        print(f'{i:02}. {idea}')
    if args.export:
        core.store.export_browser_json(args.export)
        print(f'\nExported to: {args.export}')
    print(f'\nIdeas in garage: {len(brain.idea_garage())}')