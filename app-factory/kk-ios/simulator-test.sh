#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
KK_UDID="$(xcrun simctl list devices available -j | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(x["udid"] for v in d["devices"].values() for x in v if "iPhone" in x["name"]))')"
xcrun simctl boot "$KK_UDID" || true
xcrun simctl bootstatus "$KK_UDID" -b
xcrun simctl install "$KK_UDID" build/iphonesimulator/Payload/KKNewCreature.app
KK_CONTAINER="$(xcrun simctl get_app_container "$KK_UDID" com.nathantabor.kknewcreature data)"
for KK_LAUNCH in 1 2; do
  rm -f "$KK_CONTAINER/Documents/selftest.json"
  xcrun simctl launch "$KK_UDID" com.nathantabor.kknewcreature --kk-self-test
  for KK_POLL in $(seq 1 45); do
    if [[ -f "$KK_CONTAINER/Documents/selftest.json" ]]; then break; fi
    sleep 1
  done
  python3 - "$KK_CONTAINER/Documents/selftest.json" "$KK_LAUNCH" <<'PY'
import json,sys
p=json.load(open(sys.argv[1])); n=int(sys.argv[2])
assert p['fixture']['pass'] is True,p
assert p['fixture']['count']==n,p
assert p['saves']['KK_NATIVE_TEST']==str(n),p
assert p['saveError']=='',p
print('Native bridge + persistent storage launch',n,'PASS')
PY
  cp "$KK_CONTAINER/Documents/selftest.json" "build/selftest-$KK_LAUNCH.json"
  xcrun simctl io "$KK_UDID" screenshot "build/native-launch-$KK_LAUNCH.png"
  xcrun simctl terminate "$KK_UDID" com.nathantabor.kknewcreature
done
