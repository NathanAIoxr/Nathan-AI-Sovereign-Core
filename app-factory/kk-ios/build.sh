#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
SDK_NAME="${1:-iphoneos}"
if [[ "$SDK_NAME" == "iphonesimulator" ]]; then
  KK_ARCH="$(uname -m)"
  KK_TARGET="${KK_ARCH}-apple-ios16.0-simulator"
else
  KK_ARCH=arm64
  KK_TARGET=arm64-apple-ios16.0
fi
KK_SDK="$(xcrun --sdk "$SDK_NAME" --show-sdk-path)"
KK_APP="build/$SDK_NAME/Payload/KKNewCreature.app"
mkdir -p "$KK_APP/Web"
xcrun --sdk "$SDK_NAME" clang -target "$KK_TARGET" -isysroot "$KK_SDK" -fobjc-arc -fmodules -Wall -Wextra -Wno-unused-parameter -Wno-deprecated-declarations -O2 main.m -framework UIKit -framework WebKit -framework UniformTypeIdentifiers -o "$KK_APP/KKNewCreature"
cp bridge.js "$KK_APP/bridge.js"
cp fixture.html "$KK_APP/Web/index.html"
python3 - "$KK_APP" "$SDK_NAME" <<'PY'
import base64,plistlib,sys,pathlib
app=pathlib.Path(sys.argv[1]);sim=sys.argv[2]=='iphonesimulator'
info={'CFBundleDevelopmentRegion':'en','CFBundleDisplayName':'KK — New Creature','CFBundleExecutable':'KKNewCreature','CFBundleIdentifier':'com.nathantabor.kknewcreature','CFBundleInfoDictionaryVersion':'6.0','CFBundleName':'KKNewCreature','CFBundlePackageType':'APPL','CFBundleShortVersionString':'1.0.0','CFBundleVersion':'1','LSRequiresIPhoneOS':True,'MinimumOSVersion':'16.0','UIDeviceFamily':[1,2],'UIRequiredDeviceCapabilities':['arm64'] if not sim else [],'UILaunchScreen':{},'UISupportedInterfaceOrientations':['UIInterfaceOrientationPortrait','UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight'],'UISupportedInterfaceOrientations~ipad':['UIInterfaceOrientationPortrait','UIInterfaceOrientationPortraitUpsideDown','UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight'],'UIUserInterfaceStyle':'Dark','CFBundleSupportedPlatforms':['iPhoneSimulator' if sim else 'iPhoneOS'],'CFBundleIcons':{'CFBundlePrimaryIcon':{'CFBundleIconFiles':['AppIcon60x60'],'UIPrerenderedIcon':False}},'CFBundleIcons~ipad':{'CFBundlePrimaryIcon':{'CFBundleIconFiles':['AppIcon60x60','AppIcon76x76','AppIcon83.5x83.5'],'UIPrerenderedIcon':False}}}
(app/'Info.plist').write_bytes(plistlib.dumps(info))
(app/'AppIcon.png').write_bytes(base64.b64decode(pathlib.Path('icon.b64').read_text()))
PY
sips -z 120 120 "$KK_APP/AppIcon.png" --out "$KK_APP/AppIcon60x60@2x.png" >/dev/null
sips -z 180 180 "$KK_APP/AppIcon.png" --out "$KK_APP/AppIcon60x60@3x.png" >/dev/null
sips -z 152 152 "$KK_APP/AppIcon.png" --out "$KK_APP/AppIcon76x76@2x~ipad.png" >/dev/null
sips -z 167 167 "$KK_APP/AppIcon.png" --out "$KK_APP/AppIcon83.5x83.5@2x~ipad.png" >/dev/null
if [[ "$SDK_NAME" == "iphonesimulator" ]]; then
  codesign --force --sign - "$KK_APP"
else
  (cd "build/$SDK_NAME" && /usr/bin/zip -qr ../KK-Native-Template-unsigned.ipa Payload)
  file "$KK_APP/KKNewCreature"
  xcrun vtool -show-build "$KK_APP/KKNewCreature"
fi
