# KK — The New Creature: iOS runtime

Native UIKit / WKWebView runtime for Nathan Tabor's existing KK game sources.
This public directory holds only the new native runtime and a synthetic test fixture.
Private authored games, database and archives must be inserted into the unsigned
IPA locally after compilation. They must not be committed to this public repository.

On a Mac with Xcode: `bash build.sh iphoneos` produces an arm64 iOS 16+
unsigned IPA template. `bash build.sh iphonesimulator` and `bash simulator-test.sh`
exercise the native bridge and storage persistence across two process launches.

The final private package replaces `Web/` with preserved game resources and
adds original archives under `SourceArchives/`. The main entry is `Web/index.html`.
Sideloadly applies the user's Apple signing identity after private packaging.

Native storage uses an atomic Application Support JSON file, a previous snapshot,
backup/restore through Files, native JavaScript confirm dialogs, Blob export sharing,
and an exportable test report. Existing game save namespaces are preserved.
It does not provide cloud synchronization or imply App Store approval.
