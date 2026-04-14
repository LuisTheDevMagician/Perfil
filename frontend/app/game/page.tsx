// Página do Jogo - Tela principal onde acontece a partida
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getSocket, getSessionId } from '@/lib/socket';
import { Card } from '@/lib/cards';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import SendIcon from '@mui/icons-material/Send';
import TimerIcon from '@mui/icons-material/Timer';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import GroupIcon from '@mui/icons-material/Group';

interface Player {
  id: string;
  name: string;
  diceRoll: number | null;
  score: number;
  isHost: boolean;
}

interface Answer {
  id: number;
  playerId: string;
  playerName: string;
  answer: string;
  timestamp: number;
}

export default function GamePage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [revealedClueIndices, setRevealedClueIndices] = useState<number[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const isHostRef = useRef(false);
  const [myId, setMyId] = useState<string>('');
  const [playerAnswer, setPlayerAnswer] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [casesToMove, setCasesToMove] = useState(1);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showErrorAnswer, setShowErrorAnswer] = useState(false);
  const [errorPlayerName, setErrorPlayerName] = useState('');
  const [errorAnswer, setErrorAnswer] = useState('');
  const [correctAnswerText, setCorrectAnswerText] = useState('');
  const [winnerName, setWinnerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const isRevealingRef = useRef(false);

  useEffect(() => {
    console.log('Página do jogo carregada');
    
    const socket = getSocket();
    socketRef.current = socket;
    
    const handleConnect = () => {
      console.log('Socket conectado na página do jogo:', socket.id);
      setMyId(socket.id || '');
      const sessionId = getSessionId?.() || localStorage.getItem('perfil_session_id') || '';
      const playerName = localStorage.getItem('perfil_player_name') || '';
      if (sessionId && playerName) {
        socket.emit('join-lobby', { nome: playerName, sessionId });
      }
      socket.emit('request-game-state');
    };
    
    const handleGameStarted = ({ currentCard: card, currentPlayerIndex: index, currentPlayerId: playerId, players: gamePlayers }: { currentCard: Card, currentPlayerIndex: number, currentPlayerId: string, players: Player[] }) => {
      console.log('Evento game-started recebido:', card?.nome, 'currentPlayerId:', playerId);
      setCurrentCard(card);
      setCurrentPlayerIndex(index);
      setCurrentPlayerId(playerId);
      const deduplicated = gamePlayers.filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i);
      setPlayers(deduplicated);
      setShowCorrectAnswer(false);
      setIsLoading(false);
      const currentId = socket.id;
      const me = deduplicated.find((p: Player) => p.id === currentId);
      setIsHost(me?.isHost || false);
      isHostRef.current = me?.isHost || false;
      setMyId(currentId || '');
    };
    
    const handleClueRevealed = ({ revealedClueIndices: newRevealed, currentPlayerIndex: newIndex, currentPlayerId: newPlayerId }: { revealedClueIndices: number[], currentPlayerIndex: number, currentPlayerId: string }) => {
      console.log('📨 Evento clue-revealed recebido:', { newRevealed, newIndex, newPlayerId });
      setRevealedClueIndices(newRevealed);
      setCurrentPlayerIndex(newIndex);
      setCurrentPlayerId(newPlayerId);
      setShowErrorAnswer(false);
      
      isRevealingRef.current = false;
    };
    
    const handleNewAnswer = (answer: Answer) => {
      console.log('Recebendo resposta no host:', answer);
      setAnswers(prev => {
        const exists = prev.some(a => a.playerId === answer.playerId && a.timestamp === answer.timestamp);
        if (exists) {
          console.log('Resposta duplicada detectada e ignorada');
          return prev;
        }
        console.log('Nova resposta adicionada, total:', prev.length + 1);
        return [...prev, answer];
      });
    };
    
    const handleAnswerCorrect = ({ playerName, correctAnswer, currentPlayerId: playerId, players: updatedPlayers }: { playerName: string, correctAnswer: string, currentPlayerId: string, players: Player[] }) => {
      setWinnerName(playerName);
      setCorrectAnswerText(correctAnswer);
      setShowCorrectAnswer(true);
      setCurrentPlayerId(playerId);
      setPlayers(updatedPlayers.filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i));
      setAnswers([]);
      setHasAnswered(false);
      setTimeout(() => {
        setShowCorrectAnswer(false);
        setPlayerAnswer('');
      }, 3000);
    };
    
    const handleAnswerIncorrect = ({ playerName, answer, nextPlayerIndex, nextPlayerId }: { playerName: string, answer: string, nextPlayerIndex: number, nextPlayerId: string }) => {
      console.log(`❌ ${playerName} errou! Resposta: "${answer}" Próximo jogador: index ${nextPlayerIndex}, id ${nextPlayerId}`);
      setCurrentPlayerIndex(nextPlayerIndex);
      setCurrentPlayerId(nextPlayerId);
      setErrorPlayerName(playerName);
      setErrorAnswer(answer || '');
      setShowErrorAnswer(true);
      setTimeout(() => {
        setShowErrorAnswer(false);
        setErrorPlayerName('');
        setErrorAnswer('');
      }, 3000);
    };
    
    const handleNextCard = ({ currentCard: card, currentPlayerIndex: index, currentPlayerId: playerId }: { currentCard: Card, currentPlayerIndex: number, currentPlayerId: string }) => {
      setCurrentCard(card);
      setCurrentPlayerIndex(index);
      setCurrentPlayerId(playerId);
      setRevealedClueIndices([]);
      setShowCorrectAnswer(false);
      setShowErrorAnswer(false);
      setAnswers([]);
      setHasAnswered(false);
      isRevealingRef.current = false;
    };
    
    const handleGameEnded = ({ ranking: finalRanking }: { ranking: Player[] }) => {
      console.log('🏆 Jogo encerrado! Ranking:', finalRanking);
      localStorage.setItem('perfil_ranking', JSON.stringify(finalRanking));
      localStorage.setItem('perfil_isHost', isHostRef.current ? 'true' : 'false');
      router.push('/victory');
    };
    
    const handleAnswersUpdated = (updatedAnswers: Answer[]) => {
      setAnswers(updatedAnswers);
    };
    
    const handleAnswerRevealed = ({ correctAnswer }: { correctAnswer: string }) => {
      setCorrectAnswerText(correctAnswer);
      setWinnerName('Ninguém acertou');
      setShowCorrectAnswer(true);
      setTimeout(() => {
        setShowCorrectAnswer(false);
      }, 3000);
    };
    
    const handleGameRestarted = () => {
      router.push('/lobby');
    };

    socket.on('connect', handleConnect);
    socket.on('game-started', handleGameStarted);
    socket.on('clue-revealed', handleClueRevealed);
    socket.on('new-answer', handleNewAnswer);
    socket.on('answer-correct', handleAnswerCorrect);
    socket.on('answer-incorrect', handleAnswerIncorrect);
    socket.on('next-card', handleNextCard);
    socket.on('game-ended', handleGameEnded);
    socket.on('victory-state', handleGameEnded);
    socket.on('answers-updated', handleAnswersUpdated);
    socket.on('answer-revealed', handleAnswerRevealed);
    socket.on('game-restarted', handleGameRestarted);
    
    if (socket.connected) {
      handleConnect();
    }
    
    return () => {
      console.log('Página do jogo desmontada, removendo listeners');
      socket.off('game-started');
      socket.off('clue-revealed');
      socket.off('new-answer', handleNewAnswer);
      socket.off('answer-correct');
      socket.off('answer-incorrect');
      socket.off('next-card');
      socket.off('game-ended');
      socket.off('victory-state');
      socket.off('answers-updated');
      socket.off('answer-revealed');
      socket.off('game-restarted');
      socket.off('connect', handleConnect);
    };
  }, [router]);

  const handleRevealClue = () => {
    console.log('👆 handleRevealClue chamado, myId:', myId, 'currentPlayerIndex:', currentPlayerIndex, 'players:', players.map(p => ({ id: p.id, name: p.name })));
    socketRef.current?.emit('pass-turn');
    isRevealingRef.current = false;
  };

  const handleRevealSpecificClue = (clueIndex: number) => {
    // Bloquear IMEDIATAMENTE se já está revelando (síncrono)
    if (isRevealingRef.current) {
      console.log('🚫 Revelação bloqueada: aguarde a sincronização');
      return;
    }
    
    // Apenas o jogador da vez pode revelar
    if (currentPlayerIndex !== players.findIndex(p => p.id === myId)) return;
    // Apenas se a dica ainda não foi revelada
    if (revealedClueIndices.includes(clueIndex)) return;
    
    // Marcar imediatamente como revelando (síncrono para bloquear cliques rápidos)
    isRevealingRef.current = true;
    console.log('✅ Revelando dica', clueIndex);
    
    socketRef.current?.emit('reveal-clue', clueIndex); // Enviar índice da dica clicada
  };

  const handleSubmitAnswer = () => {
    if (!playerAnswer.trim() || hasAnswered || isSubmitting) return;
    
    setIsSubmitting(true);
    console.log('Enviando resposta:', playerAnswer.trim());
    
    socketRef.current?.emit('submit-answer', playerAnswer.trim());
    setPlayerAnswer('');
    setHasAnswered(true);
    isRevealingRef.current = false;
    
    // Liberar após 1 segundo (segurança)
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const handleValidateAnswer = (answerId: number, isCorrect: boolean) => {
    socketRef.current?.emit('validate-answer', { answerId, isCorrect, casesToMove: isCorrect ? casesToMove : 1 });
    if (isCorrect) {
      setCasesToMove(1);
    }
  };
  
  const handleRevealAnswer = () => {
    if (revealedClueIndices.length >= 10) {
      socketRef.current?.emit('reveal-answer');
    }
  };

  const currentPlayer = players[currentPlayerIndex];

  // Tela de carregamento
  if (isLoading || !currentCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Carregando jogo...</h2>
          <p className="text-gray-600">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // Visão do HOST
  if (isHost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Cabeçalho */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h1 className="text-2xl font-bold text-center text-gray-800">
              <StarIcon className="mr-2" /> Visão do HOST
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Carta Completa */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 mb-4">
                <h2 className="text-2xl font-bold text-white text-center">
                  {currentCard.nome}
                </h2>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentCard.dicas.map((dica, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      revealedClueIndices.includes(index)
                        ? 'bg-green-100 border border-green-500'
                        : 'bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-gray-700">{index + 1}.</span>{' '}
                    <span className="text-gray-800">{dica}</span>
                  </div>
                ))}
              </div>

              {revealedClueIndices.length >= 10 ? (
                <button
                  onClick={handleRevealAnswer}
                  className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
                >
                  <MenuBookIcon /> Revelar Resposta e Passar
                </button>
              ) : (
                <button
                  onClick={handleRevealClue}
                  disabled={true}
                  className="w-full mt-4 bg-gray-400 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  title="Host não pode revelar dicas. Apenas o jogador da vez pode passar para a próxima dica."
                >
                  <StarIcon /> Host não revela dicas
                </button>
              )}
            </div>

            {/* Respostas e Controles */}
            <div className="space-y-4">
              {/* Card do Host */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
                  <StarIcon /> Mestre da Partida
                </h3>
                {players.filter(p => p.isHost).map((host) => (
                  <div key={host.id} className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-300 text-lg">{host.name}</span>
                      <span className="font-bold text-white text-lg">{host.score} pts</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Placar - Apenas Jogadores */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2"><SportsScoreIcon /> Placar</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {players.filter(p => !p.isHost).map((player) => {
                    const playerIndex = players.findIndex(p => p.id === player.id);
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          playerIndex === currentPlayerIndex
                            ? 'bg-yellow-100 border-2 border-yellow-500'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          {playerIndex === currentPlayerIndex && <NavigateNextIcon className="text-green-600" />}
                          {player.name}
                        </span>
                        <span className="font-bold text-gray-700">{player.score} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Respostas Recebidas */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold mb-3 text-gray-800">
                  Respostas ({answers.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {answers.length === 0 ? (
                    <p className="text-gray-500 text-center">Aguardando respostas...</p>
                  ) : (
                    answers.map((answer) => (
                      <div key={answer.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">{answer.playerName}</span>
                        </div>
                        <p className="text-gray-700 mb-3">{answer.answer}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleValidateAnswer(answer.id, true)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckIcon /> Correto
                          </button>
                          <button
                            onClick={() => handleValidateAnswer(answer.id, false)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <CancelIcon /> Errado
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Controle de Pontos */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold mb-3 text-gray-800">Casas para o acerto</h3>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={casesToMove}
                  onChange={(e) => setCasesToMove(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notificação de Resposta Correta */}
        {showCorrectAnswer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-bounce">
              <h2 className="text-3xl font-bold text-center text-green-600 mb-4 flex items-center justify-center gap-2">
                <CheckCircleIcon fontSize="inherit" /> CORRETO!
              </h2>
              <p className="text-xl text-center text-gray-700 mb-2">
                <strong>{winnerName}</strong> acertou!
              </p>
              <p className="text-2xl font-bold text-center text-purple-600">
                {correctAnswerText}
              </p>
            </div>
          </div>
        )}

        {/* Notificação de Resposta Errada */}
        {showErrorAnswer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-bounce">
              <h2 className="text-3xl font-bold text-center text-red-600 mb-4">
                ✗ ERRADO!
              </h2>
              <p className="text-xl text-center text-gray-700 mb-2">
                <strong>{errorPlayerName}</strong> errou!
              </p>
              <p className="text-lg text-center text-gray-600">
                Resposta: <span className="font-bold text-red-600">&quot;{errorAnswer}&quot;</span>
              </p>
              <p className="text-lg text-center text-gray-500 mt-2">
                Vez do próximo jogador
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Visão dos JOGADORES
  const isMyTurn = currentPlayerId === myId;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Cabeçalho */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Jogo Perfil
          </h1>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">
              Vez de: <strong>{currentPlayer?.name}</strong>
            </span>
            {isMyTurn && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-600 text-white font-bold border-2 border-green-800">
                <WhatshotIcon /> É sua vez!
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Coluna de Placares */}
          <div className="space-y-4">
            {/* Card do Host */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
                <StarIcon /> Mestre
              </h3>
              {players.filter(p => p.isHost).map((host) => (
                <div key={host.id} className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-300">{host.name}</span>
                    <span className="font-bold text-white">{host.score} pts</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Placar - Apenas Jogadores */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2"><GroupIcon /> Jogadores</h3>
              <div className="space-y-2">
                {players.filter(p => !p.isHost).map((player) => {
                  const playerIndex = players.findIndex(p => p.id === player.id);
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        playerIndex === currentPlayerIndex
                          ? 'bg-yellow-100 border-2 border-yellow-500'
                          : player.id === myId
                          ? 'bg-purple-100 border border-purple-500'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <span className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                        {playerIndex === currentPlayerIndex && <NavigateNextIcon className="text-green-600" />}
                        {player.name}
                        {player.id === myId && ' (Você)'}
                      </span>
                      <span className="font-bold text-gray-700 text-sm">{player.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Carta com Dicas */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
              {showCorrectAnswer ? correctAnswerText : '????'}
            </h2>

            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
              {currentCard.dicas.map((dica, index) => {
                const isRevealed = revealedClueIndices.includes(index);
                const hasPendingAnswers = answers.length > 0;
                const canReveal = isMyTurn && !isRevealed && revealedClueIndices.length < 10 && !hasPendingAnswers;
                
                return (
                  <div
                    key={index}
                    onClick={() => canReveal && handleRevealSpecificClue(index)}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      isRevealed
                        ? 'bg-green-100 border border-green-500'
                        : canReveal
                        ? 'bg-yellow-100 border-2 border-yellow-500 cursor-pointer hover:bg-yellow-200 hover:scale-105'
                        : 'bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {isRevealed ? (
                      <>
                        <span className="font-bold text-gray-700">{index + 1}.</span>{' '}
                        <span className="text-gray-800">{dica}</span>
                      </>
                    ) : canReveal ? (
                      <span className="text-yellow-700 font-semibold flex items-center gap-1"><VisibilityIcon fontSize="small" /> Clique para revelar a dica {index + 1}</span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-1"><VisibilityOffIcon fontSize="small" /> Dica bloqueada</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mensagem informativa */}
            {isMyTurn && revealedClueIndices.length < 10 && answers.length === 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
                <p className="text-blue-800 text-center text-sm font-medium flex items-center justify-center gap-1">
                  <VisibilityIcon fontSize="small" /> Clique em uma dica amarela para revelá-la ou passe a vez
                </p>
              </div>
            )}
            
            {/* Mensagem de aguardando validação */}
            {isMyTurn && answers.length > 0 && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-300 rounded-lg">
                <p className="text-orange-800 text-center text-sm font-medium flex items-center justify-center gap-1">
                  <TimerIcon fontSize="small" /> Aguarde o host validar as respostas para continuar
                </p>
              </div>
            )}

            {/* Botão Passar a Vez */}
            {isMyTurn && revealedClueIndices.length < 10 && (
              <button
                onClick={handleRevealClue}
                className="w-full mb-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
              >
                <NavigateNextIcon /> Passar a Vez
              </button>
            )}

            {/* Campo de Resposta */}
            <div className="space-y-2">
              <input
                type="text"
                value={playerAnswer}
                onChange={(e) => setPlayerAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                placeholder={!isMyTurn ? "Não é sua vez" : hasAnswered ? "Você já respondeu" : "Digite sua resposta..."}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800"
                disabled={showCorrectAnswer || hasAnswered || !isMyTurn}
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!playerAnswer.trim() || showCorrectAnswer || hasAnswered || isSubmitting || !isMyTurn}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {hasAnswered ? <CheckIcon /> : isSubmitting ? <TimerIcon /> : !isMyTurn ? <LockIcon /> : <SendIcon />}
                {hasAnswered ? 'Resposta Enviada' : isSubmitting ? 'Enviando...' : !isMyTurn ? 'Aguarde sua vez' : 'Enviar Resposta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notificação de Resposta Correta */}
      {showCorrectAnswer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-bounce">
            <h2 className="text-3xl font-bold text-center text-green-600 mb-4 flex items-center justify-center gap-2">
              <CheckCircleIcon fontSize="inherit" /> CORRETO!
            </h2>
            <p className="text-xl text-center text-gray-700 mb-2">
              <strong>{winnerName}</strong> acertou!
            </p>
            <p className="text-2xl font-bold text-center text-purple-600">
              {correctAnswerText}
            </p>
          </div>
        </div>
      )}

      {/* Notificação de Resposta Errada */}
      {showErrorAnswer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-bounce">
            <h2 className="text-3xl font-bold text-center text-red-600 mb-4 flex items-center justify-center gap-2">
              <CancelIcon fontSize="inherit" /> ERRADO!
            </h2>
            <p className="text-xl text-center text-gray-700 mb-2">
              <strong>{errorPlayerName}</strong> errou!
            </p>
            <p className="text-lg text-center text-gray-600 mb-2">
              Resposta: <span className="font-bold text-red-600">&quot;{errorAnswer}&quot;</span>
            </p>
            <p className="text-lg text-center text-gray-500">
              Vez do próximo jogador
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
