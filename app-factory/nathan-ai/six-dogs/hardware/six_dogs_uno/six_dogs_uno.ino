/*
  NATHAN AI / SIX DOGS PHYSICAL CONSOLE — ARDUINO UNO PROTOTYPE
  A button and six separate low-voltage indicator LEDs, no sensors, no networking.
  Serial protocol v1: "SD1 STEP 1" ... "SD1 STEP 6"; "SD1 RESET"; "SD1 QUERY"
  This is a human-operated visualization, not a medical/stress detector.
*/
#include <Arduino.h>
#include <stdlib.h>
#include <string.h>

const uint8_t BUTTON_PIN=2;
const uint8_t LED_PINS[6]={3,4,5,6,7,8};
const char *DOGS[6]={"KNICK","KNACK","PADDY","WHACK","DOG","BONE"};
const unsigned long DEBOUNCE_MS=35;
const unsigned long LONG_PRESS_MS=1500;
uint8_t currentStage=0; // zero-based internally, one-based over serial
char lineBuffer[32];
uint8_t lineLength=0;
bool lastReading=HIGH,stableReading=HIGH;
unsigned long lastChangeAt=0,pressStartedAt=0;

void paintStage(){
  for(uint8_t i=0;i<6;i++){
    digitalWrite(LED_PINS[i],i==currentStage?HIGH:LOW);
  }
}

void printStatus(){
  Serial.print(F("SD1 STATUS STEP="));
  Serial.print(currentStage+1);
  Serial.print(F(" NAME="));
  Serial.println(DOGS[currentStage]);
}

void setStage(uint8_t index){
  if(index>5)return;
  currentStage=index;
  paintStage();
  printStatus();
}

void parseCommand(const char* line){
  if(strcmp(line,"SD1 QUERY")==0){printStatus();return;}
  if(strcmp(line,"SD1 RESET")==0){setStage(0);return;}
  const char* prefix="SD1 STEP ";
  if(strncmp(line,prefix,9)==0){
    char* end=nullptr;
    long value=strtol(line+9,&end,10);
    if(end!=line+9 && *end=='\0' && value>=1 && value<=6){
      setStage(static_cast<uint8_t>(value-1));
      return;
    }
  }
  Serial.println(F("SD1 ERROR INVALID_COMMAND"));
}

void readSerial(){
  while(Serial.available()>0){
    char ch=(char)Serial.read();
    if(ch=='\r')continue;
    if(ch=='\n'){
      lineBuffer[lineLength]='\0';
      if(lineLength>0)parseCommand(lineBuffer);
      lineLength=0;
    }else if(lineLength<sizeof(lineBuffer)-1){
      lineBuffer[lineLength++]=ch;
    }else{
      lineLength=0;
      Serial.println(F("SD1 ERROR LENGTH"));
    }
  }
}

void readButton(){
  bool reading=digitalRead(BUTTON_PIN);
  unsigned long now=millis();
  if(reading!=lastReading)lastChangeAt=now;
  if(now-lastChangeAt>=DEBOUNCE_MS && reading!=stableReading){
    stableReading=reading;
    if(stableReading==LOW){
      pressStartedAt=now;
    }else{
      unsigned long duration=now-pressStartedAt;
      if(duration>=LONG_PRESS_MS){setStage(0);}
      else{setStage((currentStage+1)%6);}
    }
  }
  lastReading=reading;
}

void setup(){
  pinMode(BUTTON_PIN,INPUT_PULLUP);
  for(uint8_t i=0;i<6;i++)pinMode(LED_PINS[i],OUTPUT);
  paintStage();
  Serial.begin(115200);
  printStatus();
}

void loop(){
  readButton();
  readSerial();
}
