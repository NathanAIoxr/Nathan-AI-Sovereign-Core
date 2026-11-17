const text = new TextEncoder();
const decode = new TextDecoder("utf-8", {fatal: true});
const aad = text.encode("Tabor Hive v.9 Z-101");
const iterations = 600_000;
const maxNotes = 50;
const maxNoteLength = 2000;
const bytesToBase64 = bytes => btoa(String.fromCharCode(...bytes));
const fromBase64 = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

async function keyFor(passphrase, salt) {
  if (typeof passphrase !== "string" || passphrase.length < 12 || passphrase.length > 256) {
    throw new RangeError("Use a vault passphrase of 12–256 characters.");
  }
  const source = await crypto.subtle.importKey("raw", text.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name: "PBKDF2", hash: "SHA-256", salt, iterations},
    source, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
}

export async function openVault(encoded, passphrase) {
  if (!encoded) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return {key: await keyFor(passphrase, salt), salt, notes: []};
  }
  const sealed = JSON.parse(encoded);
  if (sealed.version !== 1 || encoded.length > 565000) throw new Error("Unsupported Z-101 record.");
  const salt = fromBase64(sealed.salt), iv = fromBase64(sealed.iv);
  if (salt.length !== 16 || iv.length !== 12) throw new Error("Invalid Z-101 record.");
  const key = await keyFor(passphrase, salt);
  const plaintext = await crypto.subtle.decrypt({name: "AES-GCM", iv, additionalData: aad}, key, fromBase64(sealed.ciphertext));
  const notes = JSON.parse(decode.decode(plaintext));
  if (!Array.isArray(notes) || notes.length > maxNotes || notes.some(note =>
    typeof note?.id !== "string" || typeof note.text !== "string" || note.text.length > maxNoteLength ||
    !Number.isInteger(note.module) || note.module < 1 || note.module > 101 || typeof note.at !== "string"
  )) throw new Error("Invalid Z-101 notes.");
  return {key, salt, notes};
}

export async function sealVault(vault, notes) {
  if (notes.length > maxNotes) throw new RangeError("Z-101 holds 50 notes. Remove an existing note before adding another.");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({name: "AES-GCM", iv, additionalData: aad},
    vault.key, text.encode(JSON.stringify(notes)));
  // Encode in chunks so the browser's argument limit is independent of vault size.
  const bytes = new Uint8Array(ciphertext);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return JSON.stringify({version: 1, salt: bytesToBase64(vault.salt), iv: bytesToBase64(iv), ciphertext: btoa(binary)});
}

export function createMemoryBee(storage) {
  const storageKey = "tabor-hive:z-101:v1";
  let vault, readVersion, busy = false;
  return {
    get unlocked() { return Boolean(vault); },
    async unlock(passphrase) {
      if (busy) throw new Error("Z-101 is busy.");
      busy = true;
      try {
        const encoded = storage.getItem(storageKey);
        const next = await openVault(encoded, passphrase);
        vault = next;
        readVersion = encoded;
      } finally { busy = false; }
    },
    lock() {
      if (busy) throw new Error("Z-101 is busy.");
      vault = undefined;
      readVersion = undefined;
    },
    read() {
      if (!vault) throw new Error("Unlock Z-101 first.");
      return structuredClone(vault.notes);
    },
    async write({consent, module, note, remove}) {
      if (!vault || consent !== true) throw new Error("Z-101 requires an unlocked vault and explicit Hive permission.");
      if (busy) throw new Error("Z-101 is busy.");
      if (remove === undefined && (typeof note !== "string" || !note.trim() || note.length > maxNoteLength)) {
        throw new RangeError("Write a note of 1–2,000 characters.");
      }
      busy = true;
      const store = async () => {
        if (storage.getItem(storageKey) !== readVersion) throw new Error("Z-101 changed in another tab. Lock and reopen it.");
        const notes = remove === undefined
          ? [...vault.notes, {id: crypto.randomUUID(), module, text: note, at: new Date().toISOString()}]
          : vault.notes.filter(entry => entry.id !== remove);
        const sealed = await sealVault(vault, notes);
        if (storage.getItem(storageKey) !== readVersion) throw new Error("Z-101 changed in another tab. Lock and reopen it.");
        storage.setItem(storageKey, sealed);
        readVersion = sealed;
        vault.notes = notes;
      };
      try {
        if (globalThis.navigator?.locks) await navigator.locks.request(storageKey, store);
        else await store();
        return this.read();
      } finally { busy = false; }
    },
  };
}
