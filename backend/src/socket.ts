import { Server as SocketIOServer } from 'socket.io';
import { gerenciadorJogo } from './game';
import { queries } from './db/queries';
import { validarNome, validarResposta, validarIndiceDica, validarCasas } from './schemas/jogo.schema';

let io: SocketIOServer;

function getSocketIdsAtivos(): string[] {
  if (!io) return [];
  const ids = Array.from((io.sockets as any).sockets.keys()) as string[];
  console.log('🔍 Socket IDs ativos:', ids.length, ids);
  return ids;
}

export function initSocket(httpServer: any) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id, 'query:', socket.handshake.query);

    socket.on('join-lobby', (data: unknown) => {
      try {
        const rawData = typeof data === 'string' ? { nome: data } : data;
        const nome = (rawData as any)?.nome;
        const sessionId = (rawData as any)?.sessionId || socket.handshake.query?.sessionId as string;
        
        const nomeValidado = validarNome(nome);
        if (!nomeValidado) {
          socket.emit('error', { message: 'Nome deve ter entre 1 e 20 caracteres' });
          return;
        }

        const sessao = gerenciadorJogo.buscarSessaoAtiva();
        
        if (!sessao) {
          gerenciadorJogo.criarSessao(nomeValidado);
        }

        const jogador = gerenciadorJogo.reativarOuAdicionarJogador(socket.id, sessionId, nomeValidado);
        
        if (!jogador) {
          socket.emit('lobby-full');
          return;
        }

        socket.emit('joined-lobby', { 
          player: mapJogadorParaFrontend(jogador), 
          players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend)
        });

        socket.broadcast.emit('player-joined', gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend));
      } catch (error: any) {
        console.error('Erro em join-lobby:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('request-game-state', () => {
      try {
        if (gerenciadorJogo.getJogoEncerrado()) {
          socket.emit('victory-state', {
            ranking: gerenciadorJogo.obterRankingFinal().map(j => ({
              id: j.id_socket,
              name: j.nome_jogador,
              score: j.pontuacao,
            }))
          });
          return;
        }
        
        if (gerenciadorJogo.getJogoIniciado()) {
          socket.emit('game-started', {
            currentCard: gerenciadorJogo.getCartaAtual(),
            currentPlayerIndex: getIndiceJogadorTurno(),
            currentPlayerId: getIdJogadorTurno(),
            players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend),
          });

          const dicasReveladas = gerenciadorJogo.getDicasReveladas();
          if (dicasReveladas.length > 0) {
            socket.emit('clue-revealed', {
              revealedClueIndices: dicasReveladas,
              currentPlayerIndex: getIndiceJogadorTurno(),
              currentPlayerId: getIdJogadorTurno(),
            });
          } else {
            socket.emit('clue-revealed', {
              revealedClueIndices: [],
              currentPlayerIndex: getIndiceJogadorTurno(),
              currentPlayerId: getIdJogadorTurno(),
            });
          }
          return;
        }

        const jogadores = gerenciadorJogo.getJogadores(getSocketIdsAtivos());
        if (jogadores.length > 0) {
          socket.emit('lobby-state', {
            players: jogadores.map(mapJogadorParaFrontend)
          });
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
        io.emit('play-order-set', gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend));
      } catch (error: any) {
        console.error('Erro em set-play-order:', error.message);
      }
    });

    socket.on('select-theme', (data: unknown) => {
      try {
        const jogador = gerenciadorJogo.getJogadorPorSocket(socket.id);
        if (!jogador || !jogador.e_host) return;

        const temaId = typeof data === 'number' ? data : (data as any)?.temaId;
        if (!temaId) return;

        gerenciadorJogo.definirTema(temaId);
        
        const tema = queries.buscarTemaPorId(temaId);
        const disciplina = tema ? queries.buscarDisciplinaPorId(tema.disciplina_id) : null;
        
        io.emit('theme-selected', {
          temaId,
          temaNome: tema?.nome || '',
          disciplinaId: tema?.disciplina_id || 0,
          disciplinaNome: disciplina?.nome || ''
        });
      } catch (error: any) {
        console.error('Erro em select-theme:', error.message);
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
          currentPlayerId: getIdJogadorTurno(),
          players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend),
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

        console.log('📨 reveal-clue recebido de', socket.id, 'indice:', indiceValido);
        const sucesso = gerenciadorJogo.revelarDica(socket.id, indiceValido);
        console.log('📨 resultado revelarDica:', sucesso);
        if (sucesso) {
          io.emit('clue-revealed', {
            revealedClueIndices: gerenciadorJogo.getDicasReveladas(),
            currentPlayerIndex: getIndiceJogadorTurno(),
            currentPlayerId: getIdJogadorTurno(),
            players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend)
          });
        }
      } catch (error: any) {
        console.error('Erro em reveal-clue:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('pass-turn', () => {
      try {
        console.log('📨 Recebido pass-turn de:', socket.id);
        const sucesso = gerenciadorJogo.passarVez(socket.id);
        console.log('📊 Resultado passarVez:', sucesso, 'currentPlayerIndex:', getIndiceJogadorTurno());
        if (sucesso) {
          io.emit('clue-revealed', {
            revealedClueIndices: gerenciadorJogo.getDicasReveladas(),
            currentPlayerIndex: getIndiceJogadorTurno(),
            currentPlayerId: getIdJogadorTurno(),
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
          const host = gerenciadorJogo.getJogadores(getSocketIdsAtivos()).find(j => j.e_host);
          if (host) {
            io.to(host.id_socket).emit('new-answer', {
              id: resp.id,
              playerId: socket.id,
              playerName: resp.nome_jogador,
              answer: resp.resposta,
              timestamp: Date.now()
            });
          }
        }
      } catch (error: any) {
        console.error('Erro em submit-answer:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('validate-answer', (data: unknown) => {
      try {
        console.log('📨 Recebido validate-answer:', JSON.stringify(data));
        
        if (!data || typeof data !== 'object') {
          socket.emit('error', { message: 'Dados inválidos' });
          return;
        }
        
        const { answerId, isCorrect } = data as any;
        
        console.log('📋 Parsed data:', { answerId, isCorrect });
        
        if (typeof answerId !== 'number' || answerId < 1) {
          socket.emit('error', { message: 'ID de resposta inválido' });
          return;
        }
        
        if (typeof isCorrect !== 'boolean') {
          socket.emit('error', { message: 'Parâmetro isCorrect deve ser booleano' });
          return;
        }
        
        const casasValidas = gerenciadorJogo.calcularPontos();
        console.log('🎯 Pontos automáticos:', casasValidas);

        const resultado = gerenciadorJogo.validarResposta(answerId, isCorrect, casasValidas);
        console.log('📊 Resultado da validação:', resultado);
        
        if (resultado.sucesso) {
          if (isCorrect && resultado.nomeJogador) {
            io.emit('answer-correct', {
              playerName: resultado.nomeJogador,
              correctAnswer: resultado.respostaCorreta,
              pointsAwarded: casasValidas,
              currentPlayerId: getIdJogadorTurno(),
              players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend),
            });

            setTimeout(() => {
              const nextCard = gerenciadorJogo.getCartaAtual();
              if (!nextCard) {
                io.emit('victory-state', {
                  ranking: gerenciadorJogo.obterRankingFinal().map(j => ({
                    id: j.id_socket,
                    name: j.nome_jogador,
                    score: j.pontuacao,
                  }))
                });
              } else if (gerenciadorJogo.getJogoIniciado()) {
                io.emit('next-card', {
                  currentCard: nextCard,
                  currentPlayerIndex: getIndiceJogadorTurno(),
                  currentPlayerId: getIdJogadorTurno(),
                  players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend),
                });
              }
            }, 3000);
          } else {
            console.log('❌ Enviando answer-incorrect com nextPlayerIndex:', getIndiceJogadorTurno());
            io.emit('answer-incorrect', {
              playerName: resultado.nomeJogador,
              answer: resultado.resposta,
              nextPlayerIndex: getIndiceJogadorTurno(),
              nextPlayerId: getIdJogadorTurno(),
              players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend)
            });
          }

          const respostasAtuais = gerenciadorJogo.getRespostas();
          io.emit('answers-updated', respostasAtuais.map(r => ({
            id: r.id,
            playerId: '',
            playerName: r.nome_jogador,
            answer: r.resposta,
            timestamp: new Date(r.data_envio).getTime()
          })));
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
            const nextCard = gerenciadorJogo.getCartaAtual();
            if (!nextCard) {
              io.emit('victory-state', {
                ranking: gerenciadorJogo.obterRankingFinal().map(j => ({
                  id: j.id_socket,
                  name: j.nome_jogador,
                  score: j.pontuacao,
                }))
              });
            } else if (gerenciadorJogo.getJogoIniciado()) {
              io.emit('next-card', {
                currentCard: nextCard,
                currentPlayerIndex: getIndiceJogadorTurno(),
                currentPlayerId: getIdJogadorTurno(),
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
        io.emit('game-restarted', gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend));
      } catch (error: any) {
        console.error('Erro em restart-game:', error.message);
      }
    });

    socket.on('exit-victory-screen', () => {
      try {
        const jogador = gerenciadorJogo.getJogadorPorSocket(socket.id);
        if (!jogador || !jogador.e_host) return;

        gerenciadorJogo.sairDaTelaDeVitoria();
        
        io.emit('return-to-lobby', gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend));
        console.log('👋 Host saiu da tela de vitória - todos voltando ao lobby');
      } catch (error: any) {
        console.error('Erro em exit-victory-screen:', error.message);
      }
    });

    socket.on('sair-lobby', () => {
      try {
        gerenciadorJogo.removerJogador(socket.id, true);
        io.emit('player-left', { 
          playerId: socket.id, 
          players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend) 
        });
      } catch (error: any) {
        console.error('Erro em sair-lobby:', error.message);
      }
    });

    socket.on('disconnect', () => {
      try {
        gerenciadorJogo.removerJogador(socket.id, false);
        io.emit('player-left', { 
          playerId: socket.id, 
          players: gerenciadorJogo.getJogadores(getSocketIdsAtivos()).map(mapJogadorParaFrontend) 
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
  const jogadores = gerenciadorJogo.getJogadores(getSocketIdsAtivos());
  const idx = jogadores.findIndex(j => j.e_turno_atual);
  console.log('🎯 getIndiceJogadorTurno:', idx, 'jogadores:', jogadores.map(j => ({ nome: j.nome_jogador, e_turno: j.e_turno_atual, e_host: j.e_host })));
  return idx;
}

function getIdJogadorTurno(): string {
  return gerenciadorJogo.getIdJogadorAtual();
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
