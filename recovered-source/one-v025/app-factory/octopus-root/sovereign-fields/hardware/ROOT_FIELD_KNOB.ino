/*
 THE SOVEREIGN FIELD LAB — ROOT FIELD KNOB
 Safe low-voltage demonstration for a 2560-class 8-bit controller.
 Optional 10k knob: ends to 5V and GND, wiper to A0.
 Built-in status light on D13 is the ONLY controlled output.

 NEVER attach electrodes, a person, inductive pulse devices, power switches,
 plasma equipment, machinery, or propulsion systems to this sketch.
 No sensor here reads neural activity. ADC values are counts, not microvolts.
*/
#include <math.h>
const unsigned char knobPin=A0;
const unsigned char lightPin=LED_BUILTIN;
const float boltzmann=1.380649e-23f;
const float temperature=310.15f;
const float lnTwo=0.69314718056f;
const float permeability=1.25663706e-6f;
const float epsilon=8.85418781e-12f;
const float charge=1.602176634e-19f;
const float electronMass=9.1093837e-31f;
float erasurePicoJ(float erasedBits){
  return erasedBits*boltzmann*temperature*lnTwo*1.0e12f;
}
float idealPinchA(float electronK,float ionK,float lineDensity){
  return sqrtf((8.0f*3.14159265f*lineDensity*boltzmann*(electronK+ionK))/permeability);
}
float plasmaHz(float electronDensity){
  return sqrtf((electronDensity*charge*charge)/(epsilon*electronMass))/(2.0f*3.14159265f);
}
void setup(){
  pinMode(knobPin,INPUT);
  pinMode(lightPin,OUTPUT);
  digitalWrite(lightPin,LOW);
  Serial.begin(115200);
  Serial.println(F("ROOT FIELD KNOB: no hardware pulses; simulated fields only"));
  Serial.println(F("adc,light,visible_cells,bit_floor_pJ,ideal_pinch_A,virtual_cutoff_Hz"));
}
void loop(){
  const int adc=analogRead(knobPin);
  const bool light=adc>800;
  digitalWrite(lightPin,light?HIGH:LOW);
  const unsigned int visible=16+(adc/8);
  const float erasures=light?1.0e10f:1.0e6f;
  Serial.print(adc);Serial.print(',');
  Serial.print(light?1:0);Serial.print(',');
  Serial.print(visible);Serial.print(',');
  Serial.print(erasurePicoJ(erasures),5);Serial.print(',');
  Serial.print(idealPinchA(1.0e4f,1.0e4f,1.0e16f),3);Serial.print(',');
  Serial.println(plasmaHz(1.0e16f),2);
  delay(150);
}
