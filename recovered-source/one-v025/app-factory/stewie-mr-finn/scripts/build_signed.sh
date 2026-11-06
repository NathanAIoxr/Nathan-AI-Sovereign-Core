#!/bin/bash
# This script runs ONLY on a trusted Mac runner after Apple signing secrets are configured.
set -euo pipefail

for name in APPLE_CERTIFICATE_P12_BASE64 APPLE_CERTIFICATE_PASSWORD APPLE_PROVISIONING_PROFILE_BASE64 APPLE_TEAM_ID; do
  if [[ -z "${!name:-}" ]]; then echo "Missing required GitHub Actions secret: $name" >&2; exit 1; fi
done

: "${DISTRIBUTION_METHOD:=ad-hoc}"
if [[ "$DISTRIBUTION_METHOD" != "ad-hoc" && "$DISTRIBUTION_METHOD" != "app-store-connect" ]]; then
  echo "Unsupported distribution method" >&2; exit 1
fi

TEMP_DIR="$(mktemp -d)"
KEYCHAIN="$TEMP_DIR/stewie-build.keychain-db"
KEYCHAIN_PASSWORD="$(uuidgen)"
cleanup() { security delete-keychain "$KEYCHAIN" >/dev/null 2>&1 || true; rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

printf '%s' "$APPLE_CERTIFICATE_P12_BASE64" | base64 -D > "$TEMP_DIR/distribution.p12"
printf '%s' "$APPLE_PROVISIONING_PROFILE_BASE64" | base64 -D > "$TEMP_DIR/profile.mobileprovision"
security cms -D -i "$TEMP_DIR/profile.mobileprovision" > "$TEMP_DIR/profile.plist"
PROFILE_UUID="$(/usr/libexec/PlistBuddy -c 'Print UUID' "$TEMP_DIR/profile.plist")"
PROFILE_NAME="$(/usr/libexec/PlistBuddy -c 'Print Name' "$TEMP_DIR/profile.plist")"

mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles" dist
cp "$TEMP_DIR/profile.mobileprovision" "$HOME/Library/MobileDevice/Provisioning Profiles/$PROFILE_UUID.mobileprovision"
security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
security default-keychain -s "$KEYCHAIN"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN"
security set-keychain-settings -lut 21600 "$KEYCHAIN"
security import "$TEMP_DIR/distribution.p12" -k "$KEYCHAIN" -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign
security set-key-partition-list -S apple-tool:,apple: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN"

xcodegen generate
xcodebuild -project StewieAndMrFinn.xcodeproj -scheme StewieAndMrFinn \
  -configuration Release -destination 'generic/platform=iOS' -sdk iphoneos \
  -archivePath dist/StewieAndMrFinn.xcarchive \
  "DEVELOPMENT_TEAM=$APPLE_TEAM_ID" "CODE_SIGN_STYLE=Manual" \
  "PROVISIONING_PROFILE_SPECIFIER=$PROFILE_NAME" 'CODE_SIGN_IDENTITY=Apple Distribution' \
  clean archive

export PROFILE_NAME
python3 - <<'PY'
import os,plistlib
options={
    'method':os.environ['DISTRIBUTION_METHOD'],
    'teamID':os.environ['APPLE_TEAM_ID'],
    'signingStyle':'manual',
    'provisioningProfiles': {'com.nathantabor.stewieandfinn':os.environ['PROFILE_NAME']}
}
with open('dist/ExportOptions.plist','wb') as f:plistlib.dump(options,f)
PY

xcodebuild -exportArchive -archivePath dist/StewieAndMrFinn.xcarchive \
  -exportPath dist/exported -exportOptionsPlist dist/ExportOptions.plist
IPA="$(find dist/exported -maxdepth 2 -name '*.ipa' -type f | head -n 1)"
if [[ -z "$IPA" ]]; then echo 'Signed IPA missing from export.' >&2; exit 1; fi
cp "$IPA" dist/StewieAndMrFinn-SIGNED.ipa
unzip -t dist/StewieAndMrFinn-SIGNED.ipa | tail -1