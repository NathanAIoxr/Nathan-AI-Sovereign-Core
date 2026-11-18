# Tabor World physical-host compute server

A containerized HTTP compute service for an actual authorized server or Cloudflare Containers (subject to account support and billing). This does not create physical hardware or deliver exaflop performance.

## Build and run
`docker build -t tabor-compute-server .`
`docker run --rm -p 127.0.0.1:8080:8080 -e TABOR_SERVER_TOKEN="<secure secret>" tabor-compute-server`

Health: `GET /health`.
Authenticated bounded computation: `POST /compute/sha256` with JSON `{"seed":"tabor","iterations":1000}`.
Use a reverse proxy or private network, TLS and secret management before public exposure. Never commit tokens.

## Connect to Nathan AI
Run this container on a provisioned CPU/GPU host. Configure the existing Tabor fleet heartbeat agent separately with the fleet Worker URL and secret; it will register the machine in D1. The True Cloud Computing control plane reads the same D1 fleet registry. A future authenticated dispatcher can route bounded jobs to the node.

Cloudflare Workers run on provider-owned physical hardware but are not customer-owned physical servers. The Dockerfile is deployable infrastructure code, not evidence that a machine or Cloudflare Container instance was provisioned.
