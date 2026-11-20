#!/usr/bin/env bash
set -euo pipefail

bitcoin_bin=${BITCOIN_BIN:-}
[[ -n "$bitcoin_bin" && -x "$bitcoin_bin/bitcoind" && -x "$bitcoin_bin/bitcoin-cli" ]] || {
  echo 'Set BITCOIN_BIN to the verified Bitcoin Core bin directory.' >&2
  exit 2
}
data=$(mktemp -d)
port=${REGTEST_RPC_PORT:-18443}
cli=("$bitcoin_bin/bitcoin-cli" -regtest "-datadir=$data" "-rpcport=$port")
cleanup() {
  "${cli[@]}" stop >/dev/null 2>&1 || true
  kill "$pid" 2>/dev/null || true
  wait "$pid" || true
  rm -rf -- "$data"
}
"$bitcoin_bin/bitcoind" -regtest "-datadir=$data" "-rpcport=$port" -server -networkactive=0 -listen=0 -dnsseed=0 -printtoconsole=0 &
pid=$!
trap cleanup EXIT
"${cli[@]}" -rpcwait -rpcwaittimeout=20 getblockchaininfo >/dev/null
"${cli[@]}" createwallet golden-goose-regtest >/dev/null
address=$("${cli[@]}" -rpcwallet=golden-goose-regtest getnewaddress)
"${cli[@]}" generatetoaddress 101 "$address" >/dev/null
"${cli[@]}" getblockchaininfo | jq '{chain, blocks, bestblockhash}'
"${cli[@]}" -rpcwallet=golden-goose-regtest getbalances | jq '{spendable_regtest_btc: .mine.trusted, immature_regtest_btc: .mine.immature}'
