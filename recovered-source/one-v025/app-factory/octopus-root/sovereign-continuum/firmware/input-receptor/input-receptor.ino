/*
 NATHAN AI: INPUT RECEPTOR / electronic mock input and LED only.
 Designed for an 8-bit 5V control board with the board's standard I2C library.
 Wire two-board serial data through a rated 5V↔3.3V level shifter.
 Never connect to a person, external relay, coil, stimulator or high-power load.
*/
#include <Wire.h>
const uint8_t NODE_ADDRESS = 0x12;
const uint8_t ANALOG_PIN = A0;
const uint8_t LED_PIN = 9;
volatile uint16_t sensed = 512;
volatile uint16_t outputCode = 0;
volatile bool gotCode = false;
void transmitInput() {
  const uint16_t v = sensed;
  Wire.write((uint8_t)(v >> 8));
  Wire.write((uint8_t)(v & 0xff));
}
void receiveOutput(int size) {
  if (size == 3 && Wire.available() >= 3) {
    const int op = Wire.read();
    const uint16_t hi = (uint8_t)Wire.read();
    const uint16_t lo = (uint8_t)Wire.read();
    if (op == 'D') { outputCode = (hi << 8) | lo; gotCode = true; }
  }
  while (Wire.available()) (void)Wire.read();
}
void setup() {
  pinMode(LED_PIN, OUTPUT);
  analogWrite(LED_PIN, 0);
  Wire.begin(NODE_ADDRESS);
  Wire.onRequest(transmitInput);
  Wire.onReceive(receiveOutput);
  Serial.begin(115200);
  Serial.println(F("MIDDLE C INPUT RECEPTOR READY — NO BODY CONNECTION"));
}
void loop() {
  const uint16_t sample = (uint16_t)analogRead(ANALOG_PIN);
  noInterrupts();
  sensed = sample;
  const bool updated = gotCode;
  const uint16_t code = outputCode;
  gotCode = false;
  interrupts();
  if (updated) analogWrite(LED_PIN, (uint8_t)(code >> 8));
  delay(10);
}
