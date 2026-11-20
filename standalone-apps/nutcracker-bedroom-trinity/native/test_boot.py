import pathlib
import sys
import unittest
from collections import deque

from unicorn import Uc, UC_ARCH_X86, UC_HOOK_INTR, UC_MODE_16
from unicorn.x86_const import (
    UC_X86_REG_AX, UC_X86_REG_BX, UC_X86_REG_CX, UC_X86_REG_DX,
    UC_X86_REG_EFLAGS, UC_X86_REG_ES,
)


IMAGE = pathlib.Path(sys.argv.pop(1)).read_bytes()


def boot(keys, fail_disk=False):
    cpu = Uc(UC_ARCH_X86, UC_MODE_16)
    cpu.mem_map(0, 2 * 1024 * 1024)
    cpu.mem_write(0x7C00, IMAGE[:512])
    keyboard = deque(keys)
    console = []

    def interrupt(machine, vector, _data):
        ax = machine.reg_read(UC_X86_REG_AX)
        if vector == 0x13:
            assert ax == 0x0204
            assert machine.reg_read(UC_X86_REG_CX) == 2
            assert machine.reg_read(UC_X86_REG_DX) == 0
            flags = machine.reg_read(UC_X86_REG_EFLAGS)
            machine.reg_write(UC_X86_REG_EFLAGS, (flags & ~1) | fail_disk)
            if not fail_disk:
                address = machine.reg_read(UC_X86_REG_ES) * 16 + machine.reg_read(UC_X86_REG_BX)
                machine.mem_write(address, IMAGE[512:2560])
        elif vector == 0x10:
            assert ax >> 8 == 0x0E
            console.append(chr(ax & 0xFF))
        elif vector == 0x12:
            machine.reg_write(UC_X86_REG_AX, 640)
        elif vector == 0x16:
            assert ax == 0 and keyboard
            machine.reg_write(UC_X86_REG_AX, ord(keyboard.popleft()))
        else:
            raise AssertionError(f"Unexpected BIOS interrupt {vector}")

    cpu.hook_add(UC_HOOK_INTR, interrupt)
    cpu.emu_start(0x7C00, 0x9000, count=20_000)
    assert not keyboard
    return "".join(console)


class NativeBoot(unittest.TestCase):
    def test_boot_and_commands(self):
        self.assertEqual(len(IMAGE), 1_474_560)
        self.assertEqual(IMAGE[510:512], bytes.fromhex("55aa"))
        screen = boot("fRAMKHQ")
        for message in [
            "Native BIOS monitor", "L L M A GI / LL MA GI / LL MAGI",
            "I G A M L L", "1+1=2 PASS", "1-1=0 PASS", "1*1=1 PASS", "1/1=1 PASS",
            "640 KiB", "Matthew 2:1-12 (KJV)", "System halted."
        ]:
            self.assertIn(message, screen)

    def test_disk_read_failure(self):
        self.assertIn("disk read failed", boot("", fail_disk=True))


if __name__ == "__main__":
    unittest.main()
