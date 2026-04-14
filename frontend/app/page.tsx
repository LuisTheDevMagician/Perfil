'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CasinoIcon from '@mui/icons-material/Casino';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleJoinLobby = () => {
    if (!playerName.trim()) {
      setError('Por favor, digite um nome.');
      return;
    }
    router.push(`/lobby?nome=${encodeURIComponent(playerName.trim())}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">Jogo Perfil</h1>
        <p className="text-center text-gray-600 mb-8">Quiz Multiplayer - Até 11 jogadores</p>
        
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
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleJoinLobby}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Entrar no Lobby
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p><CasinoIcon /> Primeiro jogador será o HOST</p>
          <p><EmojiEventsIcon /> Acesse em outros dispositivos na mesma rede</p>
          <p className="mt-2">
            <button 
              onClick={() => router.push('/admin')} 
              className="text-gray-600 hover:text-purple-600 underline cursor-pointer bg-transparent border-none p-0 text-sm"
            >
              <SettingsIcon className="mr-1" /> Área do Administrador
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}