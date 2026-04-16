'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import StarIcon from '@mui/icons-material/Star';

interface Player {
  id: string;
  name: string;
  score: number;
}

function getInitialData() {
  if (typeof window === 'undefined') {
    return { ranking: [], isHost: false };
  }
  
  const rankingData = localStorage.getItem('perfil_ranking');
  localStorage.removeItem('perfil_ranking');
  const ranking: Player[] = rankingData ? JSON.parse(rankingData) : [];
  
  const hostData = localStorage.getItem('perfil_isHost');
  localStorage.removeItem('perfil_isHost');
  const isHost = hostData === 'true';
  
  return { ranking, isHost };
}

function VictoryContent() {
  const router = useRouter();
  
  const initialData = getInitialData();
  const [ranking] = useState<Player[]>(initialData.ranking);
  const [isHost] = useState(initialData.isHost);

  useEffect(() => {
    const socket = getSocket();
    
    socket.on('return-to-lobby', () => {
      console.log('Recebido return-to-lobby, navegando para lobby...');
      localStorage.setItem('perfil_from_victory', 'true');
      router.replace('/lobby');
    });
    
    socket.on('game-restarted', () => {
      console.log('Recebido game-restarted, navegando para lobby...');
      localStorage.setItem('perfil_from_victory', 'true');
      router.replace('/lobby');
    });
    
    return () => {
      socket.off('return-to-lobby');
      socket.off('game-restarted');
    };
  }, [router]);

  const handlePlayAgain = () => {
    const socket = getSocket();
    socket.emit('restart-game');
  };

  const handleExitToLobby = () => {
    const socket = getSocket();
    socket.emit('exit-victory-screen');
  };

  const winner = ranking[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <TrophyIcon sx={{ fontSize: 80, color: '#FFD700' }} />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Fim de Jogo!</h1>
        
        {winner && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 mb-6">
            <p className="text-white text-lg mb-1">🏆 Vencedor</p>
            <p className="text-yellow-300 text-2xl font-bold">{winner.name}</p>
            <p className="text-white text-lg">{winner.score} pontos</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-2">
            <StarIcon className="text-yellow-500" /> Ranking Final
          </h2>
          <div className="space-y-2">
            {ranking.map((player, index) => (
              <div 
                key={player.id || index}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${index === 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {index + 1}°
                  </span>
                  <span className="font-semibold text-gray-800">{player.name}</span>
                </div>
                <span className="font-bold text-gray-700">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="space-y-3">
            <button
              onClick={handlePlayAgain}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshIcon /> Jogar Novamente
            </button>
            <button
              onClick={handleExitToLobby}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <ExitToAppIcon /> Sair para o Lobby
            </button>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-gray-600 font-medium">
              Aguarde o host decidir o próximo passo...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VictoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl">
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <VictoryContent />
    </Suspense>
  );
}