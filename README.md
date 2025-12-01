# 🎮 Jogo Perfil - Quiz Multiplayer

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

