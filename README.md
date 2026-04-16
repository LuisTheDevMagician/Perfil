# 🎮 Jogo Perfil - Quiz Multiplayer

Jogo web multiplayer local estilo "Perfil" (jogo de adivinhação com dicas progressivas) com arquitetura escalável e separada em **Backend** (Node.js/Socket.io) e **Frontend** (Next.js). Suporta até 11 jogadores simultâneos em tempo real via rede local.

---

## 📋 Sobre o Jogo

O **Jogo Perfil** é um quiz de adivinhação divertido e educacional onde:
- Uma **ENTIDADE** (resposta correta) precisa ser descoberta através de **10 DICAS** progressivas.
- Há um **HOST** (mestre do jogo) que vê todas as informações da carta (dicas, resposta, controle do jogo).
- Os demais **JOGADORES** veem apenas as dicas sendo reveladas e a pontuação em jogo em tempo real.

### 🆕 Mecânicas e Regras Atualizadas
- **Pontos Dinâmicos Decrescentes:** A carta começa valendo **10 pontos** de Acerto (mesmo que se revele a dica 0 e a dica 1). A cada dica adicional revelada pelo mestre (da 2ª à 10ª), a pontuação decresce sucessivamente até o piso natural de **1 ponto**.
- **O Vencedor Preserva a Vez:** O jogador que **acerta** a resposta além de faturar a atual contagem de pontos ganha o direito de manter sua "Vez" para a solicitação da carta e de dicas da rodada seguinte! O turno só é passado se o jogador errar uma alternativa ou se resolver pular a vez.
- **Ninguém Acertou ("Alerta Amarelo"):** Se todas as dicas foram expostas ou a paciência da mesa cedeu e ninguém adivinhou a Entidade, o HOST pode resolver a carta. Um modal de alerta amarelo cobrirá todas as telas revelando a reposta não preenchida.

---

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS 4, Material UI / Icons.
- **Backend**: Node.js, Socket.io (WebSockets).
- **Gerenciador de Pacotes Oficial**: Bun.

---

## 📦 Instalação e Execução (Início Rápido)

Antes unificado, agora o projeto exige dois instanciamentos paralelos em terminais para funcionar (o Servidor de Dados e o Servidor de Tela).

### Pré-requisitos
- Node.js 20+ instalado
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

- **A tela fica em um ciclo "Aguardando Conexão... / Conectando" e não entra na Home:** O Backend Socket.io desligou, resetou ou sofreu erro, cheque o console rodando em seu Terminal de Backend.
- **Eu Consigo mas ninguém mais conecta:** O Firewall da máquina hospedeira rejeitou conexões na Porta 3000 ou 4000. Desative proteção ou crie Regra de Exceção de Tráfego de Entrada. 

---

## 📄 Licença e Tipificação

Este projeto é ofertado segundo a rigorosa padronização internacional Creative Commons **Attribution-NonCommercial 4.0 International Public License (CC BY-NC 4.0)**. O material, fonte, arquitetura e propósitos garantem utilização didática, livre estudo, seminários e testes. O uso voltado a meios de arrecadação financeira é defeso e vetado.

Você pode conferir detalhes simplificados das normativas no arquivo formal `LICENSE` repousado na respectiva folha base do projeto.

---

## 👨‍💻 Feito para Divertir

*(Desenvolvido em Next.js | Dezembro 2025/Abril 2026 - Versão V2 MonoSeparada).*
Boa sorte e que desbanquem logo essa Entidade! 🏆🎮# 🎮 Jogo Perfil - Quiz Multiplayer

Jogo web multiplayer local estilo "Perfil" (jogo de adivinhação com dicas progressivas) desenvolvido com Next.js, TypeScript, Tailwind CSS e Socket.io. Suporta até **11 jogadores simultâneos** em tempo real via localhost.

---

## 📋 Sobre o Jogo

O **Jogo Perfil** é um quiz de adivinhação onde:
- Uma **ENTIDADE** (resposta correta) precisa ser descoberta através de **10 DICAS** progressivas
- Há um **HOST** (mestre do jogo) que vê todas as informações da carta
- Os demais **JOGADORES** veem apenas as dicas sendo reveladas
- Cada jogador pode tentar responder a qualquer momento
- O HOST valida as respostas e define quantos pontos o jogador ganha

---

## 🎯 Cartas do Jogo

O jogo contém 10 cartas sobre temas de **UX/UI e Tecnologia**:

1. **Experiência do Usuário (UX)**
2. **Interface do Usuário (UI)**
3. **Ambiente Inteligente**
4. **Casa Inteligente (Smart Home)**
5. **Carro Inteligente**
6. **Dispositivo Vestível (Wearable)**
7. **Cidade Inteligente (Smart City)**
8. **Acessibilidade Digital**
9. **Realidade Aumentada (AR)**
10. **Usabilidade**

---

## 🚀 Tecnologias Utilizadas

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS 4
- **Multiplayer**: Socket.io (WebSockets)
- **Runtime**: Node.js

---

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 20+ instalado
- npm ou yarn

### Passo 1: Instalar dependências

```bash
npm install
```

### Passo 2: Rodar o servidor

```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

---

## 🎲 Como Jogar

### 1. **LOBBY**

1. Abra `http://localhost:3000` no navegador
2. Digite seu nome/apelido e clique em **"Entrar no Lobby"**
3. O **primeiro jogador** que entrar será automaticamente o **HOST** 👑
4. Outros jogadores podem entrar acessando o mesmo endereço (mesma máquina em abas diferentes ou dispositivos na mesma rede)
5. Cada jogador clica em **"Rolar Dados"** 🎲 para definir a ordem de jogo
6. O HOST pode clicar em **"Definir Ordem de Jogo"** após todos rolarem
7. O HOST clica em **"Iniciar Partida"** para começar o jogo

### 2. **DURANTE O JOGO**

#### Visão do HOST 👑:
- Vê a **carta completa**: nome da entidade + todas as 10 dicas
- Pode clicar em **"Revelar Dica"** para mostrar a próxima dica para todos
- Recebe notificações de tentativas de resposta dos jogadores
- Valida se a resposta está **Correta** ✓ ou **Errada** ✗
- Define **quantas casas** (pontos) o jogador que acertou deve andar
- Controla o fluxo do jogo

#### Visão dos JOGADORES:
- Veem apenas as **dicas reveladas** (as outras ficam bloqueadas 🔒)
- Na **sua vez**, podem clicar em **"Revelar Próxima Dica"**
- **Qualquer jogador** pode digitar e enviar resposta a qualquer momento
- O HOST decide se está certo ou errado

### 3. **PLACAR**
- Todos veem o placar em tempo real
- Jogador da vez é destacado com ▶️
- Pontuação atualiza automaticamente quando alguém acerta

### 4. **FIM DO JOGO**
- Após todas as 10 cartas serem usadas, aparece a tela de **"Fim de Jogo"** 🏆
- Mostra o **ranking final** com todos os jogadores e suas pontuações
- O HOST pode clicar em **"Jogar Novamente"** para reiniciar

---

## 🌐 Jogar em Múltiplos Dispositivos (mesma rede)

### Windows
1. Descubra seu IP local: `ipconfig` no PowerShell (procure por "IPv4")
2. Compartilhe o endereço: `http://SEU_IP:3000`
3. Outros dispositivos acessam esse endereço na mesma rede Wi-Fi

### macOS/Linux
1. Descubra seu IP: `ifconfig` ou `ip addr`
2. Compartilhe: `http://SEU_IP:3000`

**Exemplo**: Se seu IP é `192.168.1.100`, outros acessam `http://192.168.1.100:3000`

---

## 📂 Estrutura do Projeto

```
quiz/
├── server.ts                 # Servidor customizado com Socket.io
├── package.json              # Dependências do projeto
├── tsconfig.json             # Configuração TypeScript
├── next.config.ts            # Configuração Next.js
├── tailwind.config.js        # Configuração Tailwind CSS
│
├── app/
│   ├── layout.tsx            # Layout raiz
│   ├── page.tsx              # Página de Lobby (tela inicial)
│   ├── game/
│   │   └── page.tsx          # Página do Jogo (partida)
│   └── globals.css           # Estilos globais
│
└── lib/
    └── cards.ts              # Cartas do jogo (10 entidades + dicas)
```

---

## 🔧 Funcionalidades Implementadas

### ✅ Lobby
- Entrada de jogadores com nome personalizado
- Detecção automática do HOST (primeiro jogador)
- Sistema de rolagem de dados (1-6)
- Definição de ordem de jogo automaticamente
- Lista de jogadores em tempo real
- Limite de 11 jogadores simultâneos

### ✅ Jogo
- Visão diferenciada para HOST e JOGADORES
- Revelação progressiva de dicas
- Sincronização em tempo real via WebSockets
- Sistema de tentativas de resposta
- Validação de respostas pelo HOST
- Controle de pontuação customizável
- Placar atualizado em tempo real
- Indicador visual de "vez do jogador"

### ✅ Fim de Jogo
- Ranking final automaticamente ordenado
- Destaque para o vencedor 🥇
- Opção de reiniciar o jogo (HOST)

### ✅ Design
- Responsivo (mobile-first)
- Cores vibrantes e modernas
- Animações suaves
- Feedback visual claro
- Interface intuitiva

---

## 🎨 Paleta de Cores

- **Primária**: Roxo (#9333EA, #A855F7)
- **Secundária**: Rosa (#EC4899)
- **Accent**: Laranja (#FB923C)
- **Sucesso**: Verde (#16A34A)
- **Erro**: Vermelho (#DC2626)
- **Info**: Azul (#2563EB)
- **Neutros**: Cinza (50-900)

---

## 🐛 Resolução de Problemas

### O jogo não conecta
- Verifique se está acessando `http://localhost:3000`
- Confirme que o servidor está rodando (`npm run dev`)
- Verifique o console do navegador para erros

### Outros dispositivos não conseguem entrar
- Certifique-se de que todos estão na **mesma rede Wi-Fi**
- Confirme o IP correto com `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
- Desabilite firewall temporariamente se necessário
- Use o IP ao invés de "localhost" nos outros dispositivos

### Dicas não aparecem
- Apenas o **jogador da vez** ou o **HOST** podem revelar dicas
- Aguarde sua vez ou peça ao HOST para revelar

---

## 📝 Notas Técnicas

### Sincronização em Tempo Real
O jogo usa **Socket.io** para sincronização em tempo real entre todos os clientes. Eventos principais:
- `join-lobby`: Jogador entra no lobby
- `roll-dice`: Rolar dados
- `start-game`: Iniciar partida
- `reveal-clue`: Revelar próxima dica
- `submit-answer`: Enviar resposta
- `validate-answer`: HOST valida resposta
- `game-ended`: Fim do jogo

### Estado do Jogo
O estado é mantido **no servidor** (`server.ts`) e sincronizado com todos os clientes via WebSockets, garantindo consistência.

### Escalabilidade
Atualmente suporta até **11 jogadores** conforme requisito. Para aumentar, ajuste a verificação em `server.ts` linha 58.

---

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas! Este projeto foi desenvolvido como um jogo educacional para seminários e apresentações sobre UX/UI.

---

## 📄 Licença

Este projeto é de código aberto e está disponível para uso educacional e não comercial.

---

## 👨‍💻 Desenvolvido por

GitHub Copilot + Next.js + Socket.io

**Versão**: 1.0.0  
**Data**: Dezembro 2025

---

## 🎉 Divirta-se jogando!

Boa sorte e que vença o melhor! 🏆🎮

