# Tabor Supercomputer — real compute node registration

This service is installed on an **actual authorized Linux machine**. It does not pretend that Cloudflare Workers are physical HPC nodes.

## Install
1. Create a restricted `tabor` system account and `/opt/tabor/node-agent`.
2. Copy `agent.py` and `tabor-node-agent.service` to their respective locations.
3. Set `/etc/tabor/node-agent.env` with node ID, **verified** fleet endpoint and shared secret; owner root, mode 0600.
4. Set the matching `FLEET_TOKEN` as a Cloudflare secret on the existing `tabor-compute-fleet` Worker. Do not commit secrets.
5. `systemctl daemon-reload && systemctl enable --now tabor-node-agent`.
6. Verify the node appears in D1 `tabor_compute_fleet` and a heartbeat in `tabor_compute_heartbeats`.

## Limits and safety
This agent transmits only basic host metadata and heartbeats. It does **not** accept arbitrary remote code execution, start miners, consume paid cloud credits, or claim a 2x performance improvement. Before enabling it, reconcile the existing fleet Worker heartbeat JSON contract with this client. Secrets must not be embedded in cloud-init user_data or Terraform state.
