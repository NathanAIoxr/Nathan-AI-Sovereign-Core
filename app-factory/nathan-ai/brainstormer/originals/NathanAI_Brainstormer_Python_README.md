# Nathan AI / ONE — The Brainstormer v0.0.2

An **additive, local-first** Python implementation. The original user-supplied `Brainstormer` class is preserved, with `BrainstormerPlus` providing enhancements. No APIs or third-party packages are needed.

## Run it

```bash
python NathanAI_Brainstormer_Python_v002.py "Christmas letters, birthdays, family stories" --mode holiday --count 12 --export Brainstormer_Project.json
```

This prints the generated options, stores them in `nathan_brainstormer_project.json`, and writes `Brainstormer_Project.json`, which can be imported into the existing browser prototype (`NathanAI_Brainstormer_Offline_v001.html`). The saved project data remains local.

## Use as a Python module

```python
from NathanAI_Brainstormer_Python_v002 import LocalNathanCore, BrainstormerPlus

nathan = LocalNathanCore('my_brainstorm_project.json')
brainstormer = BrainstormerPlus(nathan)

ideas = brainstormer.release('Christmas letters, birthdays', mode='holiday', count=7)
print(ideas)

# The original method still works; text OR saved idea ID may be passed.
canvas_block = brainstormer.handoff_to_workspace(ideas[0])
calendar_event = brainstormer.handoff_to_calendar(ideas[1], '2026-12-25', kind='holiday')

print(brainstormer.teach_communication(ideas[0]))
print(brainstormer.idea_garage(status='unreleased'))

nathan.store.export_browser_json('portable_project.json')
```

## Seven generation modes

- `story` — plot, perspective, narrative devices
- `layout` — canvas, reading direction, structural design
- `holiday` — Christmas, birthdays, family celebrations
- `calendar` — dates, recurrences, timelines
- `phrasing` — plain language, spoken language, writing angles
- `character` — fictional character perspectives
- `scene` — narrative settings

All modes produce **5, 7, or 12** rule-based alternatives. Source input is stored unchanged in the Idea Garage; newly produced options are separately identified as generated text. The selected text can be handed to the scrapbook canvas or to the calendar.

## Interoperability and limits

- `export_browser_json` writes the `NathanAI-Brainstormer-v1` project package format with a SHA-256 checksum.
- `import_browser_json` verifies a browser-exported checksum before loading it.
- Both directions work with the previously created HTML v001 project's JSON export.
- The checksum detects changes but **does not authenticate the author** or encrypt the contents.
- The app is **deterministic, rule-based text generation**, not a local LLM, historical truth engine, or automated email system.
- This file is ready to **add to GitHub**, but no repository files have been changed by this prototype.

**Architecture:** Nathan Core → BrainstormerPlus / ProjectStore → Digital Workspace & Calendar → JSON packaging.