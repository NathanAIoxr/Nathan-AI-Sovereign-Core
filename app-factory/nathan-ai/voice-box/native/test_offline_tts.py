import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock
from offline_tts import synthesize

class VoiceCLI(unittest.TestCase):
    def test_requires_own_text_and_known_voice_label(self):
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)/'new.wav'
            with self.assertRaises(ValueError):synthesize('', 'en',p,binary='mock')
            with self.assertRaises(ValueError):synthesize('hello',';touch /tmp/x',p,binary='mock')
            with self.assertRaises(ValueError):synthesize('A'*16385,'en',p,binary='mock')
    def test_does_not_overwrite_existing_original(self):
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)/'original.wav';p.write_bytes(b'ORIGINAL')
            with self.assertRaises(FileExistsError):synthesize('hello','en',p,binary='mock')
            self.assertEqual(p.read_bytes(),b'ORIGINAL')
    def test_no_shell_and_text_stays_stdin(self):
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)/'new.wav'
            def fake(command,**kwargs):
                self.assertEqual(command[:3],['espeak-ng','-v','en'])
                self.assertEqual(command[-1],'--stdin')
                self.assertNotIn('secret-words',command)
                self.assertEqual(kwargs.get('input'),'secret-words')
                p.write_bytes(b'RIFF'+b'\0'*44)
            with mock.patch('offline_tts.subprocess.run',side_effect=fake):
                result=synthesize('secret-words','en',p,binary='espeak-ng')
                self.assertEqual(result,p)
if __name__=='__main__':unittest.main()
