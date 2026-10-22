# ONE — The Last App · Native iPhone IPA (testing)

This is **ONE**: the existing Southern SUPPER Computer / **YULL LAW & YALL LAW OS** / **SEALED VOICE BOX**, not another app or another data store.

## Real output
GitHub Actions on `macos-15` generates an Xcode project from `project.yml`, compiles the app for **real iPhone hardware** (iOS 17+) using Apple's iPhoneOS SDK, packs `Payload/ONETheLastApp.app/` into **ONE-The-Last-App-UNSIGNED.ipa**, verifies the archive, and uploads it as an artifact. On `main`, the workflow also publishes the unsigned file as a GitHub Release asset if repository Actions have release-write permission.

**Unsigned ≠ installable.** This build has no Apple signing certificate or provisioning profile. Use Sideloadly on Windows/Mac with an authorized Apple ID to sign/install onto your own iPhone, or create a provisioned build through an Apple developer account. Sideloadly and Apple signing may impose expiration/reauthorization. Do not publish Apple ID credentials into this repository or enter them into the ONE app.

## What actually runs
- Native SwiftUI iPhone navigation surface for ONE, Sealed Voice Box and Master Library.
- Persistent WKWebView opens **the existing HTTPS ONE Pages site**, not a separate duplicate backend. All internet activity is directed to the owner-specified website except links the user opens externally.
- Native WKWebView device file upload selection, download-to-share-sheet support and explicit OS microphone permission prompt.
- Existing ONE offloader supports locally encrypted file/text/voice originals, encrypted backup, import/restore and optional private-cloud encrypted archive bridge when the owner has separately deployed a server.

**Current limitation:** This first IPA requires internet access to load the ONE Pages UI. WKWebView IndexedDB storage is *separate from Safari's IndexedDB*. To migrate originals, export a `.onevault` backup from Safari to Files, install ONE, unlock its fresh vault and restore the backup inside the app. Store your encryption passphrase securely. Deleting ONE can delete its local vault; never use this build as the only copy of valuable source material.

No automatic extraction of other native AI apps, background phone-wide audio recording, native Share Extension, independent second cloud backup, offline HTML bundle or App Store review approval is claimed. App Store publication could require further native functionality and policy review.

## Build locally on a Mac

Requirements: recent Xcode with iPhoneOS SDK, `brew install xcodegen`, Python 3.

```sh
cd app-factory/one/ios
python3 scripts/make_icon.py
xcodegen generate
xcodebuild -project ONETheLastApp.xcodeproj -scheme ONETheLastApp \
  -configuration Release -destination 'generic/platform=iOS' \
  -sdk iphoneos -derivedDataPath .build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build
mkdir -p Payload dist
cp -R .build/Build/Products/Release-iphoneos/ONETheLastApp.app Payload/
zip -qry dist/ONE-The-Last-App-UNSIGNED.ipa Payload
unzip -t dist/ONE-The-Last-App-UNSIGNED.ipa
```

## Reuse & permissions

The project bundle identifier is `com.nathantabor.one`. Only test on a phone you own or have permission to manage. The binary contains **no owner private original chat data, vault keys, credentials, paid AI service keys or secrets.**

The repository's existing native iPhone Stewart & Mr. Finn build and signing workflows remain untouched. ONE's original code and project names stay unchanged.
