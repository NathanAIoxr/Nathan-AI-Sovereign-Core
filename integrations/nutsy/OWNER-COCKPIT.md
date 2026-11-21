# NUTSY owner cockpit

Use the draft branch checkout on Ubuntu. The cockpit listens on IPv4 loopback and reads three local JSON receipts. It offers a read-only view of host resource measurements, the Cloudflare federation, process profiling and the Ubuntu and Cloudflare queues. Its status view omits task payloads, credentials, and enrolled node identifiers.

Run on `nathan-1` from the repository root:

```sh
state="$HOME/.local/state/nutsy"
python3 integrations/nutsy/federation.py --expect-host nathan-1 --filesystem /opt/conductor --output "$state/federation.json"
python3 integrations/nutsy/processing.py --expect-host nathan-1 --output "$state/processing.json"
python3 integrations/nutsy/cockpit.py --expect-host nathan-1 --state-dir "$state"
```

Open `http://127.0.0.1:8787/` from the host. For owner access from another device, use an existing authenticated private SSH connection and forward local port 8787 to the host's `127.0.0.1:8787`. The dashboard always reads the state directory on the machine running the service.

To populate the queue card, obtain the Cloudflare counts snapshot as shown in [JOB-RECOVERY.md](JOB-RECOVERY.md). Run the following from the checkout as a user permitted to read the Conductor ledger.

```sh
state="$HOME/.local/state/nutsy"
mkdir -p "$state"
(umask 077; receipt="$(mktemp "$state/.queue.XXXXXXXX")" &&
  if python3 integrations/nutsy/reconcile.py --cloud-snapshot cloud-counts.json >"$receipt"; then
    mv -f "$receipt" "$state/queue-reconciliation.json"
  else
    rm -f "$receipt"
    exit 1
  fi)
```

The dashboard reloads receipts when you select **Refresh receipts**. Re-run the corresponding collector to update a receipt. The federation collector records its observation time. A host or profile receipt bearing another machine's hostname is ignored. A missing receipt leaves the affected fields blank. The profiler measures candidate workers, while production tuning stays with the existing Conductor.

The current owner interface uses loopback so it can run independently of the inactive Cloudflare Tunnel. To use an owner-only Cloudflare hostname later, put an authenticated reverse proxy in front of the dashboard and verify denied access from a signed-out client before sending its URL. Host-header validation must be honored. Before a release for other owners, use separate authenticated installations or enforce owner isolation across every status endpoint; the host data belongs to its current operator.
