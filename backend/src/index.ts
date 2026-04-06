import { createServer } from 'http';
import { initSocket } from './socket';
import { db } from './db';

const PORT = 3001;
const HOST = '0.0.0.0';

const httpServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (req.url === '/game-state' && req.method === 'GET') {
    const { gerenciadorJogo } = require('./game');
    const sessao = gerenciadorJogo.buscarSessaoAtiva();
    if (!sessao) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ active: false }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      active: true,
      sessionId: sessao.id,
      host: sessao.nome_host,
      players: gerenciadorJogo.getJogadores().map((j: any) => ({
        name: j.nome_jogador,
        score: j.pontuacao,
        isHost: j.e_host
      })),
      gameStarted: gerenciadorJogo.getJogoIniciado(),
      currentCard: gerenciadorJogo.getCartaAtual()?.nome
    }));
    return;
  }

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'API Jogo Perfil',
      version: '1.0.0',
      endpoints: {
        health: 'GET /health',
        game: 'WebSocket em porta ' + PORT
      }
    }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

initSocket(httpServer);

httpServer.listen(PORT, HOST, () => {
  console.log(`🦊 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`🔌 Socket.io aguardando conexões na porta ${PORT}`);
  console.log(`📡 API disponível em http://${HOST}:${PORT}`);
});

console.log('✅ Banco de dados inicializado');
