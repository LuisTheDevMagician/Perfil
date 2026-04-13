import { createServer } from 'http';
import { initSocket } from './socket';
import { gerenciadorJogo } from './game';
import { queries } from './db/queries';
import { seedInitialData } from './db/seed';
import './db';

const PORT = 3001;
const HOST = '0.0.0.0';

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  gerenciadorJogo.limparTudo();
  process.exit(0);
});

// Run seed on startup
seedInitialData();

function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

async function handleApiRequest(req: any, res: any) {
  const url = req.url || '';
  const method = req.method;
  const baseUrl = '/api/';
  
  res.setHeader('Content-Type', 'application/json');
  
  if (!url.startsWith(baseUrl)) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  
  const path = url.replace(baseUrl, '');
  const parts = path.split('/');
  
  try {
    if (parts[0] === 'disciplinas') {
      if (method === 'GET' && parts.length === 1) {
        res.end(JSON.stringify(queries.listarDisciplinas()));
        return;
      }
      if (method === 'GET' && parts.length === 2) {
        const disciplina = queries.buscarDisciplinaPorId(Number(parts[1]));
        res.end(JSON.stringify(disciplina || { error: 'Disciplina não encontrada' }));
        return;
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.nome?.trim()) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Nome é obrigatório' }));
          return;
        }
        const id = queries.criarDisciplina(body.nome.trim());
        res.end(JSON.stringify({ id, nome: body.nome }));
        return;
      }
      if (method === 'PUT' && parts.length === 2) {
        const body = await parseBody(req);
        if (!body.nome?.trim()) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Nome é obrigatório' }));
          return;
        }
        queries.atualizarDisciplina(Number(parts[1]), body.nome.trim());
        res.end(JSON.stringify({ success: true }));
        return;
      }
      if (method === 'DELETE' && parts.length === 2) {
        queries.excluirDisciplina(Number(parts[1]));
        res.end(JSON.stringify({ success: true }));
        return;
      }
    }
    
    if (parts[0] === 'temas') {
      if (method === 'GET' && parts.length === 1) {
        res.end(JSON.stringify(queries.listarTemas()));
        return;
      }
      if (method === 'GET' && parts.length === 2) {
        const tema = queries.buscarTemaPorId(Number(parts[1]));
        res.end(JSON.stringify(tema || { error: 'Tema não encontrado' }));
        return;
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.nome?.trim()) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Nome é obrigatório' }));
          return;
        }
        if (!body.disciplinaId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Disciplina é obrigatória' }));
          return;
        }
        const id = queries.criarTema(body.nome.trim(), body.disciplinaId);
        res.end(JSON.stringify({ id, nome: body.nome, disciplinaId: body.disciplinaId }));
        return;
      }
      if (method === 'PUT' && parts.length === 2) {
        const body = await parseBody(req);
        if (!body.nome?.trim()) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Nome é obrigatório' }));
          return;
        }
        if (!body.disciplinaId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Disciplina é obrigatória' }));
          return;
        }
        queries.atualizarTema(Number(parts[1]), body.nome.trim(), body.disciplinaId);
        res.end(JSON.stringify({ success: true }));
        return;
      }
      if (method === 'DELETE' && parts.length === 2) {
        queries.excluirTema(Number(parts[1]));
        res.end(JSON.stringify({ success: true }));
        return;
      }
    }
    
    if (parts[0] === 'cartas') {
      if (method === 'GET' && parts.length === 1) {
        res.end(JSON.stringify(queries.buscarTodasCartas()));
        return;
      }
      if (method === 'GET' && parts.length === 2) {
        const carta = queries.buscarCartaPorId(Number(parts[1]));
        if (!carta) {
          res.end(JSON.stringify({ error: 'Carta não encontrada' }));
          return;
        }
        res.end(JSON.stringify({ ...carta, dicas: JSON.parse(carta.dicas) }));
        return;
      }
      if (method === 'GET' && parts[1] === 'tema' && parts.length === 3) {
        res.end(JSON.stringify(queries.buscarCartasPorTema(Number(parts[2]))));
        return;
      }
      if (method === 'GET' && parts[1] === 'disciplina' && parts.length === 3) {
        res.end(JSON.stringify(queries.buscarCartasPorDisciplina(Number(parts[2]))));
        return;
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        if (!body.nome?.trim()) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Nome é obrigatório' }));
          return;
        }
        if (!body.temaId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Tema é obrigatório' }));
          return;
        }
        if (!body.dicas || !Array.isArray(body.dicas)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Dicas é obrigatório' }));
          return;
        }
        if (body.dicas.length !== 10) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Carta deve ter exatamente 10 dicas' }));
          return;
        }
        for (let i = 0; i < body.dicas.length; i++) {
          if (!body.dicas[i]?.trim()) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: `Dica ${i + 1} é obrigatória` }));
            return;
          }
        }
        const id = queries.criarCarta(body.nome.trim(), body.temaId, body.dicas.map((d: string) => d.trim()));
        res.end(JSON.stringify({ id, nome: body.nome, temaId: body.temaId, dicas: body.dicas }));
        return;
      }
      if (method === 'PUT' && parts.length === 2) {
        const body = await parseBody(req);
        if (!body.nome?.trim()) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Nome é obrigatório' }));
          return;
        }
        if (!body.temaId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Tema é obrigatório' }));
          return;
        }
        if (!body.dicas || !Array.isArray(body.dicas) || body.dicas.length !== 10) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Carta deve ter exatamente 10 dicas' }));
          return;
        }
        queries.atualizarCarta(Number(parts[1]), body.nome.trim(), body.temaId, body.dicas.map((d: string) => d.trim()));
        res.end(JSON.stringify({ success: true }));
        return;
      }
      if (method === 'DELETE' && parts.length === 2) {
        queries.excluirCarta(Number(parts[1]));
        res.end(JSON.stringify({ success: true }));
        return;
      }
    }
    
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
  } catch (error: any) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
}

const httpServer = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url?.startsWith('/api/')) {
    await handleApiRequest(req, res);
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (req.url === '/game-state' && req.method === 'GET') {
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
