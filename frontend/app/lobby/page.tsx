'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getSocket, getSessionId, disconnectSocket, clearSession } from '@/lib/socket';
import CasinoIcon from '@mui/icons-material/Casino';
import GroupIcon from '@mui/icons-material/Group';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SortIcon from '@mui/icons-material/Sort';
import StarIcon from '@mui/icons-material/Star';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Player {
  id: string;
  name: string;
  diceRoll: number | null;
  score: number;
  isHost: boolean;
}

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const socketRef = useRef<Socket | null>(null);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  
  const [disciplinas, setDisciplinas] = useState<{id: number, nome: string}[]>([]);
  const [temas, setTemas] = useState<{id: number, nome: string, disciplina_id: number}[]>([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<number>(0);
  const [temaSelecionado, setTemaSelecionado] = useState<number>(0);
  const [themeSelected, setThemeSelected] = useState(false);
  const [disciplinaNome, setDisciplinaNome] = useState('');
  const [temaNome, setTemaNome] = useState('');
  
  const playerNameParam = searchParams.get('nome') || '';

  useEffect(() => {
    const fromVictory = localStorage.getItem('perfil_from_victory');
    if (fromVictory) {
      localStorage.removeItem('perfil_from_victory');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, []);

  useEffect(() => {
    const nameToUse = playerNameParam || localStorage.getItem('perfil_player_name') || '';
    
    if (!nameToUse) {
      router.push('/');
      return;
    }
    
    localStorage.setItem('perfil_player_name', nameToUse);
    
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket conectado no lobby!', socket.id);
      setIsConnecting(false);
      setConnectionStatus('Conectado!');
      
      const sessionId = getSessionId();
      socket.emit('join-lobby', { nome: nameToUse, sessionId });
    });

    socket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error);
      setConnectionStatus('Erro de conexão. Tentando reconectar...');
      setError('Erro ao conectar ao servidor.');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('Desconectado. Tentando reconectar...');
    });

    const deduplicatePlayers = (playerList: Player[]): Player[] => {
      return playerList.filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i);
    };

    socket.on('joined-lobby', ({ player, players: allPlayers }: { player: Player, players: Player[] }) => {
      setCurrentPlayer(player);
      setPlayers(deduplicatePlayers(allPlayers));
      setError('');
    });

    socket.on('player-joined', (updatedPlayers: Player[]) => {
      setPlayers(deduplicatePlayers(updatedPlayers));
    });

    socket.on('player-left', ({ players: updatedPlayers }: { playerId: string, players: Player[] }) => {
      setPlayers(deduplicatePlayers(updatedPlayers));
    });

    socket.on('dice-rolled', ({ playerId, diceRoll }: { playerId: string, playerName: string, diceRoll: number }) => {
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, diceRoll } : p
      ));
    });

    socket.on('play-order-set', (orderedPlayers: Player[]) => {
      setPlayers(orderedPlayers);
    });

    socket.on('theme-selected', ({ temaNome, disciplinaNome }: { temaNome: string, disciplinaNome: string }) => {
      console.log('Theme selected received:', temaNome, disciplinaNome);
      setThemeSelected(true);
      setTemaNome(temaNome);
      setDisciplinaNome(disciplinaNome);
    });

    socket.on('game-started', () => {
      console.log('Jogo iniciado! Redirecionando...');
      router.push('/game');
    });

    socket.on('lobby-full', () => {
      setError('Lobby cheio! Máximo de 11 jogadores.');
    });

    socket.on('name-taken', () => {
      setError('Este nome já está em uso. Escolha outro.');
    });

    socket.on('game-restarted', (updatedPlayers: Player[]) => {
      console.log('Jogo reiniciado no lobby:', updatedPlayers);
      setPlayers(deduplicatePlayers(updatedPlayers));
      setError('');
    });

    socket.on('return-to-lobby', (updatedPlayers: Player[]) => {
      console.log('Voltando ao lobby (return-to-lobby):', updatedPlayers);
      setPlayers(deduplicatePlayers(updatedPlayers));
      setError('');
    });

    socket.on('lobby-state', ({ players: lobbyPlayers }: { players: Player[] }) => {
      console.log('Estado do lobby recebido:', lobbyPlayers);
      setPlayers(deduplicatePlayers(lobbyPlayers));
    });

    socket.emit('request-game-state');

    return () => {
      console.log('Lobby desmontado');
      socket.off('game-restarted');
      socket.off('return-to-lobby');
      socket.off('lobby-state');
    };
  }, [router, playerNameParam]);

  useEffect(() => {
    if (currentPlayer?.isHost) {
      Promise.all([
        fetch('http://localhost:3001/api/disciplinas').then(r => r.json()),
        fetch('http://localhost:3001/api/temas').then(r => r.json()),
        fetch('http://localhost:3001/api/cartas').then(r => r.json())
      ]).then(([disc, temasData, cartasData]) => {
        setDisciplinas(disc);
        // Filtra apenas os temas que têm pelo menos uma carta associada
        const temasComCartasIds = new Set(cartasData.map((c: { tema_id: number }) => c.tema_id));
        setTemas(temasData.filter((t: { id: number; nome: string; disciplina_id: number }) => temasComCartasIds.has(t.id)));
      });
    }
  }, [currentPlayer?.isHost]);

  const temasFiltrados = temas.filter(t => t.disciplina_id === disciplinaSelecionada);

  const handleSelectTema = () => {
    console.log('Selecting theme:', temaSelecionado);
    if (temaSelecionado) {
      socketRef.current?.emit('select-theme', temaSelecionado);
    }
  };

  const handleRollDice = () => {
    socketRef.current?.emit('roll-dice');
  };

  const handleSetPlayOrder = () => {
    socketRef.current?.emit('set-play-order');
  };

  const handleStartGame = () => {
    socketRef.current?.emit('start-game');
  };

  const handleSair = () => {
    if (socketRef.current) {
      socketRef.current.emit('sair-lobby');
      socketRef.current.disconnect();
    }
    disconnectSocket();
    localStorage.removeItem('perfil_player_name');
    clearSession();
    router.push('/');
  };

  const nonHostPlayers = players.filter(p => !p.isHost);
  const allPlayersRolled = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.diceRoll !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleSair}
              className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md border border-red-700"
            >
              <ArrowBackIcon /> Sair
            </button>
            <div className={`px-3 py-1 rounded-lg text-sm ${
              isConnecting 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {connectionStatus}
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">
            Lobby do Jogo
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {currentPlayer?.isHost && <span className="text-purple-600 font-bold"><StarIcon className="mr-1" /> Você é o HOST!</span>}
            {!currentPlayer?.isHost && <span>Aguarde o HOST iniciar a partida</span>}
          </p>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r">
              <p>{error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <GroupIcon /> Jogadores Conectados ({players.length}/11)
            </h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === currentPlayer?.id
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {player.isHost && <StarIcon className="text-xl text-yellow-500" />}
                    <span className={`font-semibold ${player.isHost ? 'text-green-600' : 'text-gray-800'}`}>{player.name}</span>
                    {player.id === currentPlayer?.id && (
                      <span className="text-sm text-purple-600">(<PersonIcon /> Você)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {player.isHost ? (
                      <span className="text-sm text-green-600 font-bold">Mestre</span>
                    ) : player.diceRoll !== null ? (
                      <span className={`text-2xl font-bold ${player.id === currentPlayer?.id ? 'text-green-600' : 'text-gray-800'}`}><CasinoIcon /> {player.diceRoll}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Aguardando...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentPlayer?.isHost && !themeSelected && disciplinas.length > 0 ? (
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Configure o Jogo</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                  <select
                    value={disciplinaSelecionada}
                    onChange={(e) => {
                      setDisciplinaSelecionada(Number(e.target.value));
                      setTemaSelecionado(0);
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
                    style={{ color: '#000000' }}
                  >
                    <option value={0} style={{ color: '#000000' }}>Selecione uma disciplina</option>
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.id} style={{ color: '#000000' }}>{d.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                  <select
                    value={temaSelecionado}
                    onChange={(e) => setTemaSelecionado(Number(e.target.value))}
                    disabled={!disciplinaSelecionada}
                    className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:border-purple-500 focus:outline-none disabled:opacity-50 text-gray-900 bg-white"
                    style={{ color: disciplinaSelecionada ? '#000000' : '#999999' }}
                  >
                    <option value={0} style={{ color: '#000000' }}>Selecione um tema</option>
                    {temasFiltrados.map(t => (
                      <option key={t.id} value={t.id} style={{ color: '#000000' }}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSelectTema}
                  disabled={!temaSelecionado}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Confirmar Tema
                </button>
              </div>
            </div>
          ) : null}

          {themeSelected ? (
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-green-700 font-semibold">
                Tema selecionado: {temaNome} ({disciplinaNome})
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            {currentPlayer?.isHost === false && currentPlayer?.diceRoll === null ? (
              <button
                onClick={handleRollDice}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
              >
                <CasinoIcon /> Rolar Dados
              </button>
            ) : null}

            {currentPlayer?.isHost ? (
              <div className="space-y-3">
                {allPlayersRolled ? (
                  <button
                    onClick={handleSetPlayOrder}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
                  >
                    <SortIcon /> Definir Ordem de Jogo
                  </button>
                ) : null}
                
                <button
                  onClick={handleStartGame}
                  disabled={!themeSelected}
                  className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center justify-center gap-2 ${
                    themeSelected 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <PlayArrowIcon /> {themeSelected ? 'Iniciar Partida' : 'Selecione um tema primeiro'}
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
            <h3 className="font-bold mb-2 flex items-center gap-1"><InfoIcon /> Como Jogar:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Cada jogador rola os dados para definir a ordem</li>
              <li>HOST inicia a partida quando todos estiverem prontos</li>
              <li>Jogadores revelam dicas e tentam adivinhar a resposta</li>
              <li>Quem acertar ganha pontos definidos pelo HOST</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl">
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <LobbyContent />
    </Suspense>
  );
}