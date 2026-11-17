import hashlib
import hmac
from http.server import HTTPServer
import json
import secrets
import sqlite3
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from hub import (CAPABILITIES, SCOPES, ContractViolation, Hub, OAuthPKCE, Principal,
                 ambient_event, b64, canonical, local_summary, run_microapp)
from server import dispatch, make_handler
from agent_client import signed_headers
from connectors import PinnedLocalModel, import_local_records, local_vitals


def keypair():
    key = Ed25519PrivateKey.generate()
    return key, b64(key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw))


class HubContracts(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.now = [1_800_000_000]
        self.hub = Hub(self.db, b"s"*32, lambda: self.now[0])
        self.admin = Principal("owner-a", "owner", SCOPES, True)
        self.other = Principal("owner-b", "owner", SCOPES, True)
        self.private, self.public = keypair()
        self.hub.register(self.admin, "agent-a", self.public, ["context:read", "diagnostics:read", "sync:read"], ["notes"])
        self.hub.connector(self.admin, "notes")

    def tearDown(self): self.db.close()

    def authenticate(self, issued, nonce=None, body=b"", method="GET", path="/api/snapshot", timestamp=None):
        nonce = secrets.token_hex(16) if nonce is None else nonce
        timestamp = self.now[0] if timestamp is None else timestamp
        message = Hub.proof_message(issued["token"],method,path,body,timestamp,nonce)
        return self.hub.authenticate(issued["token"],method,path,body,timestamp,nonce,b64(self.private.sign(message)))

    def test_signed_identity_scope_resource_and_replay(self):
        issued = self.hub.issue(self.admin,"agent-a",["context:read", "sync:read"])
        principal = self.authenticate(issued,nonce="nonce-one")
        self.assertEqual(principal.owner,"owner-a")
        self.assertEqual(principal.resources,frozenset({"notes"}))
        with self.assertRaises(PermissionError): principal.need("context:write")
        with self.assertRaises(PermissionError): self.authenticate(issued,nonce="nonce-one")
        with self.assertRaises(PermissionError): self.hub.issue(self.admin,"agent-a",["commands:run"])
        self.hub.connector(self.admin,"ungranted")
        with self.assertRaises(PermissionError): self.hub.changes(principal,"ungranted")

    def test_token_revocation_expiry_and_body_binding(self):
        issued = self.hub.issue(self.admin,"agent-a",["context:read"],ttl=10)
        timestamp,nonce = self.now[0],"tamper-proof"
        signature = self.private.sign(Hub.proof_message(issued["token"],"POST","/api/context",b"original",timestamp,nonce))
        with self.assertRaises(PermissionError):
            self.hub.authenticate(issued["token"],"POST","/api/context",b"changed",timestamp,nonce,b64(signature))
        self.hub.revoke(self.admin,issued["jti"])
        with self.assertRaises(PermissionError): self.authenticate(issued)
        issued = self.hub.issue(self.admin,"agent-a",["context:read"],ttl=10)
        self.now[0]+=10
        with self.assertRaises(PermissionError): self.authenticate(issued)

    def test_context_owner_grants_expiry_versions(self):
        self.hub.put_context(self.admin,"diet",{"vegetarian":True},0,readers=["agent-a"],ttl=10)
        principal = self.authenticate(self.hub.issue(self.admin,"agent-a",["context:read"]))
        self.assertTrue(self.hub.get_context(principal,"diet")["value"]["vegetarian"])
        with self.assertRaises(KeyError): self.hub.get_context(self.other,"diet")
        self.hub.put_context(self.admin,"private",{"secret":"not shared"},0,readers=[])
        with self.assertRaises(PermissionError): self.hub.get_context(principal,"private")
        with self.assertRaises(ContractViolation): self.hub.put_context(self.admin,"diet",{},0,readers=[])
        self.now[0]+=10
        with self.assertRaises(KeyError): self.hub.get_context(principal,"diet")

    def test_sync_idempotency_conflicts_and_resolution(self):
        result = self.hub.sync(self.admin,"notes","one",{"text":"first"},0,"write-one")
        self.assertEqual(result,self.hub.sync(self.admin,"notes","one",{"text":"first"},0,"write-one"))
        with self.assertRaises(ContractViolation): self.hub.sync(self.admin,"notes","one",{},0,"write-one")
        conflict = self.hub.sync(self.admin,"notes","one",{"text":"offline edit"},0,"write-two")
        self.assertEqual(conflict["status"],"conflict")
        self.assertEqual(self.hub.snapshot(self.admin)["conflicts"],1)
        self.assertTrue(self.hub.resolve_conflict(self.admin,conflict["conflict"],"local")["resolved"])
        self.assertEqual(self.hub.snapshot(self.admin)["conflicts"],0)
        self.assertEqual(self.hub.changes(self.admin,"notes")["items"][-1]["value"],{"text":"offline edit"})
        self.assertTrue(self.hub.audit_valid())

    def test_cursor_high_watermark_and_owner_isolation(self):
        for number in range(3): self.hub.sync(self.admin,"notes",str(number),{"n":number},0,"key-"+str(number))
        page = self.hub.changes(self.admin,"notes",size=1)
        self.hub.sync(self.admin,"notes","later",{},0,"key-later")
        seen = page["items"][:]
        while page["next"] is not None:
            page = self.hub.changes(self.admin,"notes",after=page["next"],until=page["until"],size=1)
            seen.extend(page["items"])
        self.assertEqual(len(seen),3)
        self.hub.connector(self.other,"notes")
        self.assertEqual(self.hub.changes(self.other,"notes")["items"],[])

    def test_webhook_signature_timestamp_and_deduplication(self):
        secret,raw = b"w"*32,b'{"event":"new"}'
        signature = hmac.digest(secret,str(self.now[0]).encode()+b"."+raw,"sha256").hex()
        self.assertFalse(self.hub.webhook(self.admin,"notes","event-one",raw,self.now[0],signature,secret)["replayed"])
        self.assertTrue(self.hub.webhook(self.admin,"notes","event-one",raw,self.now[0],signature,secret)["replayed"])
        with self.assertRaises(PermissionError): self.hub.webhook(self.admin,"notes","event-two",b"changed",self.now[0],signature,secret)
        self.now[0]+=301
        with self.assertRaises(PermissionError): self.hub.webhook(self.admin,"notes","event-two",raw,self.now[0]-301,signature,secret)

    def test_diagnostics_commands_preserve_critical_faults(self):
        self.hub.fault(self.admin,"notes","BOUNDARY_EMPTY","warning","empty batch")
        self.hub.fault(self.admin,"notes","STATE_MISMATCH","critical","ledger disagrees")
        result = self.hub.command(self.admin,"notes","clear-warning-codes","clear-one")
        self.assertEqual(result["cleared"],["BOUNDARY_EMPTY"])
        self.assertEqual(result,self.hub.command(self.admin,"notes","clear-warning-codes","clear-one"))
        self.assertEqual(len(self.hub.snapshot(self.admin)["faults"]),1)
        with self.assertRaises(ContractViolation): self.hub.command(self.admin,"notes","run-shell","bad")
        with self.assertRaises(sqlite3.IntegrityError): self.db.execute("DELETE FROM hub_audit")
        self.db.rollback()

    def test_authenticity_issuer_and_artifact_claim(self):
        private,public = keypair()
        self.hub.add_issuer(self.admin,"trusted-device",public)
        claims = {"id":"capture-one","issuer":"trusted-device","subject":"member-one","kind":"capture-provenance","artifact_sha256":hashlib.sha256(b"image").hexdigest(),"expires":self.now[0]+100}
        signature = b64(private.sign(canonical(claims).encode()))
        self.assertTrue(self.hub.verify_attestation(self.admin,claims,signature)["signature_verified"])
        claims["artifact_sha256"] = "0"*64
        with self.assertRaises(PermissionError): self.hub.verify_attestation(self.admin,claims,signature)
        with self.assertRaises(PermissionError): self.hub.verify_attestation(self.other,claims,signature)

    def test_closed_community_invites(self):
        invite = self.hub.invite(self.admin)["invite"]
        self.assertEqual(self.hub.redeem(self.admin,invite,"person-one"),{"member":"person-one"})
        with self.assertRaises(PermissionError): self.hub.redeem(self.admin,invite,"person-two")
        with self.assertRaises(PermissionError): self.hub.redeem(self.other,invite,"person-three")

    def test_signed_payment_intent_and_authenticated_callback(self):
        intent = self.hub.payment_intent(self.admin,1000,"USD","https://checkout.example")["intent"]
        payload = {"intent":intent,"amount":1000,"currency":"USD","event":"pay-one"}
        secret = b"p"*32
        signature = hmac.digest(secret,str(self.now[0]).encode()+b"."+canonical(payload).encode(),"sha256").hex()
        with self.assertRaises(PermissionError): self.hub.confirm_payment(self.admin,payload,self.now[0],"bad",secret)
        self.assertEqual(self.hub.confirm_payment(self.admin,payload,self.now[0],signature,secret)["state"],"confirmed")
        self.assertTrue(self.hub.confirm_payment(self.admin,payload,self.now[0],signature,secret)["replayed"])
        with self.assertRaises(ContractViolation): self.hub.payment_intent(self.admin,1000,"JPY","https://checkout.example")
        with self.assertRaises(ContractViolation): self.hub.payment_intent(self.admin,1000,"USD","http://checkout.example")

    def test_microapps_edge_and_multimodal_consent(self):
        self.assertEqual(run_microapp(self.admin,{"kind":"split-budget","amount_minor":1000,"currency":"USD","buckets":3})["parts_minor"],[334,333,333])
        self.assertTrue(run_microapp(self.admin,{"kind":"room-fit","room_mm":[100,200,300],"object_mm":[100,100,100]})["fits_axis_aligned"])
        with self.assertRaises(ContractViolation): run_microapp(self.admin,{"kind":"execute-code","code":"bad"})
        self.assertFalse(local_summary("First. Second. Third.")["neural_model"])
        with self.assertRaises(PermissionError): ambient_event(self.admin,{"modality":"gaze","consent":False,"action":"next-step"})
        self.assertTrue(ambient_event(self.admin,{"modality":"touch","consent":True,"action":"show-health"})["accepted"])

    def test_oauth_pkce_single_use_and_redirect_binding(self):
        flow = OAuthPKCE(clock=lambda:self.now[0])
        start = flow.begin("http://127.0.0.1:8780/callback")
        verifier = flow.consume(start["state"],"http://127.0.0.1:8780/callback")
        self.assertEqual(start["code_challenge"],b64(hashlib.sha256(verifier.encode()).digest()))
        with self.assertRaises(PermissionError): flow.consume(start["state"],"http://127.0.0.1:8780/callback")
        start = flow.begin("https://example.test/callback")
        with self.assertRaises(PermissionError): flow.consume(start["state"],"https://attacker.test/callback")

    def test_unconfigured_external_connectors_fail_closed(self):
        self.hub.connector(self.admin,"calendar","oauth")
        with self.assertRaises(ContractViolation): self.hub.sync(self.admin,"calendar","one",{},0,"one")
        self.assertIn("provider required",CAPABILITIES["world_models"])

    def test_hub_booking_integration_and_owner_resource_isolation(self):
        token=dispatch(self.hub,self.admin,"/api/booking-fences",{"resource":"room"})["token"]
        body={"resource":"room","key":"booking-one","range":{"start":"2026-05-01","end":"2026-05-03"},"token":token}
        result=dispatch(self.hub,self.admin,"/api/bookings",body)
        self.assertEqual(result,dispatch(self.hub,self.admin,"/api/bookings",body))
        self.assertEqual(result["resource"],"room")
        self.assertNotEqual(self.hub.booking_resource(self.admin,"room","bookings:read"),self.hub.booking_resource(self.other,"room","bookings:read"))
        self.db.execute("UPDATE sb_projection SET value=99 WHERE id=1");self.db.commit()
        self.assertTrue(self.hub.snapshot(self.admin)["integrity"]["boundary_storage"])

    def test_local_bridge_model_pin_and_vitals(self):
        records=[{"id":"one","value":{"title":"Local"},"expected":0}]
        first=import_local_records(self.hub,self.admin,"notes",records,"batch-one")
        self.assertEqual(first,import_local_records(self.hub,self.admin,"notes",records,"batch-one"))
        with tempfile.TemporaryDirectory() as temp:
            model=Path(temp)/"model.onnx";model.write_bytes(b"not a model")
            with self.assertRaises(ContractViolation):PinnedLocalModel(model,"0"*64).infer({})
            self.assertGreaterEqual(local_vitals(Path(temp)/"hub.sqlite3")["storage_free_bytes"],0)

    def test_public_openapi_is_parseable_and_operations_unique(self):
        spec=json.loads(Path(__file__).with_name("openapi.json").read_text())
        operations=[operation["operationId"] for methods in spec["paths"].values() for operation in methods.values()]
        self.assertEqual(len(operations),len(set(operations)))
        self.assertEqual(spec["openapi"],"3.1.0")

    def test_export_and_otlp_owner_boundaries(self):
        self.hub.put_context(self.admin,"a",{"value":"owner-a"},0)
        self.hub.put_context(self.other,"b",{"value":"owner-b"},0)
        exported=self.hub.export_owner(self.admin)
        self.assertNotIn("owner-b",canonical(exported))
        self.assertEqual(exported["schema"],"one.sovereign-export.v1")
        telemetry=self.hub.telemetry(self.admin)
        self.assertEqual(telemetry["resourceMetrics"][0]["scopeMetrics"][0]["metrics"][0]["gauge"]["dataPoints"][0]["asInt"],"1")

    def test_mcp_routes_reuse_permissioned_core(self):
        result = dispatch(self.hub,self.admin,"/mcp",{"jsonrpc":"2.0","id":1,"method":"tools/list"})
        self.assertEqual(len(result["result"]["tools"]),3)
        result = dispatch(self.hub,self.admin,"/mcp",{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"microapp.run","arguments":{"spec":{"kind":"duration","start":1,"end":1}}}})
        self.assertEqual(json.loads(result["result"]["content"][0]["text"]),{"duration":0})


class HubHTTP(unittest.TestCase):
    def test_authenticated_runtime_and_public_metadata(self):
        ready,holder = threading.Event(),{}
        token = "owner-test-token-"+"x"*32
        def serve():
            with sqlite3.connect(":memory:") as db:
                hub = Hub(db,b"s"*32)
                server = HTTPServer(("127.0.0.1",0),make_handler(hub,token,"owner-a"))
                holder["server"] = server; ready.set()
                with server: server.serve_forever(poll_interval=.01)
        thread = threading.Thread(target=serve); thread.start()
        self.assertTrue(ready.wait(5))
        base = f"http://127.0.0.1:{holder['server'].server_port}"
        def request(path,body=None,authenticated=True):
            headers = {"Content-Type":"application/json"}
            if authenticated: headers["Authorization"]="Bearer "+token
            req = Request(base+path,data=canonical(body).encode() if body is not None else None,headers=headers)
            with urlopen(req,timeout=5) as response: return json.load(response)
        try:
            self.assertIn("capabilities",request("/api/catalog",authenticated=False))
            with self.assertRaises(HTTPError) as error: request("/api/snapshot",authenticated=False)
            self.assertEqual(error.exception.code,403); error.exception.close()
            request("/api/connectors",{"connector":"notes","mode":"local"})
            self.assertEqual(request("/api/snapshot")["connectors"][0]["id"],"notes")
            result = request("/api/sync",{"connector":"notes","record":"one","value":{"title":"Note"},"expected":0,"key":"sync-one"})
            self.assertEqual(result["status"],"applied")
            self.assertTrue(request("/api/audit-health")["valid"])
            private,public=keypair()
            request("/api/agents",{"agent":"reader","public_key":public,"scopes":["diagnostics:read"],"resources":["notes"]})
            issued=request("/api/tokens",{"agent":"reader","scopes":["diagnostics:read"],"ttl":60})
            headers=signed_headers(private,issued["token"],"GET","/api/snapshot",b"")
            signed=Request(base+"/api/snapshot",headers=headers)
            with urlopen(signed,timeout=5) as response:self.assertEqual(json.load(response)["owner"],"owner-a")
            with self.assertRaises(HTTPError) as error:urlopen(signed,timeout=5)
            self.assertEqual(error.exception.code,403);error.exception.close()
        finally:
            holder["server"].shutdown(); thread.join(timeout=5)
            self.assertFalse(thread.is_alive())


if __name__=="__main__": unittest.main()
