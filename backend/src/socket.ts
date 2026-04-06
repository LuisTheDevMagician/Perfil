import { Server as SocketIOServer } from 'socket.io';
import { gerenciadorJogo } from './game';
import { validarNome, validarResposta, validarIndiceDica, validarCasas } from './schemas/jogo.schema';

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

    socket.on('join-lobby', (data: unknown) => {
      try {
        const nome = typeof data === 'string' ? data : (data as any)?.nome;
        
        const nomeValidado = validarNome(nome);
        if (!nomeValidado) {
          socket.emit('error', { message: 'Nome deve ter entre 1 e 20 caracteres' });
          return;
        }

        const sessao = gerenciadorJogo.buscarSessaoAtiva();
        
        if (!sessao) {
          gerenciadorJogo.criarSessao(nomeValidado);
        }

        const jogador = gerenciadorJogo.adicionarJogador(socket.id, nomeValidado);
        
        if (!jogador) {
          socket.emit('lobby-full');
          return;
        }

        socket.emit('joined-lobby', { 
          player: mapJogadorParaFrontend(jogador), 
          players: gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend)
        });

        socket.broadcast.emit('player-joined', gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend));
      } catch (error: any) {
        console.error('Erro em join-lobby:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('request-game-state', () => {
      try {
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
      } catch (error: any) {
        console.error('Erro em request-game-state:', error.message);
      }
    });

    socket.on('roll-dice', () => {
      try {
        const diceRoll = Math.floor(Math.random() * 100) + 1;
        const sucesso = gerenciadorJogo.atualizarRolagemDado(socket.id, diceRoll);
        
        if (sucesso) {
          io.emit('dice-rolled', { 
            playerId: socket.id, 
            playerName: gerenciadorJogo.getJogadorPorSocket(socket.id)?.nome_jogador, 
            diceRoll 
          });
        }
      } catch (error: any) {
        console.error('Erro em roll-dice:', error.message);
      }
    });

    socket.on('set-play-order', () => {
      try {
        const jogador = gerenciadorJogo.getJogadorPorSocket(socket.id);
        if (!jogador || !jogador.e_host) return;

        gerenciadorJogo.ordenarJogadores();
        io.emit('play-order-set', gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend));
      } catch (error: any) {
        console.error('Erro em set-play-order:', error.message);
      }
    });

    socket.on('start-game', () => {
      try {
        const jogador = gerenciadorJogo.getJogadorPorSocket(socket.id);
        if (!jogador || !jogador.e_host) return;

        gerenciadorJogo.iniciarJogo();
        
        io.emit('game-started', {
          currentCard: gerenciadorJogo.getCartaAtual(),
          currentPlayerIndex: getIndiceJogadorTurno(),
          players: gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend),
        });
      } catch (error: any) {
        console.error('Erro em start-game:', error.message);
      }
    });

    socket.on('reveal-clue', (data: unknown) => {
      try {
        const indiceDica = typeof data === 'number' ? data : (data as any)?.indiceDica;
        
        const indiceValido = validarIndiceDica(indiceDica);
        if (indiceValido === null) {
          socket.emit('error', { message: 'Índice de dica deve ser entre 0 e 9' });
          return;
        }

        const sucesso = gerenciadorJogo.revelarDica(socket.id, indiceValido);
        if (sucesso) {
          io.emit('clue-revealed', {
            revealedClueIndices: gerenciadorJogo.getDicasReveladas(),
            currentPlayerIndex: getIndiceJogadorTurno(),
          });
        }
      } catch (error: any) {
        console.error('Erro em reveal-clue:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('pass-turn', () => {
      try {
        const sucesso = gerenciadorJogo.passarVez(socket.id);
        if (sucesso) {
          io.emit('clue-revealed', {
            revealedClueIndices: gerenciadorJogo.getDicasReveladas(),
            currentPlayerIndex: getIndiceJogadorTurno(),
          });
        }
      } catch (error: any) {
        console.error('Erro em pass-turn:', error.message);
      }
    });

    socket.on('submit-answer', (data: unknown) => {
      try {
        const resposta = typeof data === 'string' ? data : (data as any)?.resposta;
        
        const respostaValidada = validarResposta(resposta);
        if (!respostaValidada) {
          socket.emit('error', { message: 'Resposta deve ter entre 1 e 100 caracteres' });
          return;
        }

        const resp = gerenciadorJogo.adicionarResposta(socket.id, respostaValidada);
        if (resp) {
          const host = gerenciadorJogo.getJogadores().find(j => j.e_host);
          if (host) {
            io.to(host.id_socket).emit('new-answer', resp);
          }
        }
      } catch (error: any) {
        console.error('Erro em submit-answer:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('validate-answer', (data: unknown) => {
      try {
        if (!data || typeof data !== 'object') {
          socket.emit('error', { message: 'Dados inválidos' });
          return;
        }
        
        const { answerId, isCorrect, casesToMove } = data as any;
        
        if (typeof answerId !== 'number' || answerId < 1) {
          socket.emit('error', { message: 'ID de resposta inválido' });
          return;
        }
        
        if (typeof isCorrect !== 'boolean') {
          socket.emit('error', { message: 'Parâmetro isCorrect deve ser booleano' });
          return;
        }
        
        const casasValidas = validarCasas(casesToMove);
        if (casasValidas === null) {
          socket.emit('error', { message: 'Casas deve ser entre 1 e 10' });
          return;
        }

        const resultado = gerenciadorJogo.validarResposta(answerId, isCorrect, casasValidas);
        
        if (resultado.sucesso) {
          if (isCorrect && resultado.nomeJogador) {
            io.emit('answer-correct', {
              playerName: resultado.nomeJogador,
              correctAnswer: resultado.respostaCorreta,
              casesToMove: casasValidas,
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
      } catch (error: any) {
        console.error('Erro em validate-answer:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('reveal-answer', () => {
      try {
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
      } catch (error: any) {
        console.error('Erro em reveal-answer:', error.message);
      }
    });

    socket.on('restart-game', () => {
      try {
        const jogador = gerenciadorJogo.getJogadorPorSocket(socket.id);
        if (!jogador || !jogador.e_host) return;

        gerenciadorJogo.reiniciarJogo();
        io.emit('game-restarted', gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend));
      } catch (error: any) {
        console.error('Erro em restart-game:', error.message);
      }
    });

    socket.on('disconnect', () => {
      try {
        gerenciadorJogo.removerJogador(socket.id);
        io.emit('player-left', { 
          playerId: socket.id, 
          players: gerenciadorJogo.getJogadores().map(mapJogadorParaFrontend) 
        });
      } catch (error: any) {
        console.error('Erro em disconnect:', error.message);
      }
    });
  });

  console.log('✅ Socket.io configurado');
  return io;
}

function getIndiceJogadorTurno(): number {
  const jogadores = gerenciadorJogo.getJogadores();
  return jogadores.findIndex(j => j.e_turno_atual);
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
