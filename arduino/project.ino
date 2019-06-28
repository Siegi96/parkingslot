#include <SPI.h>
#include <WiFi.h>
#include <PubSubClient.h>

char ssid[] = "xxx";
char pass [] = "xxx";
int keyIndex = 0;

int tempPin = 0;
const int pingPin = 7;

char mqttServerAddress[] = "iot.eclipse.org";
int mqttServerPort = 1883;

int status = WL_IDLE_STATUS;

// Initialize the Ethernet client library
// with the IP address and port of the server
// that you want to connect to (port 80 is default for HTTP):
WiFiClient client;
PubSubClient mqttClient(client);

void setup() {
  //Initialize serial and wait for port to open:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for Leonardo only
  }

  // check for the presence of the shield:
  if (WiFi.status() == WL_NO_SHIELD) {
    Serial.println("WiFi shield not present");
    // don't continue:
    while (true);
  }
  // check firmware version. 1.1.0 is mandatory
  // wifi shield is usually delivered with 1.0.0
  // and an upgrade to 1.1.0 is necessary !!!
  String fv = WiFi.firmwareVersion();
  Serial.print("firmwareVersion: ");
  Serial.println(fv);
  if ( fv != "1.1.0" )
    Serial.println("Please upgrade the firmware"); 

  // attempt to connect to Wifi network:
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);

    // wait 10 seconds for connection:
    delay(10000);
  }
  Serial.println("Connected to wifi");
  printWifiStatus();

  Serial.print("\n***Starting connection to MQTT broker: ");
  Serial.println(mqttServerAddress);
  mqttClient.setServer(mqttServerAddress, mqttServerPort);
  mqttClient.setCallback(callback);
}

void loop(){
  if(!mqttClient.connected()){
    reconnect();
  }
  mqttClient.loop();
  delay(3000);

  //mqttClient.publish("S1810629011A/outTopic", "hello from arduino");
}
void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i=0;i<length;i++) {
    Serial.print((char)payload[i]);
  }

  Serial.println();
  if(strcmp(topic,"S1810629011A/getTemp") == 0){
    float temp = getTemp();   
    char result[8]; // Buffer big enough for 7-character float
    dtostrf(temp, 6, 2, result); // Leave room for too large numbers!
    mqttClient.publish("S1810629011A/sendTemp", result , true);
  } else{
   boolean parkingslot = getParkingslot();
   Serial.print(parkingslot); Serial.println(" from us");
   
   if(parkingslot){
      mqttClient.publish("S1810629011A/sendParkingslot", "frei." , true);
   } else{
      mqttClient.publish("S1810629011A/sendParkingslot", "besetzt." , true);
   }
  }
}

// reconnect logic for MQTT
void reconnect() {
  // Loop until we're reconnected
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (mqttClient.connect("arduinoClient_alskfmalskfmalsökdfmaölsk")) {
      Serial.println("connected");
      mqttClient.subscribe("S1810629011A/getTemp");
      mqttClient.subscribe("S1810629011A/getParkingslot");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

float getTemp(){
  float voltage, degreesC, degreesF;

  voltage =    (analogRead(tempPin) * 0.004882814);
  degreesC = (voltage - 0.5) * 100.0;
  //degreesF = degreesC * (9.0/5.0) + 32.0;
  return degreesC;
}


boolean getParkingslot() {
  int cm = ping(pingPin);
  //Serial.println(cm);
  if(cm > 100)
    return true;
  else
    return false;
}

int ping(int pin) {
  long duration, cm;

  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
  delayMicroseconds(2);
  digitalWrite(pin, HIGH);
  delayMicroseconds(5);
  digitalWrite(pin, LOW);

  pinMode(pin, INPUT);
  duration = pulseIn(pin, HIGH);

  cm = duration / 29 / 2;
  Serial.println(cm);

  return cm;
}
