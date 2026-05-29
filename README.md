# MRS System - Dashboard PWA de Lixeiras Inteligentes

Este projeto é uma aplicação web PWA responsiva em tempo real desenvolvida com **Next.js**, **TailwindCSS (v4)**, **TypeScript** e **Zustand** para o monitoramento de múltiplas lixeiras inteligentes simultaneamente por meio do protocolo **MQTT via WebSockets**.

O sistema foi desenhado sob uma filosofia minimalista moderna de IoT, fornecendo telemetria em tempo real, previsões de preenchimento, suporte offline completo e um painel de simulação interativo para testes sem hardware físico.

---

## Como Iniciar (Instalação e Execução)

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18.x ou superior) instalado em sua máquina.

### 1. Instalar as dependências
No diretório raiz do projeto, execute o comando abaixo para baixar as dependências do Next.js e os pacotes adicionais (`mqtt`, `zustand`, `lucide-react`, `react-hot-toast`):

```bash
npm install
```

### 2. Executar em modo de desenvolvimento
Para iniciar o servidor local de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

### 3. Build de Produção
Para criar a versão otimizada de produção e verificar a conformidade com PWA:

```bash
npm run build
npm run start
```

---

## Arquitetura do Sistema

A arquitetura do sistema segue o fluxo clássico de uma aplicação IoT descentralizada com distribuição via broker de mensagens pub/sub:

```text
+-----------------------+
|  Dispositivo Físico   | ---[Publica: Payload JSON ou Nível Bruto]---\
|  (ESP32 / Arduino)    |                                              \
+-----------------------+                                               \
                                                                  +-------------+
+-----------------------+                                         |  Broker     |
|   Simulador Web       | ---[Publica: Payload JSON (WebSockets)]---> |  MQTT       |
| (Embutido no App)     |                                         |  HiveMQ     |
+-----------------------+                                         +-------------+
                                                                         |
                                                                         | (Assinatura via WebSockets)
                                                                         v
                                                              +--------------------+
                                                              |  Next.js Frontend  |
                                                              | (Zustand Store)    |
                                                              +--------------------+
                                                              /         |          \
                                                             /          v           \
                                                     [Visualização]  [Notificações] [Offline Cache]
                                                     Grid Cards &    Toasts em      Service Worker
                                                     KPIs Dinâmicos  Estado Crítico (Shell PWA)
```

1. **Camada de Dispositivos (Publishers)**: Sensores ultrassônicos acoplados às lixeiras (ou nosso simulador embutido) calculam a porcentagem de preenchimento e publicam no broker.
2. **Broker de Mensagens (HiveMQ)**: Atua como o servidor intermediário que recebe as publicações e as encaminha em tempo real para os clientes conectados que assinaram os tópicos.
3. **Dashboard Web (Subscriber & Store)**: A interface Next.js conecta-se ao HiveMQ via WebSocket seguro (`wss://`), consome as mensagens, manipula o estado global de forma reativa através do Zustand e atualiza a UI sem necessidade de recarregamento.

---

## Fluxo de Dados e Payload MQTT

### Configurações de Conexão
* **Broker Host**: `broker.hivemq.com`
* **Porta WebSocket**: `8884` (Secure WebSockets - `wss`)
* **URL de Conexão**: `wss://broker.hivemq.com:8884/mqtt`
* **Tópico Base**: `mackenzie/mrs/nivel`
* **Sub-tópicos de Escuta**:
  * `mackenzie/mrs/nivel` (tópico base geral)
  * `mackenzie/mrs/nivel/#` (todos os IDs individuais, ex: `mackenzie/mrs/nivel/Lixeira-01`)

### Formatos de Payload Suportados

A aplicação possui processamento inteligente capaz de interpretar dois formatos de payload:

#### 1. Formato JSON Estruturado (Recomendado)
Publicado no tópico `mackenzie/mrs/nivel` ou em sub-tópicos como `mackenzie/mrs/nivel/Lixeira-01`.
```json
{
  "id": "Lixeira-01",
  "nivel": 82,
  "timestamp": "2026-05-26T18:00:00"
}
```
* **id**: Identificador único alfanumérico da lixeira.
* **nivel**: Valor numérico de preenchimento de `0` a `100`.
* **timestamp**: Data/hora em formato ISO 8601 correspondente à leitura do sensor.

#### 2. Formato Bruto (Float/Int) - Retrocompatibilidade
Publicado em um sub-tópico no padrão `mackenzie/mrs/nivel/{ID_DA_LIXEIRA}` (Ex: `mackenzie/mrs/nivel/Lixeira-02`).
```text
82.5
```
* O sistema detecta o ID da lixeira analisando o sufixo do tópico de recebimento (`Lixeira-02`) e atribui o valor bruto recebido como nível atual.

---

## Recursos de PWA (Progressive Web App)

A aplicação foi equipada com suporte completo a PWA nativo:
* **Instalabilidade**: Manifesto (`public/manifest.json`) configurado com tela de inicialização (splash screen), cores de tema e suporte para botão de instalação "Adicionar à Tela Inicial" em dispositivos Android, iOS e desktops.
* **Offline Shell**: Service Worker customizado (`public/sw.js`) que realiza o cache de assets essenciais (HTML, JS, CSS, Ícone), garantindo que o esqueleto do dashboard carregue instantaneamente mesmo sem acesso à internet.
* **Indicador Offline**: Sensores de rede no app avisam imediatamente caso a conexão de internet caia, sinalizando a perda de sincronia MQTT ao vivo com badges elegantes de status.

---

## Painel de Simulação IoT Integrado

Caso você não tenha um ESP32 físico configurado no momento, o dashboard conta com um **Simulador MQTT** embutido:
1. Clique em **"Ativar Simulação"** no cabeçalho.
2. O simulador iniciará tarefas periódicas publicando no broker HiveMQ real.
3. Você pode alterar as taxas de enchimento, adicionar lixeiras personalizadas ou arrastar o slider de nível manualmente.
4. Caso seu navegador esteja sem internet, o simulador continuará funcionando de forma isolada, atualizando o estado interno para demonstração local.

---

## Preparado para Expansão

O painel inferior expansível **"Recursos de Expansão (Módulos IoT)"** demonstra o design estrutural do sistema preparado para acoplamento de:
* **Mapas**: Interface de geolocalização simulada em SVG interativo para visualizar a rota de coleta.
* **Analytics**: Gráficos históricos de volume acumulado.
* **Reconhecimento Facial**: Simulador de câmera facial para liberação de tampas ou autenticação de coletores autorizados.
* **Sensores Extras**: Suporte a telemetria secundária (Temperatura interna, Gás Metano, Incêndio e contagem de abertura de tampas).
