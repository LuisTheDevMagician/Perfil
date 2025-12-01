// Servidor customizado com Socket.io para sincronização em tempo real
// Integra Next.js com WebSockets para suportar até 11 jogadores simultâneos

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { gameCards } from './lib/cards';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Aceita conexões de qualquer IP na rede
const port = 3000;

// Preparar aplicação Next.js com Turbopack
const app = next({ 
  dev, 
  hostname, 
  port,
  turbo: true, // Habilita Turbopack para builds mais rápidos
});
const handle = app.getRequestHandler();

// Tipos e interfaces
interface Player {
  id: string;
  name: string;
  diceRoll: number | null;
  score: number;
  isHost: boolean;
}

interface Answer {
  playerId: string;
  playerName: string;
  answer: string;
  timestamp: number;
}

interface GameState {
  players: Player[];
  gameStarted: boolean;
  currentCardIndex: number;
  revealedClueIndices: number[]; // Array com índices das dicas reveladas
  currentPlayerIndex: number;
  answers: Answer[];
  gameEnded: boolean;
  hasRevealedThisTurn: boolean; // Jogador já revelou uma dica neste turno
}

// Estado do jogo (em memória)
const gameState: GameState = {
  players: [],
  gameStarted: false,
  currentCardIndex: 0,
  revealedClueIndices: [],
  currentPlayerIndex: 0,
  answers: [],
  gameEnded: false,
  hasRevealedThisTurn: false,
};

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Configurar Socket.io
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Eventos do Socket.io
  io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);

    // Jogador entra no lobby
    socket.on('join-lobby', (playerName: string) => {
      // Limitar a 11 jogadores
      if (gameState.players.length >= 11) {
        socket.emit('lobby-full');
        return;
      }

      // Verificar se já existe jogador com mesmo nome
      const existingPlayer = gameState.players.find(p => p.name === playerName);
      if (existingPlayer) {
        socket.emit('name-taken');
        return;
      }

      // Adicionar jogador
      const isHost = gameState.players.length === 0;
      const newPlayer: Player = {
        id: socket.id,
        name: playerName,
        diceRoll: isHost ? 0 : null, // Host não precisa rolar dados
        score: 0,
        isHost,
      };

      gameState.players.push(newPlayer);

      // Enviar confirmação ao jogador
      socket.emit('joined-lobby', { player: newPlayer, players: gameState.players });

      // Notificar todos os outros jogadores
      socket.broadcast.emit('player-joined', gameState.players);

      console.log(`${playerName} entrou no lobby. Total de jogadores: ${gameState.players.length}`);
    });

    // Solicitar estado atual do jogo
    socket.on('request-game-state', () => {
      console.log('Cliente solicitou estado do jogo:', socket.id);
      console.log('gameState.gameStarted:', gameState.gameStarted);
      console.log('gameState.currentCardIndex:', gameState.currentCardIndex);
      
      if (gameState.gameStarted) {
        // Enviar estado atual do jogo
        socket.emit('game-started', {
          currentCard: gameCards[gameState.currentCardIndex],
          currentPlayerIndex: gameState.currentPlayerIndex,
          players: gameState.players,
        });

        // Se há dicas reveladas, enviar também
        if (gameState.revealedClueIndices.length > 0) {
          socket.emit('clue-revealed', {
            revealedClueIndices: gameState.revealedClueIndices,
            currentPlayerIndex: gameState.currentPlayerIndex,
          });
        }

        console.log(`Estado do jogo enviado para ${socket.id}`);
      } else {
        console.log('Jogo ainda não iniciado, não enviando estado');
      }
    });

    // Rolar dados
    socket.on('roll-dice', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || player.isHost) return; // Host não rola dados

      // Gerar número aleatório de 1 a 100
      const diceRoll = Math.floor(Math.random() * 100) + 1;
      player.diceRoll = diceRoll;

      // Notificar todos os jogadores
      io.emit('dice-rolled', { playerId: socket.id, playerName: player.name, diceRoll });
      console.log(`${player.name} rolou ${diceRoll}`);
    });

    // Definir ordem de jogo (baseado nos dados)
    socket.on('set-play-order', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || !player.isHost) return;

      // Separar host e jogadores
      const host = gameState.players.find(p => p.isHost);
      const nonHostPlayers = gameState.players.filter(p => !p.isHost);
      
      // Ordenar apenas os não-hosts por resultado dos dados (MAIOR para MENOR)
      nonHostPlayers.sort((a, b) => {
        if (a.diceRoll === null) return 1;
        if (b.diceRoll === null) return -1;
        return (b.diceRoll || 0) - (a.diceRoll || 0); // Maior primeiro
      });
      
      // Host sempre é o primeiro, depois os jogadores ordenados
      gameState.players = host ? [host, ...nonHostPlayers] : nonHostPlayers;

      // Notificar todos
      io.emit('play-order-set', gameState.players);
      console.log('Ordem de jogo definida:', gameState.players.map(p => `${p.name}(${p.isHost ? 'HOST' : p.diceRoll})`));
    });

    // Iniciar partida
    socket.on('start-game', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || !player.isHost) return;

      // Resetar estado do jogo
      gameState.gameStarted = true;
      gameState.currentCardIndex = 0;
      gameState.revealedClueIndices = [];
      gameState.hasRevealedThisTurn = false;
      // Começar sempre do índice 1 (primeiro jogador não-host, pois 0 é sempre o host)
      gameState.currentPlayerIndex = 1;
      gameState.answers = [];
      gameState.gameEnded = false;

      // Enviar estado inicial do jogo para TODOS os clientes
      io.emit('game-started', {
        currentCard: gameCards[0],
        currentPlayerIndex: gameState.currentPlayerIndex,
        players: gameState.players,
      });

      console.log('Jogo iniciado! Primeiro jogador:', gameState.players[1]?.name);
    });

    // Revelar dica específica (apenas o jogador da vez) - NÃO passa a vez
    socket.on('reveal-clue', (clueIndex: number) => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || player.isHost) {
        console.log(`❌ Revelação negada: ${!player ? 'jogador não encontrado' : 'host não pode revelar'}`);
        return;
      }

      // APENAS o jogador da vez pode revelar
      const isCurrentPlayer = gameState.players[gameState.currentPlayerIndex]?.id === socket.id;
      if (!isCurrentPlayer) {
        console.log(`❌ Revelação negada: não é a vez de ${player.name}`);
        return;
      }

      // BLOQUEAR se já revelou uma dica neste turno
      if (gameState.hasRevealedThisTurn) {
        console.log(`🚫 BLOQUEADO: ${player.name} já revelou uma dica neste turno. Responda ou passe a vez!`);
        return;
      }

      // Validar índice da dica
      if (clueIndex < 0 || clueIndex >= 10) {
        console.log(`❌ Índice de dica inválido: ${clueIndex}`);
        return;
      }

      // Verificar se a dica já foi revelada
      if (gameState.revealedClueIndices.includes(clueIndex)) {
        console.log(`❌ Dica ${clueIndex + 1} já foi revelada`);
        return;
      }

      // Revelar APENAS a dica específica
      gameState.revealedClueIndices.push(clueIndex);
      gameState.hasRevealedThisTurn = true;

      console.log(`✅ Dica ${clueIndex + 1} revelada por ${player.name} - Bloqueado até responder/passar`);

      // Notificar todos
      io.emit('clue-revealed', {
        revealedClueIndices: gameState.revealedClueIndices,
        currentPlayerIndex: gameState.currentPlayerIndex,
      });
    });

    // Passar a vez (botão "Passar a Vez")
    socket.on('pass-turn', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || player.isHost) return;

      // APENAS o jogador da vez pode passar a vez
      const isCurrentPlayer = gameState.players[gameState.currentPlayerIndex]?.id === socket.id;
      if (!isCurrentPlayer) return;

      // Revelar próxima dica sequencial E passar a vez
      if (gameState.revealedClueIndices.length < 10) {
        // Encontrar próxima dica não revelada
        let nextClue = 0;
        while (nextClue < 10 && gameState.revealedClueIndices.includes(nextClue)) {
          nextClue++;
        }
        if (nextClue < 10) {
          gameState.revealedClueIndices.push(nextClue);
        }
      }

      // Resetar flag de revelação (novo turno)
      gameState.hasRevealedThisTurn = false;

      // Passar para o próximo jogador
      gameState.currentPlayerIndex++;
      if (gameState.currentPlayerIndex >= gameState.players.length) {
        gameState.currentPlayerIndex = 1; // Volta pro primeiro jogador (não pro host)
      }

      // Notificar todos
      io.emit('clue-revealed', {
        revealedClueIndices: gameState.revealedClueIndices,
        currentPlayerIndex: gameState.currentPlayerIndex,
      });

      console.log(`Próxima dica revelada (total: ${gameState.revealedClueIndices.length}). Próximo jogador: ${gameState.players[gameState.currentPlayerIndex]?.name}`);
    });

    // Enviar resposta
    socket.on('submit-answer', (answer: string) => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || player.isHost) {
        console.log(`Resposta ignorada: ${player?.isHost ? 'host não pode responder' : 'jogador não encontrado'}`);
        return;
      }

      // Verificar se já enviou resposta
      const alreadyAnswered = gameState.answers.some(a => a.playerId === socket.id);
      if (alreadyAnswered) {
        console.log(`⚠️ ${player.name} (${socket.id}) já respondeu, ignorando resposta duplicada`);
        return;
      }

      const newAnswer: Answer = {
        playerId: socket.id,
        playerName: player.name,
        answer,
        timestamp: Date.now(),
      };

      gameState.answers.push(newAnswer);
      console.log(`✓ ${player.name} respondeu: "${answer}" (Total de respostas: ${gameState.answers.length})`);

      // Notificar apenas o host
      const host = gameState.players.find(p => p.isHost);
      if (host) {
        io.to(host.id).emit('new-answer', newAnswer);
        console.log(`  → Resposta enviada para o host ${host.name}`);
      }
    });

    // Host valida resposta
    socket.on('validate-answer', ({ answerId, isCorrect, casesToMove }: { answerId: number, isCorrect: boolean, casesToMove: number }) => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || !player.isHost) return;

      const answer = gameState.answers[answerId];
      if (!answer) return;

      if (isCorrect) {
        // Atualizar pontuação do jogador
        const answerPlayer = gameState.players.find(p => p.id === answer.playerId);
        if (answerPlayer) {
          answerPlayer.score += casesToMove;
        }

        // Revelar a resposta correta
        const currentCard = gameCards[gameState.currentCardIndex];
        io.emit('answer-correct', {
          playerName: answer.playerName,
          correctAnswer: currentCard.nome,
          casesToMove,
          players: gameState.players,
        });

        console.log(`${answer.playerName} acertou! Andou ${casesToMove} casas.`);

        // Passar para a próxima carta após 3 segundos
        setTimeout(() => {
          gameState.currentCardIndex++;
          gameState.revealedClueIndices = [];
          gameState.hasRevealedThisTurn = false;
          gameState.currentPlayerIndex = 1; // Volta pro primeiro jogador (não pro host)
          gameState.answers = []; // Limpar respostas na próxima carta

          // Verificar se o jogo acabou
          if (gameState.currentCardIndex >= gameCards.length) {
            gameState.gameEnded = true;
            
            // Ordenar jogadores por pontuação
            const ranking = [...gameState.players].sort((a, b) => b.score - a.score);
            
            io.emit('game-ended', { ranking });
            console.log('Jogo finalizado!');
          } else {
            // Enviar próxima carta
            io.emit('next-card', {
              currentCard: gameCards[gameState.currentCardIndex],
              currentPlayerIndex: gameState.currentPlayerIndex,
            });
            console.log(`Nova carta: ${gameCards[gameState.currentCardIndex].nome}`);
          }
        }, 3000);
      } else {
        // Resposta incorreta - passar a vez para o próximo jogador
        gameState.hasRevealedThisTurn = false; // Resetar para novo turno
        gameState.currentPlayerIndex++;
        if (gameState.currentPlayerIndex >= gameState.players.length) {
          gameState.currentPlayerIndex = 1; // Volta pro primeiro jogador (não pro host)
        }
        
        io.emit('answer-incorrect', { 
          playerName: answer.playerName,
          nextPlayerIndex: gameState.currentPlayerIndex
        });
        console.log(`${answer.playerName} errou. Vez de: ${gameState.players[gameState.currentPlayerIndex]?.name}`);
      }

      // Remover resposta validada do array
      gameState.answers.splice(answerId, 1);
      
      // Notificar host sobre atualização da lista
      const host = gameState.players.find(p => p.isHost);
      if (host) {
        io.to(host.id).emit('answers-updated', gameState.answers);
      }
    });

    // Host revela a resposta (quando todas dicas foram mostradas e ninguém acertou)
    socket.on('reveal-answer', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || !player.isHost) return;

      // Verificar se todas as dicas foram reveladas
      if (gameState.revealedClueIndices.length < 10) return;

      const currentCard = gameCards[gameState.currentCardIndex];
      
      // Revelar resposta sem dar pontos
      io.emit('answer-revealed', {
        correctAnswer: currentCard.nome
      });

      console.log(`Host revelou a resposta: ${currentCard.nome}`);

      // Passar para a próxima carta após 3 segundos
      setTimeout(() => {
        gameState.currentCardIndex++;
        gameState.revealedClueIndices = [];
        gameState.hasRevealedThisTurn = false;
        gameState.currentPlayerIndex = 1;
        gameState.answers = [];

        // Verificar se o jogo acabou
        if (gameState.currentCardIndex >= gameCards.length) {
          gameState.gameEnded = true;
          const ranking = [...gameState.players].sort((a, b) => b.score - a.score);
          io.emit('game-ended', { ranking });
          console.log('Jogo finalizado!');
        } else {
          // Enviar próxima carta
          io.emit('next-card', {
            currentCard: gameCards[gameState.currentCardIndex],
            currentPlayerIndex: gameState.currentPlayerIndex,
          });
          console.log(`Nova carta: ${gameCards[gameState.currentCardIndex].nome}`);
        }
      }, 3000);
    });

    // Desconexão
    socket.on('disconnect', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (player) {
        console.log(`${player.name} desconectou`);
        
        // Remover jogador
        gameState.players = gameState.players.filter(p => p.id !== socket.id);

        // Se era o host, passar para o próximo
        if (player.isHost && gameState.players.length > 0) {
          gameState.players[0].isHost = true;
        }

        // Notificar todos
        io.emit('player-left', { playerId: socket.id, players: gameState.players });
      }
    });

    // Reiniciar jogo
    socket.on('restart-game', () => {
      const player = gameState.players.find(p => p.id === socket.id);
      if (!player || !player.isHost) return;

      // Resetar tudo
      gameState.players.forEach(p => {
        p.score = 0;
        p.diceRoll = null;
      });
      gameState.gameStarted = false;
      gameState.currentCardIndex = 0;
      gameState.revealedClueIndices = [];
      gameState.hasRevealedThisTurn = false;
      gameState.currentPlayerIndex = 0;
      gameState.answers = [];
      gameState.gameEnded = false;

      // Voltar ao lobby
      io.emit('game-restarted', gameState.players);
      console.log('Jogo reiniciado!');
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> Servidor rodando em:`);
    console.log(`>   Local:    http://localhost:${port}`);
    console.log(`>   Rede:     Acesse pelo IP da sua máquina na porta ${port}`);
    console.log(`> Jogo Perfil - Suporta até 11 jogadores simultâneos`);
  });
});
