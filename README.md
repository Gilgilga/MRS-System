# MRS System - Sistema Inteligente de Gestão e Monitoramento de Resíduos (IoT)

Este repositório contém a documentação completa, o firmware do microcontrolador, o script de monitoramento local e o dashboard web para o **MRS System**, um ecossistema IoT de monitoramento em tempo real do nível de preenchimento de lixeiras inteligentes.

O projeto foi desenhado sob uma filosofia minimalista moderna de Internet das Coisas (IoT), fornecendo telemetria em tempo real, previsões de preenchimento por histórico recente, suporte offline completo e um painel de simulação interativo para testes sem hardware físico.

---

## 📋 Sumário
1. [Descrição Geral e Funcionamento](#1-descrição-geral-e-funcionamento)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Especificações de Hardware e Conexões](#3-especificações-de-hardware-e-conexões)
4. [Software Desenvolvido e Documentação de Código](#4-software-desenvolvido-e-documentação-de-código)
5. [Interfaces, Protocolos e Módulos de Comunicação](#5-interfaces-protocolos-e-módulos-de-comunicação)
6. [Conectividade e Controle via Internet (TCP/IP e MQTT)](#6-conectividade-e-controle-via-internet-tcpip-e-mqtt)
7. [Guia de Reprodução Passo a Passo](#7-guia-de-reprodução-passo-a-passo)

---

## 1. Descrição Geral e Funcionamento

O **MRS System** otimiza o processo de coleta de resíduos sólidos através de sensoriamento contínuo e telemetria baseada em nuvem. 

### Princípio de Operação:
1. **Sensoriamento**: Um sensor ultrassônico **HC-SR04** é fixado na face interna superior da tampa da lixeira. Ele emite ondas ultrassônicas direcionadas ao fundo da lixeira e mede o tempo de propagação do eco para determinar a distância física até os resíduos acumulados.
2. **Processamento Local**: O microcontrolador **ESP32 DevKit V1** processa o sinal de eco (em microssegundos), converte esse tempo em distância (centímetros) e calcula a porcentagem de preenchimento da lixeira. A lógica calcula:
   - $0\%$ de preenchimento: lixeira vazia (maior distância registrada).
   - $100\%$ de preenchimento: lixeira cheia (menor distância registrada próxima ao limite físico do sensor).
3. **Sinalização e Atuação Local**: Um **LED vermelho** atua como sinalizador local conectado ao ESP32:
   - **Piscando lento (1 Hz)**: O dispositivo está tentando se conectar à rede Wi-Fi ou ao Broker MQTT.
   - **Aceso contínuo**: O sistema está online e o nível de lixo está em uma faixa segura (abaixo de $90\%$).
   - **Piscando rápido (5 Hz)**: O nível de preenchimento atingiu capacidade crítica ($\ge 90\%$), alertando localmente que a lixeira está pronta para ser esvaziada.
4. **Comunicação pela Internet**: Através da rede Wi-Fi e utilizando a pilha **TCP/IP**, o ESP32 publica os dados de nível utilizando o protocolo **MQTT** para um broker na nuvem (**HiveMQ** público).
5. **Acompanhamento no Dashboard Web (Interface PWA)**: Uma aplicação web desenvolvida em Next.js conecta-se ao broker MQTT via WebSockets Seguros (WSS), atualizando o estado do sistema reativamente na tela. A aplicação calcula estatísticas de uso, taxa de preenchimento por hora e gera uma estimativa de tempo restante até a lotação.
6. **Monitoramento via CLI**: Um script Python complementar assina o tópico MQTT do broker via protocolo TCP padrão para exibir notificações diretas na linha de comando de operadores da central.

---

## 2. Arquitetura do Sistema

O fluxo de dados da aplicação segue o paradigma Pub/Sub descentralizado intermediado por um Broker de mensagens na nuvem:

```text
 +-----------------------------------------------------------------------------------+
 |                                 Fluxo de Dados IoT                                |
 +--------------------+                                                              |
 | 1. Sensor HC-SR04  |                                                              |
 |    (Ultrassônico)  |                                                              |
 +---------+----------+                                                              |
           | (Pulso de eco em microssegundos)                                        |
           v                                                                         |
 +--------------------+                                                              |
 | 2. ESP32 DevKit V1 | <----\                                                       |
 |   (Processamento)  |      | (Controle do LED vermelho de status)                  |
 +---------+----------+ -----/                                                       |
           | (Publica nível via Wi-Fi local - TCP/IP e MQTT na porta 1883)           |
           v                                                                         |
 +--------------------+                                                              |
 |  3. Broker MQTT    |                                                              |
 |   (HiveMQ Cloud)   |                                                              |
 +----+----------+----+                                                              |
      |          |                                                                   |
      |          | (Assinatura via WebSockets Seguros - WSS na porta 8884)           |
      |          v                                                                   |
      |    +------------------------+                                                |
      |    | 4. Next.js PWA App     | ---> [Visualização] Grid Cards & KPIs          |
      |    |    (Dashboard Web)     | ---> [Notificações] Toasts de nível crítico    |
      |    +------------------------+ ---> [Cache Offline] Service Worker (PWA Shell)|
      |                                                                              |
      | (Assinatura via MQTT TCP padrão na porta 1883)                               |
      v                                                                              |
 +--------------------+                                                              |
 | 5. Script Python   | ---> [Monitor CLI] Impressão de status no terminal:          |
 |    (monitor)       |                    OK, Alerta ou Crítico                     |
 +--------------------+                                                              |
 +-----------------------------------------------------------------------------------+
```

---

## 3. Especificações de Hardware e Conexões

O hardware foi projetado focando em baixo custo de implementação, robustez e eficiência energética. 

### Componentes Utilizados:
* **Microcontrolador (Plataforma de Desenvolvimento)**: **ESP32 DevKit V1**
  - SoC de alto desempenho com processador Tensilica Xtensa Dual-Core 32-bit LX6 rodando a 240 MHz.
  - Conectividade de rádio integrada Wi-Fi 802.11 b/g/n (2.4 GHz) e Bluetooth v4.2 BR/EDR/BLE.
  - Tensão de operação dos pinos de 3.3V (alimentação geral via barramento micro-USB ou pino VIN a 5V).
* **Sensor de Nível (Sensor Ultrassônico)**: **HC-SR04**
  - Sensor de distância ativo por transmissão/recepção de transdutores acústicos de 40 kHz.
  - Faixa de trabalho operacional: 2 cm a 400 cm com resolução de 0,3 cm e ângulo de abertura menor que $15^\circ$.
  - Alimentado pela saída física de 5V (pino VIN) do ESP32.
* **Atuador de Sinalização Local**: **LED Difuso Vermelho**
  - Utilizado para fornecer feedback imediato ao usuário que está descartando resíduos e ao coletor físico.
* **Componente de Proteção**: **Resistor de Carbono de $220\ \Omega$**
  - Ligado em série com o ânodo do LED vermelho para limitar a corrente e proteger a GPIO do ESP32 contra sobrecorrente (mantendo o dreno seguro abaixo de ~10 mA).

### Esquema de Conexões Elétricas:

```text
       +---------------------------------------------+
       |               ESP32 DEVKIT V1               |
       |                                             |
       |  [VIN] (5V) --------- [VCC] (HC-SR04)       |
       |  [GND] ------------- [GND] (HC-SR04)       |
       |  [GPIO 12] ---------- [TRIG] (HC-SR04)       |
       |  [GPIO 14] --------- [ECHO] (HC-SR04)       |
       |                                             |
       |  [GPIO 5] ---------- [Resistor 220 Ohm] ----+
       |                                             |
       |  [GND] ------------- [Catodo - LED] <-------+
       +---------------------------------------------+
```

### Especificações Mecânicas, Caixas e Modelagem 3D:
Para proteção dos módulos eletrônicos no interior das lixeiras, foram projetadas peças em impressão 3D (preferencialmente utilizando filamento ABS ou PETG por sua resistência à umidade e ao desgaste químico):
* **Case Hermética do ESP32**:
  - Dimensões externas recomendadas: 85 mm (comprimento) x 65 mm (largura) x 45 mm (altura).
  - Inclui entrada vedada por prensa-cabo emborrachado para cabos de alimentação e conexão externa.
* **Suporte da Tampa do Sensor Ultrassônico**:
  - Encaixe perpendicular projetado para ser colado ou parafusado sob a tampa interna.
  - Possui dois recortes cilíndricos com diâmetro exato de 16,5 mm cada, com espaçamento de centro a centro de 26 mm para alojar firmemente as cápsulas transmissora e receptora do sensor HC-SR04, evitando acúmulo de sujeira nas bordas.
* **Dimensões e Calibração de Referência (Lixeira de Teste)**:
  - Lixeira cilíndrica de **40 Litros** utilizada como padrão de calibração:
    - Altura interna útil total: 50 cm.
    - Diâmetro interno útil: 30 cm.
    - **Ponto de Lixeira Vazia ($0\%$ preenchida)**: Distância registrada de **45 cm** (foi aplicada uma margem de recuo de 5 cm do topo como "zona morta" de segurança para evitar contato físico do lixo com o sensor e evitar leituras incorretas abaixo do limite mínimo de 2 cm do HC-SR04).
    - **Ponto de Lixeira Cheia ($100\%$ preenchida)**: Distância de **5 cm** registrada pelo sensor.

---

## 4. Software Desenvolvido e Documentação de Código

O ecossistema de software do projeto foi projetado de forma modular e independente, operando sob uma arquitetura distribuída.

### A. Firmware do Dispositivo IoT (ESP32)

O firmware carregado no ESP32 foi escrito em C++ na IDE Arduino e realiza as seguintes funções lógicas:
1. **Conectividade Resiliente**: O loop de execução gerencia reconexões cíclicas automáticas ao Wi-Fi local e ao Broker HiveMQ caso ocorra qualquer perda de sinal de rede ou queda de energia.
2. **Sensoriamento por Ultrassom**: Controla o pino de Trigger por meio de pulsos controlados de $10\ \mu\text{s}$ para gerar o trem de pulsos do sensor, capturando o retorno no pino Echo através da função `pulseIn()`.
3. **Tratamento de Dados Locais**: Converte o tempo de leitura para distância através da constante da velocidade do som ($340\text{ m/s}$ ou $0,034\text{ cm/}\mu\text{s}$):
   $$\text{Distância (cm)} = \frac{\text{Duração do pulso (}\mu\text{s)} \times 0.034}{2}$$
   O cálculo do nível de preenchimento é efetuado por lógica reversa:
   $$\text{Nível Percentual (\%)} = \left(\frac{\text{Profundidade Máxima} - \text{Distância Medida}}{\text{Profundidade Máxima}}\right) \times 100$$
4. **Acionamento de Status**: Atualiza a frequência de oscilação e acendimento do LED vermelho dependendo do percentual obtido.
5. **Transmissão Assíncrona**: Publica o valor resultante formatado como String numérica pura diretamente no tópico exclusivo da respectiva lixeira.

> O firmware completo desenvolvido está localizado e pode ser consultado em [Codigo_EPS32.md](file:///d:/coisas/Sistemas/ProjLixeiraInteligente/Codigo_EPS32.md).

---

### B. Dashboard Web Frontend (PWA Next.js)

O painel administrativo foi construído utilizando **Next.js**, **TailwindCSS (v4)**, **TypeScript** e **Zustand** para o gerenciamento reativo e centralizado do estado.

* **Conexão MQTT via WebSockets (`src/services/mqttService.ts`)**:
  - Implementa um cliente MQTT unificado que se conecta ao host `wss://broker.hivemq.com:8884/mqtt`.
  - Assina o tópico principal `mackenzie/mrs/nivel/#` para capturar as transmissões dos dispositivos de forma assíncrona.
  - Converte payloads estruturados em JSON ou leituras em texto bruto para o estado interno da aplicação, extraindo o identificador da lixeira diretamente da hierarquia do tópico recebido.
* **Store de Estado Reativa (`src/store/useBinStore.ts`)**:
  - Armazena as instâncias das lixeiras detectadas e mantém uma fila circular das últimas 6 leituras por dispositivo.
  - **Algoritmo de Análise Preditiva**: Calcula a variação de nível por hora ($\Delta\%/\text{hora}$) por regressão linear simplificada e estima o tempo restante em horas para que cada lixeira atinja $100\%$ de capacidade.
  - **Detector de Timeouts (Segurança)**: Se um dispositivo eletrônico ficar sem transmitir leituras por mais de 25 segundos, a store automaticamente atualiza o seu status visual para **"offline"** e suspende o temporizador de preenchimento. Caso o tempo ultrapasse 60 segundos, a lixeira inativa é removida do painel operacional até que um novo sinal seja interceptado.
  - **Simulador MQTT Embutido**: Possibilita o teste prático de toda a interface reativa injetando leituras periódicas artificiais no Broker HiveMQ real diretamente do navegador.

---

### C. Script Auxiliar de Monitoramento Python (`monitor_lixeira.py`)

Utilitário em linha de comando desenvolvido para administradores de infraestrutura e monitoramento em terminal linux/windows:
* Desenvolvido com a biblioteca `paho-mqtt` no protocolo TCP tradicional (porta 1883).
* Analisa as flutuações numéricas recebidas e imprime de maneira formatada na saída padrão do terminal as faixas de criticidade do sistema:
  - **OK**: Preenchimento abaixo de $70\%$.
  - **ALERTA**: Preenchimento entre $70\%$ e $89,9\%$ da capacidade interna.
  - **CRÍTICO**: Preenchimento igual ou superior a $90\%$ (com aviso sonoro ou alerta visual de coleta obrigatória).

> O script Python desenvolvido está localizado e pode ser consultado em [monitor_lixeira.py](file:///d:/coisas/Sistemas/ProjLixeiraInteligente/monitor_lixeira.py).

---

## 5. Interfaces, Protocolos e Módulos de Comunicação

O fluxo de dados no ecossistema MRS System adota a arquitetura de rede padrão de internet TCP/IP acoplada à pilha leve para telemetria IoT:

```text
 +--------------------------------------------------------------------------------+
 |                           Pilha de Protocolos do Projeto                       |
 +--------------------------------------------------------------------------------+
 | Aplicação:          MQTT v3.1.1 (Protocolo de Telemetria IoT baseada em Pub/Sub) |
 +--------------------------------------------------------------------------------+
 | Sessão/Transporte:  TCP Convencional (Porta 1883)  |  WebSockets (Porta 8884)  |
 +--------------------------------------------------------------------------------+
 | Rede:               Internet Protocol - IPv4 (Roteamento de pacotes na Nuvem)  |
 +--------------------------------------------------------------------------------+
 | Enlace / Física:    Wi-Fi (802.11 b/g/n) para ESP32  |  Rede Local / Ethernet  |
 +--------------------------------------------------------------------------------+
```

### Configurações de Conectividade do Broker:
* **Broker Host**: `broker.hivemq.com` (Servidor de distribuição em nuvem público e global)
* **Porta MQTT TCP (ESP32 e Python)**: `1883` (Não criptografado para dispositivos de baixo recurso)
* **Porta MQTT WebSockets (Next.js Dashboard)**: `8884` (WebSocket Seguro - `wss` para contornar restrições de sandbox de navegadores modernos)
* **URL de Conexão WebSocket**: `wss://broker.hivemq.com:8884/mqtt`

### Interfaces de Dados de Payload Suportadas:

O Dashboard PWA Next.js implementa uma interface híbrida de decodificação de payloads, permitindo o recebimento de dois padrões de mensagens:

#### 1. Payload Estruturado em JSON (Recomendado)
Publicado diretamente no tópico base `mackenzie/mrs/nivel`. É ideal para dispositivos mais robustos com suporte a bibliotecas de serialização.
```json
{
  "id": "Lixeira-01",
  "nivel": 82.5,
  "timestamp": "2026-05-31T23:13:00Z"
}
```
* **id** (String): Identificador único da lixeira na base de dados.
* **nivel** (Float): Valor numérico entre `0` e `100` representando o preenchimento calculado.
* **timestamp** (String ISO 8601): Hora exata de captura da informação pelo microcontrolador.

#### 2. Payload em Texto Bruto (Float/Int - Simplificado)
Publicado em um sub-tópico no padrão `mackenzie/mrs/nivel/{ID_DA_LIXEIRA}` (Ex: `mackenzie/mrs/nivel/Lixeira-02`). O payload de dados contém apenas a representação string do nível decimal:
```text
82.5
```
* **Processamento**: O dashboard do sistema MRS intercepta a mensagem no broker, separa a hierarquia de tópicos pelo caractere `/`, extrai o último termo (`Lixeira-02`) como sendo o ID da lixeira e atribui a leitura correspondente de forma dinâmica no painel.

---

## 6. Conectividade e Controle via Internet (TCP/IP e MQTT)

A integração completa através da Internet do MRS System é sustentada pela robustez e eficiência da pilha TCP/IP combinada às características do MQTT.

### Fluxo de Rede Trás-Firewall (NAT Traversal):
Diferente de sistemas legados de servidores web locais rodando no próprio microcontrolador (onde o ESP32 atua como Web Server local HTTP), o MRS System **não requer IP público estático nem abertura/redirecionamento de portas (port forwarding)** no roteador Wi-Fi onde a lixeira está instalada.
1. O ESP32 conecta-se na rede Wi-Fi interna da residência ou empresa e obtém um IP privado via DHCP.
2. O microcontrolador inicia uma **conexão TCP ativa de saída** direcionada ao broker HiveMQ na porta `1883`.
3. Pelo fato de ser uma conexão de saída, o firewall do roteador local (NAT) permite a passagem do tráfego e mantém a tabela de portas aberta para o retorno das mensagens de controle do broker.
4. O Dashboard do administrador (Next.js), rodando em qualquer localidade do mundo ou hospedado em servidores na nuvem, inicia de forma similar uma conexão ativa de saída segura para a porta `8884` do broker HiveMQ.
5. O Broker MQTT gerencia a ponte lógica de roteamento em nuvem de modo transparente.

### Vantagens do Uso de MQTT sobre TCP/IP para Sistemas IoT:
* **Overhead Mínimo de Protocolo**: Em requisições HTTP tradicionais, cada pacote de transmissão carrega cabeçalhos extensos (cabeçalhos de requisição de cerca de 1 KB contendo cookies, User-Agent, etc.). O cabeçalho de controle fixo de uma mensagem MQTT possui apenas **2 Bytes** de tamanho inicial. Isso reduz drasticamente o consumo de dados da rede Wi-Fi ou celular (caso o ESP32 utilize modems GSM 2G/3G/4G).
* **Desacoplamento Espaço-Temporal**: Os publicadores de dados (ESP32 nas lixeiras) não possuem ciência direta de quem são os consumidores (Dashboard ou script Python), e vice-versa. Se o dashboard for encerrado ou perder a conexão de rede, as lixeiras continuarão reportando suas leituras para a nuvem sem interrupções.
* **Qualidade de Serviço (QoS)**: O protocolo dispõe de políticas nativas de QoS em nível de aplicação para garantir a entrega das medições. Para o projeto, o QoS `0` (entrega rápida sem confirmação persistente) foi definido por ser ideal para leituras frequentes de sensores e economia de buffer de memória RAM do ESP32.
* **Alta Eficiência Energética via Keep-Alive**: Como a conexão TCP é aberta uma única vez no início do loop e mantida aberta utilizando mensagens curtas de confirmação de vida (*Keep-Alive/Ping*), o ESP32 economiza energia por não ter de realizar o aperto de mão de três vias (*Three-Way Handshake*) do TCP a cada nova medição transmitida, o que melhora substancialmente a longevidade operacional de baterias do hardware de campo.

---

## 7. Guia de Reprodução Passo a Passo

Siga as diretrizes abaixo para colocar o sistema inteiro em operação prática:

### Passo 1: Montagem Física do Hardware
1. Realize as conexões elétricas detalhadas no esquema do [Capítulo 3](#3-especificações-de-hardware-e-conexões) utilizando uma protoboard e jumpers.
2. Fixe o sensor HC-SR04 no topo da lixeira de teste, direcionado verticalmente para o fundo do reservatório.
3. Posicione o LED vermelho na tampa superior ou lateral externa para que seja facilmente visível.

### Passo 2: Configuração e Gravação do ESP32 (Firmware)
1. Instale e execute a [Arduino IDE](https://www.arduino.cc/en/software).
2. Adicione suporte para o ESP32: vá em *Arquivo $\rightarrow$ Preferências* e no campo *URLs Adicionais do Gerenciador de Placas* insira:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Vá em *Ferramentas $\rightarrow$ Placa $\rightarrow$ Gerenciador de Placas*, busque por `esp32` (por Espressif Systems) e clique em instalar.
4. No menu *Ferramentas $\rightarrow$ Placa*, selecione o seu modelo específico (ex: `ESP32 Dev Module`).
5. Vá em *Ferramentas $\rightarrow$ Gerenciar Bibliotecas*, busque por `PubSubClient` (por Nick O'Leary) e instale a biblioteca de suporte ao protocolo MQTT.
6. Abra o arquivo [Codigo_EPS32.md](file:///d:/coisas/Sistemas/ProjLixeiraInteligente/Codigo_EPS32.md), copie o código fonte C++ fornecido e cole em um novo sketch na IDE.
7. Substitua as credenciais de Wi-Fi nas linhas:
   ```cpp
   const char* ssid = "MUDE_PARA_O_NOME_DO_SEU_WIFI";
   const char* password = "MUDE_PARA_A_SENHA_DO_SEU_WIFI";
   ```
8. Defina a altura total de sua lixeira em centímetros na linha:
   ```cpp
   const float PROFUNDIDADE_DA_LIXEIRA_CM = 50.0; // Exemplo: 50.0 cm
   ```
9. Conecte o ESP32 ao computador via USB, selecione a porta de comunicação correspondente em *Ferramentas $\rightarrow$ Porta* e clique no botão **Carregar** (Upload).

### Passo 3: Execução do Dashboard Web
1. Garanta que o [Node.js](https://nodejs.org/) (versão 18.x ou superior) está instalado no computador.
2. Abra um terminal na pasta raiz do projeto.
3. Instale os pacotes de dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor local de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Abra o navegador e acesse: [http://localhost:3000](http://localhost:3000). A aplicação conectará dinamicamente ao Broker MQTT HiveMQ via WSS.

### Passo 4: Execução do Monitor Python
1. Abra um console do sistema e instale o pacote de suporte MQTT para Python:
   ```bash
   pip install paho-mqtt
   ```
2. No diretório do projeto, execute o script:
   ```bash
   python monitor_lixeira.py
   ```
3. A partir deste momento, qualquer leitura simulada no Dashboard ou física disparada pelo ESP32 será exibida formatada e com faixas de criticidade no seu terminal em tempo real.
