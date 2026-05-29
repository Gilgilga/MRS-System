import paho.mqtt.client as mqtt

# Configurações (Devem ser iguais às do código do ESP32)
BROKER = "broker.hivemq.com"
PORT = 1883
TOPICO = "mackenzie/mrs/nivel"

def ao_conectar(client, userdata, flags, rc):
    print(f"Conectado à Central MRS System com código: {rc}")
    client.subscribe(TOPICO)

def ao_receber_mensagem(client, userdata, msg):
    nivel = float(msg.payload.decode())
    print(f"--- ATUALIZAÇÃO DE STATUS ---")
    print(f"Nível de preenchimento: {nivel}%")
    
    if nivel >= 90.0:
        print("STATUS: [CRÍTICO] - Lixeira pronta para coleta!")
    elif nivel >= 70.0:
        print("STATUS: [ALERTA] - Capacidade próxima do limite.")
    else:
        print("STATUS: [OK] - Capacidade operacional.")
    print("-" * 30)

# Inicialização do Cliente
cliente = mqtt.Client()
cliente.on_connect = ao_conectar
cliente.on_message = ao_receber_mensagem

print("Iniciando Monitoramento em Tempo Real...")
cliente.connect(BROKER, PORT, 60)
cliente.loop_forever()