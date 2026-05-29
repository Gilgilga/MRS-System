import mqtt, { MqttClient } from 'mqtt';
import { useBinStore } from '@/store/useBinStore';

class MqttService {
  private client: MqttClient | null = null;
  private isConnecting: boolean = false;

  public connect() {
    // Evita conexões duplicadas
    if (this.client || this.isConnecting) return;

    // Apenas conecta no cliente (browser)
    if (typeof window === 'undefined') return;

    this.isConnecting = true;
    const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt';
    
    console.log(`Connecting to MQTT broker via WebSocket: ${brokerUrl}`);
    
    const options = {
      clientId: `mrs_monitor_${Math.random().toString(16).substring(2, 10)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 5000,
    };

    try {
      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        console.log('MQTT Connected successfully');
        this.isConnecting = false;
        useBinStore.getState().setMqttConnected(true);

        // Inscreve-se no tópico base e sub-tópicos
        this.client?.subscribe(['mackenzie/mrs/nivel', 'mackenzie/mrs/nivel/#'], (err) => {
          if (err) {
            console.error('MQTT Subscription failed:', err);
          } else {
            console.log('MQTT Subscribed to topics successfully');
          }
        });
      });

      this.client.on('message', (topic, message) => {
        const payloadStr = message.toString().trim();
        
        try {
          // Caso 1: Payload é um JSON estruturado
          if (payloadStr.startsWith('{') && payloadStr.endsWith('}')) {
            const data = JSON.parse(payloadStr);
            if (data.id && typeof data.nivel === 'number') {
              useBinStore.getState().updateBin(data.id, data.nivel, data.timestamp);
              return;
            }
          }

          // Caso 2: Payload é um número bruto (nível de preenchimento)
          const nivel = parseFloat(payloadStr);
          if (!isNaN(nivel)) {
            // Se o tópico tiver subnível (ex: mackenzie/mrs/nivel/Lixeira-01), extraímos o ID do tópico
            const topicParts = topic.split('/');
            const id = topicParts.length > 3 ? topicParts.slice(3).join('/') : 'Lixeira-Geral';
            useBinStore.getState().updateBin(id, nivel);
          }
        } catch (e) {
          console.error('Error parsing MQTT message payload:', e, payloadStr);
        }
      });

      this.client.on('close', () => {
        console.log('MQTT Connection closed');
        useBinStore.getState().setMqttConnected(false);
        this.isConnecting = false;
      });

      this.client.on('error', (err) => {
        console.error('MQTT Error encountered:', err);
        useBinStore.getState().setMqttConnected(false);
        this.isConnecting = false;
      });
      
      this.client.on('offline', () => {
        console.log('MQTT Client went offline');
        useBinStore.getState().setMqttConnected(false);
      });

    } catch (error) {
      console.error('Fatal: Failed to connect to MQTT broker:', error);
      this.isConnecting = false;
    }
  }

  public disconnect() {
    if (this.client) {
      console.log('Disconnecting MQTT Client');
      this.client.end();
      this.client = null;
      useBinStore.getState().setMqttConnected(false);
      this.isConnecting = false;
    }
  }

  public publish(topic: string, message: string): boolean {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message, { qos: 0, retain: false });
      return true;
    }
    return false;
  }
}

export const mqttService = new MqttService();
export default mqttService;
