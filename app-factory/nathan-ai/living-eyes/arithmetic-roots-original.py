# =====================================================================
# 1. ANCIENT EGYPTIAN MULTIPLICATION (c. 1650 BCE — Rhind Papyrus)
# Formula: Decompose multiplier into powers of 2 via repeated doubling
# =====================================================================
def egyptian_multiply(a, b):
    result = 0
    power_of_two = 1
    doubled_a = a
    
    while power_of_two <= b:
        # Check if this power of 2 is part of b (bitwise AND)
        if b & power_of_two:
            result += doubled_a
        power_of_two <<= 1   # Double the power of 2 (1, 2, 4, 8...)
        doubled_a <<= 1      # Double the multiplicand
    return result


# =====================================================================
# 2. PINGALA'S CHANDAHSHASTRA (c. 2nd Century BCE)
# Formula: Nashta (index -> syllable pattern) & Uddishta (pattern -> index)
# Uses 0 = Guru (heavy/long) and 1 = Laghu (light/short)
# =====================================================================
def pingala_nashta(index, length):
    """Converts a 1-based meter index into a binary syllable pattern."""
    n = index
    pattern = []
    for _ in range(length):
        if n % 2 == 1:
            pattern.append(0)  # Odd -> Guru (0)
            n = (n + 1) // 2
        else:
            pattern.append(1)  # Even -> Laghu (1)
            n = n // 2
    return "".join(map(str, pattern))

def pingala_uddishta(pattern):
    """Converts a binary syllable string back to its 1-based meter index."""
    index = 1
    for bit in reversed(pattern):
        index *= 2
        if bit == '0':  # Guru subtracts 1
            index -= 1
    return index


# =====================================================================
# 3. FRANCIS BACON'S BILATERAL CIPHER (1605 / 1623)
# Formula: 5-bit binary encoding using 'a' (0) and 'b' (1)
# =====================================================================
def bacon_encode(text):
    # Classic 24-letter Elizabethan alphabet (I/J and U/V share codes)
    alphabet = "ABCDEFGHIKLMNOPQRSTUWXYZ"
    mapping = {
        char: "".join('b' if (idx >> (4 - bit)) & 1 else 'a' for bit in range(5))
        for idx, char in enumerate(alphabet)
    }
    cleaned = text.upper().replace('J', 'I').replace('V', 'U')
    return " ".join(mapping[c] for c in cleaned if c in mapping)


# =====================================================================
# 4. JOHN NAPIER'S LOCATION ARITHMETIC (1617 — Rabdologiae)
# Formula: Represent numbers as letters for powers of 2 (a=1, b=2, c=4...)
# =====================================================================
def to_napier(n):
    """Converts integer to Napier's additive power-of-2 letters."""
    letters = []
    bit = 0
    while (1 << bit) <= n:
        if n & (1 << bit):
            letters.append(chr(ord('a') + bit))
        bit += 1
    return "".join(letters)

def from_napier(code):
    """Converts Napier's location string back to decimal."""
    return sum(1 << (ord(ch) - ord('a')) for ch in code.lower())

def napier_multiply(code1, code2):
    """Multiplies two Napier strings by adding letter exponents (a=0, b=1...)."""
    total = 0
    for c1 in code1.lower():
        for c2 in code2.lower():
            exp1 = ord(c1) - ord('a')
            exp2 = ord(c2) - ord('a')
            total += 1 << (exp1 + exp2)
    return to_napier(total)


# =====================================================================
# 5. GOTTFRIED WILHELM LEIBNIZ'S DYADIC ARITHMETIC (1679 / 1703)
# Formula: Pure base-2 positional expansion & carry-bit addition
# =====================================================================
def leibniz_to_binary(n):
    """Decomposes integer n into powers of 2 (Right-to-Left)."""
    if n == 0:
        return "0"
    bits = []
    while n > 0:
        bits.append(str(n % 2))
        n //= 2
    return "".join(reversed(bits))

def leibniz_add(bin_a, bin_b):
    """Leibniz's binary addition table: 0+0=0, 0+1=1, 1+1=10."""
    max_len = max(len(bin_a), len(bin_b))
    a = bin_a.zfill(max_len)
    b = bin_b.zfill(max_len)
    carry = 0
    result = []

    for i in range(max_len - 1, -1, -1):
        bit_sum = int(a[i]) + int(b[i]) + carry
        result.append(str(bit_sum % 2))
        carry = bit_sum // 2

    if carry:
        result.append("1")
    return "".join(reversed(result))


# =====================================================================
# 6. GEORGE BOOLE'S ALGEBRA OF LOGIC (1847 / 1854)
# Formula: Arithmetic equations over {0, 1} representing truth values
# Boole used: NOT(x) = 1 - x, AND(x, y) = x * y, OR(x, y) = x + y - x*y
# =====================================================================
def boole_not(x):
    return 1 - x

def boole_and(x, y):
    return x * y

def boole_or(x, y):
    return x + y - (x * y)

def boole_xor(x, y):
    return x + y - (2 * x * y)


# =====================================================================
# VERIFICATION RUN
# =====================================================================
if __name__ == "__main__":
    print("1. Egyptian (13 * 12):", egyptian_multiply(13, 12))
    p_code = pingala_nashta(index=5, length=4)
    print(f"2. Pingala (Index 5, len 4): {p_code} -> Back to Index: {pingala_uddishta(p_code)}")
    print("3. Bacon Cipher ('CODE'):", bacon_encode("CODE"))
    n1, n2 = to_napier(13), to_napier(5)  # acd (1+4+8), ac (1+4)
    prod = napier_multiply(n1, n2)
    print(f"4. Napier ({n1} * {n2}): {prod} = {from_napier(prod)}")
    b1, b2 = leibniz_to_binary(13), leibniz_to_binary(19)
    print(f"5. Leibniz ({b1} + {b2}): {leibniz_add(b1, b2)} (Decimal: {int(leibniz_add(b1, b2), 2)})")
    print("6. Boole XOR(1, 0) via arithmetic:", boole_xor(1, 0))
