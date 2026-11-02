import importlib.util
import io
import json
import os
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

spec = importlib.util.spec_from_file_location('nathan_assistant_server', Path(__file__).with_name('server.py'))
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)

class AssistantTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {'NATHAN_MODEL_URL': '', 'NATHAN_MODEL_KEY': '', 'NATHAN_MODEL_NAME': ''})
        self.env.start()
        self.body = {'operation': 'draft-only', 'question': 'Explain source', 'sources': [{'id': 'one', 'title': 'Source', 'text': 'Literal source', 'stage': 'Draft'}]}

    def tearDown(self):
        self.env.stop()

    def test_config_and_validation(self):
        self.assertFalse(server.config()['ready'])
        with patch.dict(os.environ, {'NATHAN_MODEL_URL': 'http://example.invalid', 'NATHAN_MODEL_NAME': 'fixture', 'NATHAN_MODEL_KEY': 'not-a-real-credential'}):
            self.assertFalse(server.config()['ready'])
        self.assertEqual(server.validate(self.body)['sources'][0]['text'], 'Literal source')
        for change in [{'operation': 'transfer'}, {'sources': []}, {'question': ''}]:
            with self.assertRaises(ValueError):
                server.validate({**self.body, **change})
        with self.assertRaises(ValueError):
            server.validate({**self.body, 'question': 'password: example-test-value'})

    def test_model_adapter_uses_only_known_citations_and_forbids_redirects(self):
        parsed = server.validate(self.body)
        reply = json.dumps({'choices': [{'message': {'content': json.dumps({'answer': 'Draft', 'citations': ['one']})}}]}).encode()
        class Response(io.BytesIO):
            pass
        class Opener:
            def open(self, request, timeout):
                self.request = request
                return Response(reply)
        opener = Opener()
        with patch.object(server.urllib.request, 'build_opener', return_value=opener) as build:
            result = server.model_reply(parsed, {'url': 'https://example.invalid/v1/chat/completions', 'model': 'fixture', 'key': 'not-a-real-credential'})
            self.assertEqual(result['mode'], 'model')
            self.assertEqual(build.call_args.args[0].redirect_request(None, None, 302, '', {}, 'https://elsewhere.invalid'), None)
            payload = json.loads(opener.request.data)
            self.assertNotIn('tools', payload)
            self.assertIn('untrusted data', payload['messages'][0]['content'])
        reply = json.dumps({'choices': [{'message': {'content': json.dumps({'answer': 'Bad citation', 'citations': ['invented']})}}]}).encode()
        with patch.object(server.urllib.request, 'build_opener', return_value=opener):
            with self.assertRaises(ValueError):
                server.model_reply(parsed, {'url': 'https://example.invalid', 'model': 'fixture', 'key': 'not-a-real-credential'})

    def test_loopback_api_and_static_boundary(self):
        httpd = server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        url = 'http://127.0.0.1:' + str(httpd.server_port)
        def call(path, data=None, headers=None):
            req = urllib.request.Request(url + path, data=data, headers=headers or {})
            try:
                with urllib.request.urlopen(req, timeout=5) as response:
                    return response.status, response.read()
            except urllib.error.HTTPError as error:
                return error.code, error.read()
        try:
            code, raw = call('/api/nathan/status')
            self.assertEqual(code, 200)
            self.assertEqual(json.loads(raw), {'mode': 'local-development', 'modelConfigured': False, 'toolsEnabled': False})
            self.assertEqual(call('/.git/config')[0], 404)
            self.assertEqual(call('/app-factory/nathan-ai/assistant/server.py')[0], 404)
            self.assertEqual(call('/app-factory/nathan-ai/assistant/')[0], 200)
            self.assertEqual(call('/app-factory/nathan-ai/games/atlas.mjs')[0], 200)
            self.assertEqual(call('/api/nathan/status', headers={'Host': 'untrusted.invalid'})[0], 403)
            self.assertEqual(call('/api/nathan/draft', json.dumps(self.body).encode(), {'Content-Type': 'application/json', 'Origin': 'https://untrusted.invalid'})[0], 403)
            self.assertEqual(call('/api/nathan/draft', json.dumps(self.body).encode(), {'Content-Type': 'application/json'})[0], 503)
            self.assertEqual(call('/api/nathan/draft', b'{}', {'Content-Type': 'application/json'})[0], 400)
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join()

if __name__ == '__main__':
    unittest.main()
