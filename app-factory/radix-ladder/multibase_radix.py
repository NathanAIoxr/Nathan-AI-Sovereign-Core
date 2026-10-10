"""TABOR Golden Ladder shared backend radix codec, Python 3.10+.
Mathematics and connector authorization are deliberately separate.
"""
from __future__ import annotations

SYMBOLS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*"
RADIXES = (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 17, 21, 33, 69)
UNARY_MAX = 10000

class RadixError(ValueError):
    pass

def alphabet(base: int) -> str:
    if type(base) is not int or not 1 <= base <= 69:
        raise RadixError("Base 0 is an offline connector state; valid numeric radixes are 1–69")
    return "0123456789↊↋" if base == 12 else SYMBOLS[:base]

def encode(value: int, base: int) -> str:
    chars = alphabet(base)
    if type(value) is not int:
        raise TypeError("An exact integer is required")
    negative = value < 0
    value = abs(value)
    if base == 1:
        if value > UNARY_MAX:
            raise RadixError("Unary maximum is 10000 marks")
        return ("-" if negative else "") + ("1" * value or "0")
    if value == 0:
        return "0"
    out = []
    while value:
        value, rem = divmod(value, base)
        out.append(chars[rem])
    return ("-" if negative else "") + "".join(reversed(out))

def decode(value: str, base: int) -> int:
    chars = alphabet(base)
    if not isinstance(value, str) or not value:
        raise RadixError("Nonempty encoded text required")
    negative = value.startswith("-")
    text = value[1:] if negative else value
    if not text:
        raise RadixError("No digits")
    if base == 1:
        if text == "0":
            return 0
        if len(text) > UNARY_MAX or any(c != "1" for c in text):
            raise RadixError("Invalid unary representation")
        return -len(text) if negative else len(text)
    if text == "0":
        return 0
    number = 0
    for char in text:
        try:
            digit = chars.index(char)
        except ValueError as exc:
            raise RadixError(f"Invalid digit {char!r} in Base {base}") from exc
        number = number * base + digit
    return -number if negative else number

def convert(value: str, from_base: int, to_base: int) -> str:
    return encode(decode(value, from_base), to_base)

def table(value: int) -> dict[int, str]:
    return {base: encode(value, base) for base in RADIXES}

def connector_gate(connected: bool, authenticated: bool, authorized: bool) -> dict:
    # This model describes authorization requirements but is NOT a network security perimeter.
    allowed = all((connected, authenticated, authorized))
    return {"can_send": allowed, "state": "CONNECTED" if connected else "BASE_0_DISCONNECTED",
            "warning": "Trusted backend must enforce auth and egress; no network action performed."}

if __name__ == "__main__":
    for base, representation in table(33).items():
        print(f"Base {base:02}: {representation}")
