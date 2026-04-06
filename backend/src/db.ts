import { Database } from 'bun:sqlite';
import { Elysia } from 'elysia';

const DB_PATH = './data/quiz.db';

const db = new Database(DB_PATH);

db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessoes_jogo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_host TEXT NOT NULL,
      id_carta_atual INTEGER DEFAULT 0,
      dicas_reveladas TEXT DEFAULT '[]',
      id_jogador_atual INTEGER DEFAULT 0,
      esta_ativa INTEGER DEFAULT 1,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS jogadores_sessao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sessao INTEGER NOT NULL,
      id_socket TEXT NOT NULL,
      nome_jogador TEXT NOT NULL,
      pontuacao INTEGER DEFAULT 0,
      rolagem_dado INTEGER,
      e_host INTEGER DEFAULT 0,
      e_turno_atual INTEGER DEFAULT 0,
      FOREIGN KEY (id_sessao) REFERENCES sessoes_jogo(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS respostas_pendentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sessao INTEGER NOT NULL,
      nome_jogador TEXT NOT NULL,
      resposta TEXT NOT NULL,
      data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_sessao) REFERENCES sessoes_jogo(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS jogadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE NOT NULL,
      pontuacao_total INTEGER DEFAULT 0,
      total_vitorias INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historico_partidas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_vencedor TEXT,
      pontuacao_vencedor INTEGER,
      total_jogadores INTEGER,
      data_fim DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Banco de dados inicializado com sucesso');
}

initDatabase();

export { db };

export const queries = {
  criarSessao: db.prepare(`
    INSERT INTO sessoes_jogo (nome_host) VALUES (@nome_host)
  `),
  
  buscarSessaoAtiva: db.prepare(`
    SELECT * FROM sessoes_jogo WHERE esta_ativa = 1 LIMIT 1
  `),
  
  buscarSessaoPorId: db.prepare(`
    SELECT * FROM sessoes_jogo WHERE id = @id
  `),
  
  atualizarSessao: db.prepare(`
    UPDATE sessoes_jogo 
    SET id_carta_atual = @id_carta_atual,
        dicas_reveladas = @dicas_reveladas,
        id_jogador_atual = @id_jogador_atual,
        esta_ativa = @esta_ativa
    WHERE id = @id
  `),
  
  encerrarSessao: db.prepare(`
    UPDATE sessoes_jogo SET esta_ativa = 0 WHERE id = @id
  `),
  
  adicionarJogadorSessao: db.prepare(`
    INSERT INTO jogadores_sessao (id_sessao, id_socket, nome_jogador, pontuacao, rolagem_dado, e_host, e_turno_atual)
    VALUES (@id_sessao, @id_socket, @nome_jogador, @pontuacao, @rolagem_dado, @e_host, @e_turno_atual)
  `),
  
  buscarJogadoresSessao: db.prepare(`
    SELECT * FROM jogadores_sessao WHERE id_sessao = @id_sessao ORDER BY e_host DESC, rolagem_dado DESC
  `),
  
  buscarJogadorPorSocket: db.prepare(`
    SELECT * FROM jogadores_sessao WHERE id_socket = @id_socket
  `),
  
  atualizarJogador: db.prepare(`
    UPDATE jogadores_sessao 
    SET pontuacao = @pontuacao,
        rolagem_dado = @rolagem_dado,
        e_turno_atual = @e_turno_atual
    WHERE id = @id
  `),
  
  atualizarPontuacaoPorSocket: db.prepare(`
    UPDATE jogadores_sessao SET pontuacao = @pontuacao WHERE id_socket = @id_socket
  `),
  
  removerJogador: db.prepare(`
    DELETE FROM jogadores_sessao WHERE id_socket = @id_socket
  `),
  
  adicionarRespostaPendente: db.prepare(`
    INSERT INTO respostas_pendentes (id_sessao, nome_jogador, resposta)
    VALUES (@id_sessao, @nome_jogador, @resposta)
  `),
  
  buscarRespostasSessao: db.prepare(`
    SELECT * FROM respostas_pendentes WHERE id_sessao = @id_sessao
  `),
  
  removerResposta: db.prepare(`
    DELETE FROM respostas_pendentes WHERE id = @id
  `),
  
  limparRespostasSessao: db.prepare(`
    DELETE FROM respostas_pendentes WHERE id_sessao = @id_sessao
  `),
  
  upsertJogador: db.prepare(`
    INSERT INTO jogadores (nome) VALUES (@nome)
    ON CONFLICT(nome) DO NOTHING
  `),
  
  atualizarPontuacaoJogador: db.prepare(`
    UPDATE jogadores SET pontuacao_total = pontuacao_total + @pontuacao WHERE nome = @nome
  `),
  
  adicionarVitoria: db.prepare(`
    UPDATE jogadores SET total_vitorias = total_vitorias + 1 WHERE nome = @nome
  `),
  
  adicionarHistoricoPartida: db.prepare(`
    INSERT INTO historico_partidas (nome_vencedor, pontuacao_vencedor, total_jogadores)
    VALUES (@nome_vencedor, @pontuacao_vencedor, @total_jogadores)
  `),
  
  buscarRanking: db.prepare(`
    SELECT nome, pontuacao_total, total_vitorias FROM jogadores ORDER BY pontuacao_total DESC LIMIT 10
  `)
};
