#include <WiFi.h>
#include <PubSubClient.h>

// --- Configurações de Rede ---
const char* ssid = "Wokwi-GUEST"; // Altere para o seu Wi-Fi
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";

// ==========================================
// CONFIGURAÇÃO DA LIXEIRA (Mude para cada ESP32)
// ==========================================
const String ID_LIXEIRA = "Lixeira-01"; // Ex: Mude para "Lixeira-02", "Lixeira-03", etc.
const float PROFUNDIDADE_DA_LIXEIRA_CM = 100.0; // <--- COLOQUE AQUI A ALTURA TOTAL DA LIXEIRA EM CENTÍMETROS (Ex: 100cm = 1 metro)

// O tópico gerado será automaticamente: mackenzie/mrs/nivel/Lixeira-01
const String TOPICO_LIXEIRA = "mackenzie/mrs/nivel/" + ID_LIXEIRA;
// ==========================================

// --- Pinos ---
const int pinoTrig = 12;
const int pinoEcho = 14;
const int ledSinalizacao = 5;

// --- Variáveis do Projeto ---
WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  Serial.print("Conectando ao Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi conectado!");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Tentando conexão MQTT...");

    // O ID de conexão no Broker PRECISA ser único para cada placa.
    String clientId = "MRS_ESP32_" + ID_LIXEIRA + "_" + String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("Conectado ao Broker HiveMQ!");
    } else {
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  randomSeed(micros());

  setup_wifi();
  client.setServer(mqtt_server, 1883);

  pinMode(pinoTrig, OUTPUT);
  pinMode(pinoEcho, INPUT);
  pinMode(ledSinalizacao, OUTPUT);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // 1. Leitura do Sensor Ultrassônico
  digitalWrite(pinoTrig, LOW);
  delayMicroseconds(2);
  digitalWrite(pinoTrig, HIGH);
  delayMicroseconds(10);
  digitalWrite(pinoTrig, LOW);

  long duracao = pulseIn(pinoEcho, HIGH);
  float distancia_livre = duracao * 0.034 / 2; // Distância do sensor até o lixo

  // 2. Cálculo do nível de preenchimento
  // Lógica reversa: Pega a altura total, subtrai a distância livre. O que sobra é o tamanho da pilha de lixo.
  float nivelPercentual = ((PROFUNDIDADE_DA_LIXEIRA_CM - distancia_livre) / PROFUNDIDADE_DA_LIXEIRA_CM) * 100;

  // Travas de segurança para o percentual não passar de 100% ou ficar negativo
  if (nivelPercentual < 0) nivelPercentual = 0;
  if (nivelPercentual > 100) nivelPercentual = 100;

  // 3. Atuador Local (LED) - Acende se o lixo ocupar 90% ou mais do espaço
  if (nivelPercentual >= 90.0) {
    digitalWrite(ledSinalizacao, HIGH);
    Serial.println("ALERTA: Lixeira Cheia!");
  } else {
    digitalWrite(ledSinalizacao, LOW);
  }

  // 4. Publicação MQTT usando o tópico exclusivo desta lixeira
  String payload = String(nivelPercentual);
  client.publish(TOPICO_LIXEIRA.c_str(), payload.c_str());

  Serial.print("[" + ID_LIXEIRA + "] Nível: ");
  Serial.print(nivelPercentual);
  Serial.println("%");

  delay(2000);
}
