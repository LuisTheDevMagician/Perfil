# 🎮 Jogo Perfil - Quiz Multiplayer

Jogo web multiplayer local estilo "Perfil" (jogo de adivinhação com dicas progressivas) com arquitetura escalável e separada em **Backend** (Elysia.js/Elyia-WS) e **Frontend** (Next.js). Suporta até 11 jogadores simultâneos em tempo real via rede local.

---

## 📋 Sobre o Jogo

O **Jogo Perfil** é um quiz de adivinhação divertido e educacional onde:
- Uma **ENTIDADE: Carta** A resposta correta precisa ser descoberta através de **10 DICAS** progressivas.
- Há um **HOST** (mestre do jogo) que vê todas as informações da carta (dicas, resposta, controle do jogo).
- Os demais **JOGADORES** veem apenas as dicas sendo reveladas e a pontuação em jogo em tempo real.

### 🆕 Mecânicas e Regras Atualizadas
- **Pontos Dinâmicos Decrescentes:** A carta começa valendo **10 pontos** de Acerto (mesmo que se revele a dica 0 e a dica 1). A cada dica adicional revelada pelo mestre (da 2ª à 10ª), a pontuação decresce sucessivamente até o piso natural de **1 ponto**.
- **O Vencedor Preserva a Vez:** O jogador que **acerta** a resposta além de faturar a atual contagem de pontos ganha o direito de manter sua "Vez" para a solicitação da carta e de dicas da rodada seguinte! O turno só é passado se o jogador errar uma alternativa ou se resolver pular a vez.
- **Ninguém Acertou ("Alerta Amarelo"):** Se todas as dicas foram expostas ou a paciência da mesa cedeu e ninguém adivinhou a Entidade, o HOST pode resolver a carta. Um modal de alerta amarelo cobrirá todas as telas revelando a reposta não preenchida.

---

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS 4, Material UI / Icons.
- **Backend**: Bun, Elysia.js, Elysia WebSocket.
- **Gerenciador de Pacotes Oficial**: Bun.

---

## 📦 Instalação e Execução (Início Rápido)

Antes unificado, agora o projeto exige dois instanciamentos paralelos em terminais para funcionar (o Servidor de Dados e o Servidor de Tela).

### Pré-requisitos
- [Bun](https://bun.sh/) instalado globalmente 

### Passo 1: Iniciar o Servidor (Backend)
Em seu terminal raiz do projeto, acesse a pasta `backend`, instale as dependências e inicie-o:
```bash
cd backend
bun install
bun run dev
```

### Passo 2: Iniciar a Interface (Frontend)
Em uma aba separada / segundo terminal, navegue até a pasta `frontend`, proceda à instalação das dependências e inicie a build:
```bash
cd frontend
bun install
bun run dev
```
Após estar rodando com sucesso, o endereço para acessar o app via navegador do desenvolvedor será em: **http://localhost:3000**

---

## 🌐 Jogando com Amigos (Em Rede Local / Wi-Fi)

A beleza do jogo é compartilhar as telas dos jogadores num ambiente interno ou laboratório. Você pode rodar tudo no seu PC (Mestre) e as pessoas no celular via Browser.

1. **Atenção Padrão:** Certifique-se de que nenhum roteador isola aparelhos nem possua bloqueio de rede para os convidados. Todos na mesma Wi-Fi!
2. **Descubra o IP da Máquina Principal:**
   - **Windows**: Digite `ipconfig` no Prompt de Comando/PowerShell e busque pela etiqueta "Endereço IPv4" da placa em atividade (Wireless LAN / Ethernet).
   - **Mac/Linux**: Digite `ifconfig` ou `ip addr` ou `ip a` no terminal bash/zsh. 
3. **Compartilhe o Endereço:**
   Se o seu código for `192.168.1.100`, todo e qualquer participante só precisará digitar **`http://192.168.1.100:3000`** e cairá no Lobby do jogo.
 *(Nunca distribua no grupo o texto `"localhost"`, pois esta rede é estritamente pessoal ao seu computador)*

---

## 🎲 Resumo Lógico da Mesa

### 1. Preparação (Lobby)
- O **primeiro competidor** que acessa a página e digita um nick entra garantindo a coroa de **HOST** 👑 permanente.
- Todos os membros que ingressarem deverão jogar os "Dados" 🎲 ali desenhados.
- Ao final dos membros, o HOST clica na autorização para formar a ordem e arrasta todo o grupo ao salão de Início.

### 2. A Partida em Si
- Os **JOGADORES** observam quantas dezenas de casas podem evoluir no lance (sinalizado visualmente pela box Pontos em Jogo). Quando o "Sua Vez" brilhar, podem requisitar liberação de dicas.
- Qualquer indivíduo tem capacidade de arriscar um pitaco **A qualquer exato momento** no campo Resposta!
- O **HOST** escuta a notificação sonora da tentativa enviada e usa os botões para validar e sinalizar visualmente: Acerto (Verde), Errou (Vermelho) ou Falha da Tenda (Amarelo).

### 3. Vitória
- Ao bater o limite estipulado de rodadas de baralhos, o App entra em estado de Fim de Jogo.
- Coroações no Ranking. O HOST reseta.

---

## 🐛 Resolução de Problemas / Troubleshooting

- **A tela fica em um ciclo "Aguardando Conexão... / Conectando" e não entra na Home:** O Backend Bun/Elysia desligou, resetou ou sofreu erro, cheque o console rodando em seu Terminal de Backend.
- **Eu Consigo mas ninguém mais conecta:** O Firewall da máquina hospedeira rejeitou conexões na Porta 3000 ou 4000. Desative proteção ou crie Regra de Exceção de Tráfego de Entrada. 

---

## 📄 Licença e Tipificação

Este projeto é ofertado segundo a rigorosa padronização internacional Creative Commons **Attribution-NonCommercial 4.0 International Public License (CC BY-NC 4.0)**. O material, fonte, arquitetura e propósitos garantem utilização didática, livre estudo, seminários e testes. O uso voltado a meios de arrecadação financeira é defeso e vetado.

Você pode conferir detalhes simplificados das normativas no arquivo formal `LICENSE` repousado na respectiva folha base do projeto.

---

## 👨‍💻 Feito para Divertir

*(Desenvolvido em Next.js | Dezembro 2025/Abril 2026 - Versão V2 MonoSeparada).*
Boa sorte e que desbanquem logo essa Entidade! 🏆🎮

---

## Telas do jogo

### Tela Inicial PC e Smartphone

<img width="1920" height="889" alt="image" src="https://github.com/user-attachments/assets/2adb9b75-f1d4-43c6-ac64-a8ca6bd7a1a9" />

<img width="402" height="804" alt="image" src="https://github.com/user-attachments/assets/e8ae13b4-fb93-4269-af6a-249511e7dc28" />


### Tela do Lobby PC e Smartphone - Visão Host

<img width="1915" height="891" alt="image" src="https://github.com/user-attachments/assets/74c4ed73-d3b7-4d37-bce8-1b6299931cf7" />


<img width="402" height="804" alt="image" src="https://github.com/user-attachments/assets/bf4a9a00-a84b-485d-89c0-fa7b971b5273" />


### Tela do Lobby PC e Smartphone - Visão Jogador

<img width="1915" height="891" alt="image" src="https://github.com/user-attachments/assets/cf306523-63a4-4f60-bd57-72b38147a0c0" />

<img width="402" height="811" alt="image" src="https://github.com/user-attachments/assets/73bd58a5-8840-4a74-b8ce-765a4857f21a" />

### Tela do jogo PC e Smartphone - Visão Host

<img width="405" height="808" alt="image" src="https://github.com/user-attachments/assets/3581d56b-d6a6-4b5e-b4c8-e293a0df845c" /> <img width="405" height="808" alt="image" src="https://github.com/user-attachments/assets/850777a8-b409-4d7c-bbf5-c5c403bb6623" />
















