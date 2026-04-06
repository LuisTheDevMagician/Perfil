// Página de Lobby - Tela inicial onde jogadores entram e rolam dados
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

interface Player {
  id: string;
  name: string;
  diceRoll: number | null;
  score: number;
  isHost: boolean;
}

export default function Home() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');

  // Conectar ao socket ao montar o componente
  useEffect(() => {
    console.log('Página do lobby carregada');
    
    const socket = getSocket();
    socketRef.current = socket;

    // Evento de conexão
    socket.on('connect', () => {
      console.log('Socket conectado no lobby!', socket.id);
      setIsConnecting(false);
      setConnectionStatus('Conectado!');
    });

    // Evento de erro de conexão
    socket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error);
      setConnectionStatus('Erro de conexão. Tentando reconectar...');
      setError('Erro ao conectar ao servidor. Verifique se está rodando.');
    });

    // Evento de desconexão
    socket.on('disconnect', () => {
      console.log('Socket desconectado no lobby');
      setConnectionStatus('Desconectado. Tentando reconectar...');
    });

    // Eventos do socket
    socket.on('joined-lobby', ({ player, players: allPlayers }: { player: Player, players: Player[] }) => {
      setCurrentPlayer(player);
      setPlayers(allPlayers);
      setJoined(true);
      setError('');
    });

    socket.on('player-joined', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on('player-left', ({ players: updatedPlayers }: { playerId: string, players: Player[] }) => {
      setPlayers(updatedPlayers);
    });

    socket.on('dice-rolled', ({ playerId, diceRoll }: { playerId: string, playerName: string, diceRoll: number }) => {
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, diceRoll } : p
      ));
    });

    socket.on('play-order-set', (orderedPlayers: Player[]) => {
      setPlayers(orderedPlayers);
    });

    socket.on('game-started', () => {
      console.log('Jogo iniciado! Redirecionando...');
      // Socket singleton persiste através da navegação
      router.push('/game');
    });

    socket.on('lobby-full', () => {
      setError('Lobby cheio! Máximo de 11 jogadores.');
    });

    socket.on('name-taken', () => {
      setError('Este nome já está em uso. Escolha outro.');
    });

    // Não desconectar o socket ao desmontar - ele é reutilizado
    return () => {
      console.log('Lobby desmontado, socket mantido para a página do jogo');
    };
  }, [router]);

  const handleJoinLobby = () => {
    if (!playerName.trim()) {
      setError('Por favor, digite um nome.');
      return;
    }
    socketRef.current?.emit('join-lobby', playerName.trim());
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

  // Verificar se todos os jogadores (exceto o host) rolaram os dados
  const nonHostPlayers = players.filter(p => !p.isHost);
  const allPlayersRolled = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.diceRoll !== null);

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Jogo Perfil</h1>
          <p className="text-center text-gray-600 mb-8">Quiz Multiplayer - Até 11 jogadores</p>
          
          {/* Indicador de Status da Conexão */}
          <div className={`mb-4 p-3 rounded-lg text-center text-sm ${
            isConnecting 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {connectionStatus}
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Digite seu nome:
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinLobby()}
                placeholder="Seu apelido"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800"
                maxLength={20}
                disabled={isConnecting}
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleJoinLobby}
              disabled={isConnecting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
            >
              Entrar no Lobby
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>🎲 Primeiro jogador será o HOST</p>
            <p>🎯 Acesse em outros dispositivos na mesma rede</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">
            Lobby do Jogo
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {currentPlayer?.isHost && <span className="text-purple-600 font-bold">👑 Você é o HOST!</span>}
            {!currentPlayer?.isHost && <span>Aguarde o HOST iniciar a partida</span>}
          </p>

          {/* Lista de Jogadores */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Jogadores Conectados ({players.length}/11)
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
                    {player.isHost && <span className="text-xl">👑</span>}
                    <span className={`font-semibold ${player.isHost ? 'text-green-600' : 'text-gray-800'}`}>{player.name}</span>
                    {player.id === currentPlayer?.id && (
                      <span className="text-sm text-purple-600">(Você)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {player.isHost ? (
                      <span className="text-sm text-green-600 font-bold">Mestre</span>
                    ) : player.diceRoll !== null ? (
                      <span className={`text-2xl font-bold ${player.id === currentPlayer?.id ? 'text-green-600' : 'text-gray-800'}`}>🎲 {player.diceRoll}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Aguardando...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controles */}
          <div className="space-y-3">
            {/* Botão Rolar Dados - apenas para jogadores (não-hosts) que ainda não rolaram */}
            {currentPlayer?.isHost === false && currentPlayer?.diceRoll === null && (
              <button
                onClick={handleRollDice}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                🎲 Rolar Dados
              </button>
            )}

            {/* Botões do HOST */}
            {currentPlayer?.isHost && (
              <>
                {allPlayersRolled && (
                  <button
                    onClick={handleSetPlayOrder}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
                  >
                    📋 Definir Ordem de Jogo
                  </button>
                )}
                
                <button
                  onClick={handleStartGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
                >
                  🎮 Iniciar Partida
                </button>
              </>
            )}
          </div>

          {/* Instruções */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
            <h3 className="font-bold mb-2">📖 Como Jogar:</h3>
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
