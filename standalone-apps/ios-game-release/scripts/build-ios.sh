#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
scheme="${1:?Pass Scrambler, YardArcade, Sudoku, or Retro}"
case "$scheme" in
  Scrambler|YardArcade|Sudoku|Retro) ;;
  *) echo 'Unknown iOS scheme' >&2; exit 2 ;;
esac

if [[ "$(uname -s)" != Darwin ]] || ! command -v xcodebuild >/dev/null; then
  echo 'This build requires a Mac with Xcode 26 or newer.' >&2
  exit 1
fi
sdk="$(xcrun --sdk iphoneos --show-sdk-version)"
if (( ${sdk%%.*} < 26 )); then
  echo "iOS SDK 26 or later is required. Found $sdk." >&2
  exit 1
fi
node scripts/stage.mjs
node scripts/verify.mjs
python3 scripts/icons.py
xcodegen generate
mkdir -p dist

xcodebuild -project TaborGames.xcodeproj -scheme "$scheme" -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath ".build/$scheme" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build

bundle=".build/$scheme/Build/Products/Release-iphoneos/$scheme.app"
test -f "$bundle/$scheme"
test -f "$bundle/shelf.json"
test -f "$bundle/PrivacyInfo.xcprivacy"
python3 - "$bundle" <<'PY'
import hashlib, json, sys
from pathlib import Path
bundle = Path(sys.argv[1])
shelf = json.loads((bundle / 'shelf.json').read_text())
for asset in shelf['routes'].values():
    asset_path = bundle / Path(asset['file']).name
    assert hashlib.sha256(asset_path.read_bytes()).hexdigest() == asset['sha256'], asset_path
print(f"Verified {len(shelf['routes'])} assets inside the compiled iPhone app")
PY
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
mkdir "$stage/Payload"
cp -R "$bundle" "$stage/Payload/"
archive="$PWD/dist/$scheme-UNSIGNED.ipa"
rm -f "$archive"
(cd "$stage" && zip -qry "$archive" Payload)
unzip -tq "$archive"
echo "Unsigned validation archive: $archive"

if [[ "${RUN_SIMULATOR_TESTS:-0}" == 1 ]]; then
  device="$(xcrun simctl list devices available --json | python3 -c 'import json,sys; data=json.load(sys.stdin); devices=[d for r,items in data["devices"].items() if ".iOS-" in r for d in items if d["name"].startswith("iPhone")]; assert devices, "No iPhone simulator installed"; print(next((d for d in devices if d["name"] == "iPhone 17 Pro Max"), devices[0])["udid"])')"
  xcodebuild -project TaborGames.xcodeproj -scheme "$scheme" \
    -destination "platform=iOS Simulator,id=$device" -derivedDataPath ".build/$scheme-sim" \
    -resultBundlePath "dist/$scheme-simulator-${GITHUB_RUN_ATTEMPT:-1}.xcresult" \
    -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO test
fi
