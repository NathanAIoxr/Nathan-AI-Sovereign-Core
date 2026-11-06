/*
 NATHAN AI: THE MIDDLE C / computational reference processor.
 Only reads a potentiometer from the INPUT RECEPTOR and returns a synthetic LED code.
 Firmware uses a board-provided I2C library and a 3.3V compute node.
 NEVER wire directly to 5V data pins: fit a suitable bidirectional level shifter.
*/
#include <Wire.h>
#include <math.h>
const uint8_t INPUT_RECEPTOR_ADDRESS = 0x12;
const uint32_t SAMPLE_DELAY_MS = 30;
uint16_t lastSample = 512;
uint16_t syntheticCode(uint16_t sample) {
  const double delta = (static_cast<double>(sample) - 512.0) / 180.0;
  const double y = exp(-0.5 * delta * delta);
  return static_cast<uint16_t>(lround(65535.0 * y));
}
void setup() {
  Serial.begin(115200);
  Wire.begin();
  Serial.println("MIDDLE C ENGINE ONLINE: SENSOR IN -> SYNTHETIC LED OUT");
}
void loop() {
  if (Wire.requestFrom(INPUT_RECEPTOR_ADDRESS, (uint8_t)2) == 2) {
    const uint16_t hi = (uint8_t)Wire.read();
    const uint16_t lo = (uint8_t)Wire.read();
    lastSample = (hi << 8) | lo;
    if (lastSample > 1023) lastSample = 1023;
    const uint16_t out = syntheticCode(lastSample);
    Wire.beginTransmission(INPUT_RECEPTOR_ADDRESS);
    Wire.write((uint8_t)'D');
    Wire.write((uint8_t)(out >> 8));
    Wire.write((uint8_t)(out & 0xFF));
    const uint8_t status = Wire.endTransmission();
    Serial.print("Raw: "); Serial.print(lastSample);
    Serial.print(" / LED code: "); Serial.print(out);
    Serial.print(" / Bus status: "); Serial.println(status);
  } else {
    while(Wire.available()) (void)Wire.read();
    Serial.println("NO INPUT RECEPTOR SIGNAL");
  }
  delay(SAMPLE_DELAY_MS);
}
