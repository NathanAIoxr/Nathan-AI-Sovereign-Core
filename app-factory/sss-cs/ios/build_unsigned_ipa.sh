#!/usr/bin/env bash
set -euo pipefail
# Requires macOS / Xcode and the iPhoneOS SDK. Produces an *unsigned* IPA for
# re-signing by the device owner with Sideloadly or their Apple development team.
cd "$(dirname "$0")"
if ! command -v xcodebuild >/dev/null 2>&1; then echo 'ERROR: This build requires a Mac or macOS CI runner with Xcode.' >&2; exit 1; fi
ROOT="$PWD"
DERIVED="$ROOT/.build/DerivedData"
mkdir -p "$ROOT/dist"
xcodebuild -project SSSCS.xcodeproj -scheme SSSCS -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath "$DERIVED" CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build
APP="$DERIVED/Build/Products/Release-iphoneos/SSSCS.app"
[ -s "$APP/SSSCS" ] || { echo 'ERROR: no compiled iOS app executable was produced.' >&2; exit 2; }
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/Payload"
cp -R "$APP" "$TMP/Payload/SSSCS.app"
(cd "$TMP" && /usr/bin/zip -X -q -r "$ROOT/dist/SSS-CS-UNSIGNED.ipa" Payload)
ls -lh "$ROOT/dist/SSS-CS-UNSIGNED.ipa"
echo 'SUCCESS: Built an unsigned IPA. Sign it with your Apple team or your sideloading tool to install on an iPhone.'
