# NATHAN AI — MIDDLE C LOW-VOLTAGE BENCH

These two sample sketches are re-authored from the earlier electronic emulation prototype using **original subsystem labels**. They only modulate an LED in response to a manually rotated potentiometer.

## System

- **INPUT RECEPTOR:** 5 V, 8-bit-class control board, analogue pin A0, PWM output pin D9 and its hardware SDA/SCL pins.
- **MIDDLE C ENGINE:** 3.3 V computation board with compatible default SDA/SCL pins.
- **Bridge:** bidirectional I2C level shifter with pull-ups to the correct supply rails.
- **Input:** 10k potentiometer, outer terminals to 5 V and common ground, wiper to A0. No body leads.
- **Output:** resistor-limited indicator LED (e.g. D9 → 330 ohms → LED → ground). No other driven loads.
- **Firmware address:** 0x12; input reply two bytes (big-endian 10-bit sample); output packet 'D' plus two big-endian code bytes.
- **Serial diagnostics:** 115200 baud.

Actual board pin assignments differ by model: **consult the chosen board pinout before wiring.** Never short an output to supply. Power via suitable low-voltage USB or regulated supplies; verify the logic shifter and reference grounds in the full board documentation. No manufacturer board product or IC has been falsely renamed in a wiring specification.

## Status

Source code examples only. Board-specific compilation, oscilloscope checks, and physical assembly **have not been verified**. No analog conversion chip is required; the source lab's optional meter-only output stage has been deliberately isolated from this minimal demonstration. Do not interface this system with humans, animals, medical electronics, offensive electromagnetic circuits, external relays, plasma hardware or flight controls.

## Rights and interoperability

The subsystem titles are original but real board architecture still determines compatible libraries and electrical limits. Retain original library licenses when incorporating third-party software.
