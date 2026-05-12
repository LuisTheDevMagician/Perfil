'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { soundManager } from '@/lib/soundManager';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

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
    soundManager.play('victoryScreenSound');
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on('return-to-lobby', () => {
      soundManager.stop('victoryScreenSound');
      localStorage.setItem('perfil_from_victory', 'true');
      router.replace('/lobby');
    });

    socket.on('game-restarted', () => {
      soundManager.stop('victoryScreenSound');
      localStorage.setItem('perfil_from_victory', 'true');
      router.replace('/lobby');
    });

    return () => {
      socket.off('return-to-lobby');
      socket.off('game-restarted');
    };
  }, [router]);

  const handlePlayAgain = () => {
    soundManager.stop('victoryScreenSound');
    const socket = getSocket();
    socket.emit('restart-game');
  };

  const handleExitToLobby = () => {
    soundManager.stop('victoryScreenSound');
    const socket = getSocket();
    socket.emit('exit-victory-screen');
  };

  const winner = ranking[0];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <style>{`
        @keyframes trophy-glow {
          0%, 100% { filter: drop-shadow(0 0 14px rgba(251,191,36,0.55)); }
          50%       { filter: drop-shadow(0 0 28px rgba(251,191,36,0.85)) drop-shadow(0 0 56px rgba(249,115,22,0.35)); }
        }
        .trophy-anim { animation: trophy-glow 2.5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 25%, rgba(251,191,36,0.1) 0%, rgba(249,115,22,0.06) 45%, transparent 70%)' }} />

        <div className="glass rounded-3xl p-8 max-w-md w-full relative z-10 text-center">
          <div className="trophy-anim mb-3 flex justify-center">
            <EmojiEventsIcon sx={{ fontSize: 68, color: '#FBBF24' }} />
          </div>

          <h1 className="mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(42px,10vw,66px)',
              letterSpacing: '0.06em',
              lineHeight: 1,
              background: 'linear-gradient(135deg, #FBBF24, #F97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Fim de Jogo!
          </h1>

          {winner && (
            <div className="rounded-2xl p-4 mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.12))',
                border: '1px solid rgba(196,181,253,0.2)',
              }}>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Vencedor</p>
              <p className="font-bold text-2xl" style={{ color: '#C4B5FD' }}>{winner.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.55)' }}>{winner.score} pontos</p>
            </div>
          )}

          <div className="rounded-2xl p-4 mb-5 space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xs font-bold mb-3 tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Ranking Final
            </h2>
            {ranking.map((player, index) => (
              <div key={player.id || index}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{
                  background: index === 0 ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${index === 0 ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                <div className="flex items-center gap-2">
                  <span>{medals[index] ?? `${index + 1}°`}</span>
                  <span className="font-semibold"
                    style={{ color: index === 0 ? '#FBBF24' : 'rgba(255,255,255,0.8)' }}>
                    {player.name}
                  </span>
                </div>
                <span className="font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>

          {isHost ? (
            <div className="space-y-3">
              <button onClick={handlePlayAgain}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 4px 16px rgba(16,185,129,0.22)' }}>
                <RefreshIcon /> Jogar Novamente
              </button>
              <button onClick={handleExitToLobby}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}>
                <ExitToAppIcon /> Voltar ao Lobby
              </button>
            </div>
          ) : (
            <div className="py-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>Aguardando o host...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function VictoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-2xl">
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Carregando...</p>
        </div>
      </div>
    }>
      <VictoryContent />
    </Suspense>
  );
}
