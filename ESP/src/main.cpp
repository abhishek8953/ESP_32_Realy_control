#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Replace with your network credentials
const char* ssid = "Abhishek";
const char* password = "1234554321";

// Firebase Realtime Database URL and authentication key
const char* firebaseHost = "";
const char* firebaseAuth = "";

// Relay pins (changed pin 2 to 25)
const int relayPins[11] = {5, 18, 19, 22, 23, 13, 12, 14, 26, 27, 32};

// Local state of relay values
bool relayStates[11] = {false, false, false, false, false, false, false, false, false, false, false};

// WiFi connection status pin
const int wifiStatusPin = 2;

// Function to initialize relays
void initRelays() {
  for (int i = 0; i < 11; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // Turn off all relays initially
  }
}

// Function to update relay states
void updateRelays(const JsonObject& json) {
  for (int i = 0; i < 11; i++) {
    String relayKey = "relay" + String(i + 1);
    if (json.containsKey(relayKey)) {
      bool state = json[relayKey];
      digitalWrite(relayPins[i], state ? LOW : HIGH); // HIGH to turn off, LOW to turn on
      relayStates[i] = state;
      Serial.printf("Relay %d set to %s\n", i + 1, state ? "ON" : "OFF");
    }
  }
}

// Function to handle Firebase data
void handleFirebaseData(const JsonObject& json) {
  if (json.containsKey("path") && json.containsKey("data")) {
    String path = json["path"];
    JsonVariant data = json["data"];

    if (path == "/") {
      // Full update
      if (data.is<JsonObject>()) {
        updateRelays(data.as<JsonObject>());
      }
    } else if (path.startsWith("/relay")) {
      // Single relay update
      int relayIndex = path.substring(6).toInt() - 1;
      if (relayIndex >= 0 && relayIndex < 11 && data.is<bool>()) {
        bool state = data.as<bool>();
        digitalWrite(relayPins[relayIndex], state ? LOW : HIGH); // HIGH to turn off, LOW to turn on
        relayStates[relayIndex] = state;
        Serial.printf("Relay %d set to %s\n", relayIndex + 1, state ? "ON" : "OFF");
      }
    }
  }
}

// Function to connect to Firebase
void connectToFirebase() {
  HTTPClient http;
  String url = String(firebaseHost) + "/relays.json?auth=" + firebaseAuth;
  http.begin(url);
  http.addHeader("Accept", "text/event-stream");
  http.addHeader("Connection", "keep-alive");

  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    WiFiClient* stream = http.getStreamPtr();
    while (stream->connected()) {
      String line = stream->readStringUntil('\n');
      if (line.startsWith("data: ")) {
        line = line.substring(6);
        Serial.printf("Received data: %s\n", line.c_str());
        DynamicJsonDocument doc(1024);
        DeserializationError error = deserializeJson(doc, line);
        if (!error) {
          JsonObject json = doc.as<JsonObject>();
          handleFirebaseData(json);
        } else {
          Serial.printf("deserializeJson() failed: %s\n", error.c_str());
        }
      }
    }
  } else {
    Serial.printf("HTTP GET failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  pinMode(wifiStatusPin, OUTPUT);
  digitalWrite(wifiStatusPin, LOW); // Initially set to LOW

  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println(" connected!");
  digitalWrite(wifiStatusPin, HIGH); // Set to HIGH when connected

  initRelays();
  connectToFirebase();
}

void loop() {
  // Only handle WiFi reconnection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    digitalWrite(wifiStatusPin, LOW); // Set to LOW when disconnected
    WiFi.reconnect();
    delay(1000);
  } else {
    digitalWrite(wifiStatusPin, HIGH); // Set to HIGH when connected
    Serial.print("hello");

    // Reconnect to Firebase if necessary
    connectToFirebase();
  }
}