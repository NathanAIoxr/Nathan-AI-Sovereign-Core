# Nathan AI Central Conductor

Preview code and staged deployment contracts. The complete locally validated prototype ZIP is available in the associated ChatGPT handoff; it includes `install.sh`, `api/main.py`, `workers/governor.py`, `systemd/` and these edge assets.

Before production: provision an owned Ubuntu host; configure Cloudflare Access and Tunnel, existing KV/R2/D1 IDs, protected-branch review, secure credentials and tested SSH. Do not enable UFW blindly. KV is eventually consistent, not a globally instantaneous emergency kill switch. Git operations should stage locally and use reviewed PRs, not push straight to protected main. The R2 task prototype supports small inline uploads only; large uploads require a separate signed-upload flow. No Ubuntu or Cloudflare live deployment is established by these files.

Checks for full prototype: `python3 -m compileall -q api workers`, `node --check edge/worker.js`, `python3 -m json.tool openapi.json`, `bash -n install.sh`.
