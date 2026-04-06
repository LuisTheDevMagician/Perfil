import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const sessoesJogo = sqliteTable('sessoes_jogo', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nomeHost: text('nome_host').notNull(),
  idCartaAtual: integer('id_carta_atual').default(0),
  dicasReveladas: text('dicas_reveladas').default('[]'),
  idJogadorAtual: integer('id_jogador_atual').default(0),
  estaAtiva: integer('esta_ativa').default(1),
  dataCriacao: text('data_criacao').default(new Date().toISOString()),
});

export const jogadoresSessao = sqliteTable('jogadores_sessao', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  idSessao: integer('id_sessao').references(() => sessoesJogo.id),
  idSocket: text('id_socket').notNull(),
  nomeJogador: text('nome_jogador').notNull(),
  pontuacao: integer('pontuacao').default(0),
  rolagemDado: integer('rolagem_dado'),
  eHost: integer('e_host').default(0),
  eTurnoAtual: integer('e_turno_atual').default(0),
});

export const respostasPendentes = sqliteTable('respostas_pendentes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  idSessao: integer('id_sessao').references(() => sessoesJogo.id),
  nomeJogador: text('nome_jogador').notNull(),
  resposta: text('resposta').notNull(),
  dataEnvio: text('data_envio').default(new Date().toISOString()),
});

export const jogadores = sqliteTable('jogadores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').unique().notNull(),
  pontuacaoTotal: integer('pontuacao_total').default(0),
  totalVitorias: integer('total_vitorias').default(0),
});

export const historicoPartidas = sqliteTable('historico_partidas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nomeVencedor: text('nome_vencedor'),
  pontuacaoVencedor: integer('pontuacao_vencedor'),
  totalJogadores: integer('total_jogadores'),
  dataFim: text('data_fim').default(new Date().toISOString()),
});
