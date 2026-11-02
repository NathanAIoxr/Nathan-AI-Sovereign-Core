# Nathan AI · Unified command center

Every Nathan AI entry page shares a command palette through the header **Search · Ctrl/⌘ K** control or keyboard shortcut. This is one shared implementation, not copied per-page navigation. The main hub now has a task-based entry form, pinned destinations, and progressive disclosure of the existing destination links. No original module or source content is removed.

## Navigation and context

The fast default view searches 32 known destinations and the existing 93-workflow plugin inventory. Selecting a workflow opens that exact workflow in the Plugin Hub for review; it does not execute the workflow. Unknown/remote URLs are not accepted as navigation preferences.

Public-archive search is optional and loads the existing nine JSON catalogs (10,641 records at this version). Local coin/life/source graph and saved research are searched only after **My local sources** is selected. Both scopes reset when the palette closes or reopens. Source results open one explicitly selected source in the Assistant, with source ID, excerpt, stage and private/local label preserved. The payload travels through same-origin sessionStorage, not URL query text, and is consumed once. No answer, model request or plugin action happens automatically. The Assistant deduplicates repeated source IDs before preparing model context.

The separate **Ask Nathan AI about this** action opens an unsubmitted question. Recognizable credential payloads are rejected before preparing handoffs. Source search is keyword retrieval, not generative inference.

## Personalization without content history

Pins are bounded to twelve known destination IDs. Optional recent-page history is off by default, stores at most six known IDs, and clears when disabled. Query text, source excerpts, credentials, private filenames and model responses are not part of launcher preferences. Reset removes only the launcher key `nathan-ai.launcher.v1`. Storage changes are checked before writing and synchronized across open tabs. Preference errors do not prevent navigation or touch source/game/conversation storage.

The palette supports ArrowDown from the input, ArrowUp/ArrowDown through results, native link activation, Escape, and return to the opening control. Ctrl/⌘ K does not open over another native app dialog. Rapid reopen avoids delayed close events clearing a new search. Search scopes reset on each opening.

## Verification

Run `node --test app-factory/nathan-ai/launcher/engine.test.cjs`. Tests cover known paths, aliases, bounded pins/recents, source packet validation, preference/content separation and shared integration across all current entry pages. Browser checks additionally exercise home task entry, private opt-in, contextual coin answers, public archive coverage, plugin deep linking, optional recent pages, keyboard navigation, modal isolation and scoped reset.
