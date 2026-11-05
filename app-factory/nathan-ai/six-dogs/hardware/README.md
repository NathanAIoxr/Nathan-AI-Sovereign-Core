# Six Dogs Physical Console — Build Specification

This is an **optional low-voltage, user-operated indicator**, not a physiological sensor, diagnostic device, surveillance product, or medical stress treatment. Example firmware has been written but **not compiled or flashed on real hardware in this release**.

## Hardware baseline: Arduino Uno-compatible 5 V board

- 1 USB-powered Arduino Uno-compatible microcontroller with USB serial support
- 6 low-voltage LEDs, each with its **own 220–330 Ω current-limiting resistor**
- 1 momentary normally-open push button
- Breadboard and insulated jumper wires, suitable USB data cable
- **No** mains power, exposed high voltage, cameras, microphones, biometric electrodes, wireless tracking, children’s profiles, or external cloud services

### Wiring table

| Dog | Pin | Physical indicator |
|---|---|---|
| 1. KNICK | D3 | LED 1 |
| 2. KNACK | D4 | LED 2 |
| 3. PADDY | D5 | LED 3 |
| 4. WHACK | D6 | LED 4 |
| 5. DOG | D7 | LED 5 |
| 6. BONE | D8 | LED 6 |

For each LED, connect its corresponding Uno output through a **220–330 Ω series resistor** to LED anode (+); cathode (−) goes to board GND. Connect a momentary button from D2 to GND. Firmware enables the internal INPUT_PULLUP. Do not connect a bare LED without its resistor.

Connect board USB to a trusted, user-selected computer. Never wire this device to mains equipment or medical systems.

## Physical interactions

- At power-on, LED 1 (KNICK) is on; the other five are off.
- A debounced short button press advances to the next named step, wrapping BONE → KNICK.
- A long press (≥ 1500 ms before release) resets to KNICK.
- Current step is printed over USB serial; this device does **not** infer what anyone feels.

## Serial protocol version 1

Use **115200 baud**, 8N1, ASCII, LF-terminated commands. Browser sends a command only after explicit user action and browser permission.

Commands accepted by firmware:

    SD1 STEP 1
    SD1 STEP 2
    SD1 STEP 3
    SD1 STEP 4
    SD1 STEP 5
    SD1 STEP 6
    SD1 RESET
    SD1 QUERY

Examples of firmware responses:

    SD1 STATUS STEP=1 NAME=KNICK
    SD1 STATUS STEP=6 NAME=BONE
    SD1 ERROR INVALID_COMMAND

The browser console may send current selected step through Web Serial, where available over a secure origin and explicitly approved by the user. Browser-side writing is implemented; parsing and independently verifying a physical status response is not. Use the direct LED status and a serial monitor for confirmation.

## Development / limitations

- Firmware source: six_dogs_uno/six_dogs_uno.ino
- Arduino IDE: select compatible Uno board and port, compile/upload on a trusted machine.
- The board requires a manual user installation and wiring; neither the board nor the app is automatically deployed by GitHub.
- Electrical behavior, device interoperability, access policy, enclosure design, EMC, durability, and accessibility have **not** been independently validated.
- **WHACK** is a decisive **nonviolent** step name. Do not build striking, shock, restraint or coercive mechanisms into this controller.
