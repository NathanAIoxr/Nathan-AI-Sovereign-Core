"""Optional encrypted local file adapter for user-approved embedding vectors.

AES-256-GCM authenticated encryption. Keys are provided by the user at runtime,
never derived from a public constant, committed or printed.
This is filesystem encryption, NOT a hardware secure enclave/on-chip vault.
Requires the separately declared cryptography Python package.
"""
from __future__ import annotations

import base64
import hashlib
import json
import math
import os
from pathlib import Path
import re
import tempfile
from typing import Sequence

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

CONTEXT_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$")
DELETE_CONFIRMATION = "DELETE_MY_VECTOR"
MAX_VECTOR_ITEMS = 8192
FORMAT = "nathan-six-dogs.encrypted-vector.v1"


class EncryptedVectorStore:
    """Private local filesystem storage; no network and no key persistence."""

    def __init__(self, directory: str | Path, key: bytes):
        if not isinstance(key, bytes) or len(key) != 32:
            raise ValueError("A user-supplied 32-byte AES-256 key is required")
        self._key = key
        self._cipher = AESGCM(key)
        self.directory = Path(directory)
        if self.directory.is_symlink():
            raise ValueError("Symlinked vector store directory not allowed")
        self.directory.mkdir(mode=0o700, parents=True, exist_ok=True)
        if self.directory.is_symlink() or not self.directory.is_dir():
            raise ValueError("Invalid vector store directory")
        if os.name == "posix":
            os.chmod(self.directory, 0o700)

    @classmethod
    def from_key_file(cls, directory: str | Path, key_path: str | Path):
        """Read a raw 32-byte key mounted by the user (e.g. Docker secret)."""
        return cls(directory, Path(key_path).read_bytes())

    @staticmethod
    def _validate_context(context_key: str) -> None:
        if not isinstance(context_key, str) or not CONTEXT_PATTERN.fullmatch(context_key):
            raise ValueError("Invalid context key")

    def _path(self, context_key: str) -> Path:
        self._validate_context(context_key)
        filename = hashlib.sha256(context_key.encode("utf-8")).hexdigest() + ".nvec"
        return self.directory / filename

    @staticmethod
    def _vector(numbers: Sequence[float]) -> list[float]:
        if not isinstance(numbers, (list, tuple)) or len(numbers) > MAX_VECTOR_ITEMS:
            raise ValueError("Expected bounded vector list")
        converted = []
        for v in numbers:
            if isinstance(v, bool) or not isinstance(v, (int, float)):
                raise TypeError("Vector elements must be numeric")
            f = float(v)
            if not math.isfinite(f):
                raise ValueError("Vector contains nonfinite value")
            converted.append(f)
        return converted

    def save(self, context_key: str, vector: Sequence[float]) -> Path:
        """Encrypt with a fresh nonce, atomically replace the owned local file."""
        path = self._path(context_key)
        values = self._vector(vector)
        plaintext = json.dumps(
            {"format": FORMAT, "values": values},
            separators=(",", ":"), allow_nan=False,
        ).encode("utf-8")
        nonce = os.urandom(12)
        aad = (FORMAT + ":" + context_key).encode("utf-8")
        ciphertext = self._cipher.encrypt(nonce, plaintext, aad)
        envelope = {
            "format": FORMAT,
            "nonce": base64.b64encode(nonce).decode("ascii"),
            "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
        }
        encoded = json.dumps(envelope, separators=(",", ":")).encode("utf-8")
        fd, tmp_name = tempfile.mkstemp(prefix=".write-", dir=self.directory)
        try:
            with os.fdopen(fd, "wb") as stream:
                stream.write(encoded)
                stream.flush()
                os.fsync(stream.fileno())
            if os.name == "posix":
                os.chmod(tmp_name, 0o600)
            os.replace(tmp_name, path)
            if os.name == "posix":
                os.chmod(path, 0o600)
        finally:
            if os.path.exists(tmp_name):
                os.unlink(tmp_name)
        return path

    def load(self, context_key: str) -> list[float]:
        path = self._path(context_key)
        if not path.is_file() or path.is_symlink():
            raise FileNotFoundError("Encrypted context was not found")
        if path.stat().st_size > 2_000_000:
            raise ValueError("Encrypted context exceeds limit")
        envelope = json.loads(path.read_text(encoding="utf-8"))
        if envelope.get("format") != FORMAT:
            raise ValueError("Unsupported encrypted vector format")
        nonce = base64.b64decode(envelope["nonce"], validate=True)
        ciphertext = base64.b64decode(envelope["ciphertext"], validate=True)
        if len(nonce) != 12:
            raise ValueError("Invalid AES-GCM nonce")
        aad = (FORMAT + ":" + context_key).encode("utf-8")
        plaintext = self._cipher.decrypt(nonce, ciphertext, aad)
        doc = json.loads(plaintext.decode("utf-8"))
        if doc.get("format") != FORMAT:
            raise ValueError("Invalid decrypted vector format")
        return self._vector(doc["values"])

    def delete(self, context_key: str, confirmation: str) -> bool:
        """Delete ciphertext only after explicit confirmation.

        File deletion is not a secure erase of SSD blocks or backups.
        """
        if confirmation != DELETE_CONFIRMATION:
            raise PermissionError("Explicit DELETE_MY_VECTOR confirmation required")
        path = self._path(context_key)
        if path.is_symlink():
            raise ValueError("Symlinked context file not allowed")
        if not path.is_file():
            return False
        path.unlink()
        return True
