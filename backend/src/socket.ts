import { Server as SocketIOServer } from 'socket.io';
import { gerenciadorJogo } from './game';
import { gameCards } from './models';

let io: SocketIOServer;

export function initSocket(httpServer: any) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    socket.on('join-lobby', (playerName: string) => {
      const sessao = gerenciadorJogo.buscarSessaoAtiva();
      
      if (!sessao) {
        gerenciadorJogo.criarSessao(playerName);
      }

      const jogador = gerenciadorJogo.adicionarJogador(socket.id, playerName);
      
      if (!jogador) {
        socket.emit('lobby-full');
        return;
      }

      socket.emit('joined-lobby', { 
        player: mapJogadorParaFrontend(jogador), 
        players: gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend)
      });

      socket.broadcast.emit('player-joined', gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend));
    });

    socket.on('request-game-state', () => {
      if (gerenciadorJogo.getJogoIniciado()) {
        socket.emit('game-started', {
          currentCard: gerenciadorJogo.getCartaAtual(),
          currentPlayerIndex: getIndiceJogadorTurno(),
          players: gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend),
        });

        if (gerenciadorJogo.getDicasReveladas().length > 0) {
          socket.emit('clue-revealed', {
            revealedClueIndices: gerenciadorJogo.getDicasReveladas(),
            currentPlayerIndex: getIndiceJogadorTurno(),
          });
        }
      }
    });

    socket.on('roll-dice', () => {
      const diceRoll = Math.floor(Math.random() * 100) + 1;
      gerenciadorJogo.atualizarRolagemDado(socket.id, diceRoll);
      
      io.emit('dice-rolled', { 
        playerId: socket.id, 
        playerName: gerenciadorJogo.getJogadorPorSocket(socket.id)?.nome_jogador, 
        diceRoll 
      });
    });

    socket.on('set-play-order', () => {
      const jogador = gerenciadorJogo.getJogadorPorSocket(socket.id);
      if (!jogador || !jogador.e_host) return;

      gerenciadorJogo.ordenarJogadores();
      io.emit('play-order-set', gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend));
    });

    socket.on('start-game', () => {
      const jogador = gerenciadorJogo.getJogadorPorSocket(socket.id);
      if (!jogador || !jogador.e_host) return;

      gerenciadorJogo.iniciarJogo();
      
      io.emit('game-started', {
        currentCard: gerenciadorJogo.getCartaAtual(),
        currentPlayerIndex: getIndiceJogadorTurno(),
        players: gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend),
      });
    });

    socket.on('reveal-clue', (clueIndex: number) => {
      const sucesso = gerenciadorJogo.revelarDica(socket.id, clueIndex);
      if (sucesso) {
        io.emit('clue-revealed', {
          revealedClueIndices: gerenciadorJogo.getDicasReveladas(),
          currentPlayerIndex: getIndiceJogadorTurno(),
        });
      }
    });

    socket.on('pass-turn', () => {
      const sucesso = gerenciadorJogo.passarVez(socket.id);
      if (sucesso) {
        io.emit('clue-revealed', {
          revealedClueIndices: gerenciadorJogo.getDicasReveladas(),
          currentPlayerIndex: getIndiceJogadorTurno(),
        });
      }
    });

    socket.on('submit-answer', (answer: string) => {
      const resposta = gerenciadorJogo.adicionarResposta(socket.id, answer);
      if (resposta) {
        const host = gerenciadorJogo.getJogadores().find(j => j.e_host);
        if (host) {
          io.to(host.id_socket).emit('new-answer', resposta);
        }
      }
    });

    socket.on('validate-answer', ({ answerId, isCorrect, casesToMove }: { answerId: number, isCorrect: boolean, casesToMove: number }) => {
      const resultado = gerenciadorJogo.validarResposta(answerId, isCorrect, casesToMove);
      
      if (resultado.sucesso) {
        if (isCorrect && resultado.nomeJogador) {
          io.emit('answer-correct', {
            playerName: resultado.nomeJogador,
            correctAnswer: resultado.respostaCorreta,
            casesToMove,
            players: gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend),
          });

          setTimeout(() => {
            if (gerenciadorJogo.getJogoIniciado()) {
              io.emit('next-card', {
                currentCard: gerenciadorJogo.getCartaAtual(),
                currentPlayerIndex: getIndiceJogadorTurno(),
              });
            }
          }, 3000);
        } else {
          io.emit('answer-incorrect', {
            playerName: gerenciadorJogo.getRespostas().find(r => r.id === answerId)?.nome_jogador,
            nextPlayerIndex: getIndiceJogadorTurno()
          });
        }

        io.emit('answers-updated', gerenciadorJogo.getRespostas());
      }
    });

    socket.on('reveal-answer', () => {
      const respostaCorreta = gerenciadorJogo.revelarResposta();
      if (respostaCorreta) {
        io.emit('answer-revealed', { correctAnswer: respostaCorreta });

        setTimeout(() => {
          if (gerenciadorJogo.getJogoIniciado()) {
            io.emit('next-card', {
              currentCard: gerenciadorJogo.getCartaAtual(),
              currentPlayerIndex: getIndiceJogadorTurno(),
            });
          }
        }, 3000);
      }
    });

    socket.on('restart-game', () => {
      const jogador = gerenciadorJogo.getJogadorPorSocket(socket.id);
      if (!jogador || !jogador.e_host) return;

      gerenciadorJogo.reiniciarJogo();
      io.emit('game-restarted', gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend));
    });

    socket.on('disconnect', () => {
      gerenciadorJogo.removerJogador(socket.id);
      io.emit('player-left', { 
        playerId: socket.id, 
        players: gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend) 
      });
    });
  });

  console.log('✅ Socket.io configurado');
  return io;
}

function getIndiceJogadorTurno(): number {
  const jogadores = gerenciadorJogo.getJogadores();
  const idx = jogadores.findIndex(j => j.e_turno_atual);
  return idx;
}

function mapJogadorParaFrontend(jogador: any) {
  return {
    id: jogador.id_socket,
    name: jogador.nome_jogador,
    diceRoll: jogador.rolagem_dado,
    score: jogador.pontuacao,
    isHost: jogador.e_host,
  };
}

export function getIO(): SocketIOServer | null {
  return io;
}
