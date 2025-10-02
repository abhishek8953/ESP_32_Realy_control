#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid     = "Abhishek";
const char* password = "1234554321";

// Firebase credentials
const char* firebaseHost = "esp32-d7eba-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* firebaseAuth = "kGF88gjHu78AUMzdGojIFxjJYrAWqRFwz9tuW8a6";

// Root CA certificate (Google root) ...
static const char FIREBASE_ROOT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFYjCCBEqgAwIBAgIQd70NbNs2+RrqIQ/E8FjTDTANBgkqhkiG9w0BAQsFADBX
MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE
CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIwMDYx
OTAwMDA0MloXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT
GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFIx
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAthECix7joXebO9y/lD63
ladAPKH9gvl9MgaCcfb2jH/76Nu8ai6Xl6OMS/kr9rH5zoQdsfnFl97vufKj6bwS
iV6nqlKr+CMny6SxnGPb15l+8Ape62im9MZaRw1NEDPjTrETo8gYbEvs/AmQ351k
KSUjB6G00j0uYODP0gmHu81I8E3CwnqIiru6z1kZ1q+PsAewnjHxgsHA3y6mbWwZ
DrXYfiYaRQM9sHmklCitD38m5agI/pboPGiUU+6DOogrFZYJsuB6jC511pzrp1Zk
j5ZPaK49l8KEj8C8QMALXL32h7M1bKwYUH+E4EzNktMg6TO8UpmvMrUpsyUqtEj5
cuHKZPfmghCN6J3Cioj6OGaK/GP5Afl4/Xtcd/p2h/rs37EOeZVXtL0m79YB0esW
CruOC7XFxYpVq9Os6pFLKcwZpDIlTirxZUTQAs6qzkm06p98g7BAe+dDq6dso499
iYH6TKX/1Y7DzkvgtdizjkXPdsDtQCv9Uw+wp9U7DbGKogPeMa3Md+pvez7W35Ei
Eua++tgy/BBjFFFy3l3WFpO9KWgz7zpm7AeKJt8T11dleCfeXkkUAKIAf5qoIbap
sZWwpbkNFhHax2xIPEDgfg1azVY80ZcFuctL7TlLnMQ/0lUTbiSw1nH69MG6zO0b
9f6BQdgAmD06yK56mDcYBZUCAwEAAaOCATgwggE0MA4GA1UdDwEB/wQEAwIBhjAP
BgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTkrysmcRorSCeFL1JmLO/wiRNxPjAf
BgNVHSMEGDAWgBRge2YaRQ2XyolQL30EzTSo//z9SzBgBggrBgEFBQcBAQRUMFIw
JQYIKwYBBQUHMAGGGWh0dHA6Ly9vY3NwLnBraS5nb29nL2dzcjEwKQYIKwYBBQUH
MAKGHWh0dHA6Ly9wa2kuZ29vZy9nc3IxL2dzcjEuY3J0MDIGA1UdHwQrMCkwJ6Al
oCOGIWh0dHA6Ly9jcmwucGtpLmdvb2cvZ3NyMS9nc3IxLmNybDA7BgNVHSAENDAy
MAgGBmeBDAECATAIBgZngQwBAgIwDQYLKwYBBAHWeQIFAwIwDQYLKwYBBAHWeQIF
AwMwDQYJKoZIhvcNAQELBQADggEBADSkHrEoo9C0dhemMXoh6dFSPsjbdBZBiLg9
NR3t5P+T4Vxfq7vqfM/b5A3Ri1fyJm9bvhdGaJQ3b2t6yMAYN/olUazsaL+yyEn9
WprKASOshIArAoyZl+tJaox118fessmXn1hIVw41oeQa1v1vg4Fv74zPl6/AhSrw
9U5pCZEt4Wi4wStz6dTZ/CLANx8LZh1J7QJVj2fhMtfTJr9w4z30Z209fOU0iOMy
+qduBmpvvYuR7hZL6Dupszfnw0Skfths18dG9ZKb59UhvmaSGZRVbNQpsg3BZlvi
d0lIKO2d1xozclOzgjXPYovJJIultzkMu34qQb9Sz/yilrbCgj8=
-----END CERTIFICATE-----
)EOF";

// Relays and LED
const int relayPins[11] = {5,18,19,22,23,13,12,14,26,27,32};
const int wifiLED       = 2;

// SSE path & client
String streamPath = "/relays.json?auth=" + String(firebaseAuth);
WiFiClientSecure client;
bool streamOpen = false;

// Timing
unsigned long lastSseAttempt = 0;
const unsigned long sseRetryInterval = 5000;

// Wi‑Fi reconnect state
bool wifiReconnecting = false;
unsigned long wifiReconnectStart = 0;
const unsigned long wifiReconnectTimeout = 20000; // 20s

// Buffer for SSE
String eventData;

void handleFirebaseData(JsonObject json) {
  if (!json.containsKey("path") || !json.containsKey("data")) return;
  String path = json["path"].as<String>();
  JsonVariant data = json["data"];

  if (path == "/") {
    JsonObject relays = data.as<JsonObject>();
    for (int i = 0; i < 11; i++) {
      String key = "relay" + String(i+1);
      if (relays.containsKey(key)) {
        bool st = relays[key];
        digitalWrite(relayPins[i], st ? LOW : HIGH);
        Serial.printf("Relay %d %s\n", i+1, st?"ON":"OFF");
      }
    }
  } else if (path.startsWith("/relay")) {
    int idx = path.substring(6).toInt()-1;
    if (idx>=0 && idx<11) {
      bool st = data.as<bool>();
      digitalWrite(relayPins[idx], st?LOW:HIGH);
      Serial.printf("Relay %d %s\n", idx+1, st?"ON":"OFF");
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(wifiLED, OUTPUT);
  digitalWrite(wifiLED, LOW);
  for (int i=0; i<11; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH);
  }
  // initial connect
  WiFi.begin(ssid,password);
}

void loop() {
  // 1) Handle Wi-Fi reconnect non-blocking
  if (WiFi.status() != WL_CONNECTED) {
    if (!wifiReconnecting) {
      wifiReconnecting = true;
      wifiReconnectStart = millis();
      Serial.print("WiFi lost – reconnecting");
      digitalWrite(wifiLED, LOW);
      WiFi.disconnect();
      WiFi.begin(ssid,password);
    }
    // Give up after timeout, then restart attempts
    if (millis() - wifiReconnectStart > wifiReconnectTimeout) {
      Serial.println(" – still down, retrying...");
      wifiReconnectStart = millis();
      WiFi.disconnect();
      WiFi.begin(ssid,password);
    }
    // Once reconnected:
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi reconnected");
      digitalWrite(wifiLED, HIGH);
      wifiReconnecting = false;
      // drop SSE so we’ll reconnect
      streamOpen = false;
      eventData = "";
      lastSseAttempt = 0;
    }
    // skip SSE until Wi-Fi back
    return;
  }

  // 2) Ensure SSE connection exists (throttled)
  if (!streamOpen && millis() - lastSseAttempt > sseRetryInterval) {
    lastSseAttempt = millis();
    Serial.println("Connecting SSE…");
    client.stop();
    client.setCACert(FIREBASE_ROOT_CA);  // before connect
    if (client.connect(firebaseHost,443)) {
      client.printf(
        "GET %s HTTP/1.1\r\n"
        "Host: %s\r\n"
        "Accept: text/event-stream\r\n"
        "Connection: keep-alive\r\n\r\n",
        streamPath.c_str(), firebaseHost);
      // discard headers
      while (client.connected()) {
        if (client.readStringUntil('\n') == "\r") break;
      }
      streamOpen = true;
      Serial.println("SSE open");
    } else {
      Serial.println("SSE failed");
    }
  }

  // 3) Read incoming SSE
  if (streamOpen && client.connected()) {
    while (client.available()) {
      String line = client.readStringUntil('\n');
      line.trim();
      if (line.length()==0) {
        // end of event
        if (eventData.length()) {
          StaticJsonDocument<1024> doc;
          if (deserializeJson(doc, eventData) == DeserializationError::Ok) {
            handleFirebaseData(doc.as<JsonObject>());
          }
          eventData = "";
        }
      }
      else if (line.startsWith("data: ")) {
        eventData += line.substring(6);
      }
    }
  }
  else if (streamOpen && !client.connected()) {
    Serial.println("SSE dropped");
    client.stop();
    streamOpen = false;
    lastSseAttempt = 0;
  }

  delay(10);  // small yield
}
