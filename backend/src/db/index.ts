import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

export const sqlite = new Database('./data/quiz.db');

sqlite.run('PRAGMA journal_mode = WAL');
sqlite.run('PRAGMA foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export function initDatabase() {
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS sessoes_jogo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_host TEXT NOT NULL,
      id_carta_atual INTEGER DEFAULT 0,
      dicas_reveladas TEXT DEFAULT '[]',
      id_jogador_atual INTEGER DEFAULT 0,
      esta_ativa INTEGER DEFAULT 1,
      revelou_esta_turno INTEGER DEFAULT 0,
      data_criacao TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    sqlite.run('ALTER TABLE sessoes_jogo ADD COLUMN revelou_esta_turno INTEGER DEFAULT 0');
  } catch {
    // Coluna já existe
  }

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS jogadores_sessao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sessao INTEGER NOT NULL,
      id_socket TEXT NOT NULL,
      session_id TEXT NOT NULL,
      nome_jogador TEXT NOT NULL,
      pontuacao INTEGER DEFAULT 0,
      rolagem_dado INTEGER,
      e_host INTEGER DEFAULT 0,
      e_turno_atual INTEGER DEFAULT 0,
      FOREIGN KEY (id_sessao) REFERENCES sessoes_jogo(id) ON DELETE CASCADE
    )
  `);

  try {
    sqlite.run('ALTER TABLE jogadores_sessao ADD COLUMN session_id TEXT DEFAULT ""');
  } catch {
    // Coluna já existe
  }

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS respostas_pendentes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_sessao INTEGER NOT NULL,
      nome_jogador TEXT NOT NULL,
      resposta TEXT NOT NULL,
      data_envio TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_sessao) REFERENCES sessoes_jogo(id) ON DELETE CASCADE
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS jogadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE NOT NULL,
      pontuacao_total INTEGER DEFAULT 0,
      total_vitorias INTEGER DEFAULT 0
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS historico_partidas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_vencedor TEXT,
      pontuacao_vencedor INTEGER,
      total_jogadores INTEGER,
      data_fim TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS disciplinas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS temas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      disciplina_id INTEGER NOT NULL,
      FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id) ON DELETE CASCADE
    )
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS cartas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tema_id INTEGER NOT NULL,
      dicas TEXT NOT NULL,
      FOREIGN KEY (tema_id) REFERENCES temas(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Banco de dados inicializado com sucesso');
}

initDatabase();
