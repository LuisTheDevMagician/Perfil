import { sqlite } from './index';

export const queries = {
  criarSessao: (nomeHost: string): number => {
    const stmt = sqlite.prepare('INSERT INTO sessoes_jogo (nome_host) VALUES (?)');
    const result = stmt.run(nomeHost);
    return Number(result.lastInsertRowid);
  },

  buscarSessaoAtiva: () => {
    const stmt = sqlite.prepare('SELECT * FROM sessoes_jogo WHERE esta_ativa = 1 LIMIT 1');
    return stmt.get() as any;
  },

  buscarSessaoPorId: (id: number) => {
    const stmt = sqlite.prepare('SELECT * FROM sessoes_jogo WHERE id = ?');
    return stmt.get(id) as any;
  },

  atualizarSessao: (id: number, data: {
    idCartaAtual?: number;
    dicasReveladas?: string;
    idJogadorAtual?: number;
    estaAtiva?: number;
  }) => {
    const sets: string[] = [];
    const values: any[] = [];
    
    if (data.idCartaAtual !== undefined) {
      sets.push('id_carta_atual = ?');
      values.push(data.idCartaAtual);
    }
    if (data.dicasReveladas !== undefined) {
      sets.push('dicas_reveladas = ?');
      values.push(data.dicasReveladas);
    }
    if (data.idJogadorAtual !== undefined) {
      sets.push('id_jogador_atual = ?');
      values.push(data.idJogadorAtual);
    }
    if (data.estaAtiva !== undefined) {
      sets.push('esta_ativa = ?');
      values.push(data.estaAtiva);
    }
    
    values.push(id);
    const stmt = sqlite.prepare(`UPDATE sessoes_jogo SET ${sets.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  },

  encerrarSessao: (id: number) => {
    const stmt = sqlite.prepare('UPDATE sessoes_jogo SET esta_ativa = 0 WHERE id = ?');
    return stmt.run(id);
  },

  adicionarJogador: (idSessao: number, idSocket: string, sessionId: string, nomeJogador: string, eHost: number): number => {
    const stmt = sqlite.prepare(`
      INSERT INTO jogadores_sessao (id_sessao, id_socket, session_id, nome_jogador, pontuacao, rolagem_dado, e_host, e_turno_atual)
      VALUES (?, ?, ?, ?, 0, ?, ?, 0)
    `);
    const result = stmt.run(idSessao, idSocket, sessionId, nomeJogador, eHost === 1 ? 0 : null, eHost);
    return Number(result.lastInsertRowid);
  },

  buscarJogadoresSessao: (idSessao: number) => {
    const stmt = sqlite.prepare('SELECT * FROM jogadores_sessao WHERE id_sessao = ? ORDER BY e_host DESC, rolagem_dado DESC');
    return stmt.all(idSessao) as any[];
  },

  buscarJogadorPorSocket: (idSocket: string) => {
    const stmt = sqlite.prepare('SELECT * FROM jogadores_sessao WHERE id_socket = ?');
    return stmt.get(idSocket) as any;
  },

  buscarJogadorPorSessionId: (sessionId: string) => {
    const stmt = sqlite.prepare('SELECT * FROM jogadores_sessao WHERE session_id = ?');
    return stmt.get(sessionId) as any;
  },

  atualizarSocketJogador: (id: number, idSocket: string) => {
    const stmt = sqlite.prepare('UPDATE jogadores_sessao SET id_socket = ? WHERE id = ?');
    return stmt.run(idSocket, id);
  },

  atualizarJogador: (id: number, data: { pontuacao?: number; rolagemDado?: number | null; eTurnoAtual?: number }) => {
    const sets: string[] = [];
    const values: any[] = [];
    
    if (data.pontuacao !== undefined) {
      sets.push('pontuacao = ?');
      values.push(data.pontuacao);
    }
    if (data.rolagemDado !== undefined) {
      sets.push('rolagem_dado = ?');
      values.push(data.rolagemDado);
    }
    if (data.eTurnoAtual !== undefined) {
      sets.push('e_turno_atual = ?');
      values.push(data.eTurnoAtual);
    }
    
    values.push(id);
    const stmt = sqlite.prepare(`UPDATE jogadores_sessao SET ${sets.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  },

  atualizarPontuacaoPorSocket: (idSocket: string, pontuacao: number) => {
    const stmt = sqlite.prepare('UPDATE jogadores_sessao SET pontuacao = ? WHERE id_socket = ?');
    return stmt.run(pontuacao, idSocket);
  },

  removerJogador: (idSocket: string) => {
    const stmt = sqlite.prepare('DELETE FROM jogadores_sessao WHERE id_socket = ?');
    return stmt.run(idSocket);
  },

  adicionarRespostaPendente: (idSessao: number, nomeJogador: string, resposta: string): number => {
    const stmt = sqlite.prepare('INSERT INTO respostas_pendentes (id_sessao, nome_jogador, resposta) VALUES (?, ?, ?)');
    const result = stmt.run(idSessao, nomeJogador, resposta);
    return Number(result.lastInsertRowid);
  },

  buscarRespostasSessao: (idSessao: number) => {
    const stmt = sqlite.prepare('SELECT * FROM respostas_pendentes WHERE id_sessao = ?');
    return stmt.all(idSessao) as any[];
  },

  removerResposta: (id: number) => {
    const stmt = sqlite.prepare('DELETE FROM respostas_pendentes WHERE id = ?');
    return stmt.run(id);
  },

  limparRespostasSessao: (idSessao: number) => {
    const stmt = sqlite.prepare('DELETE FROM respostas_pendentes WHERE id_sessao = ?');
    return stmt.run(idSessao);
  },

  upsertJogador: (nome: string) => {
    const stmt = sqlite.prepare('INSERT OR IGNORE INTO jogadores (nome) VALUES (?)');
    return stmt.run(nome);
  },

  atualizarPontuacaoJogador: (nome: string, pontuacao: number) => {
    const stmt = sqlite.prepare('UPDATE jogadores SET pontuacao_total = pontuacao_total + ? WHERE nome = ?');
    return stmt.run(pontuacao, nome);
  },

  adicionarVitoria: (nome: string) => {
    const stmt = sqlite.prepare('UPDATE jogadores SET total_vitorias = total_vitorias + 1 WHERE nome = ?');
    return stmt.run(nome);
  },

  adicionarHistoricoPartida: (nomeVencedor: string | null, pontuacaoVencedor: number | null, totalJogadores: number) => {
    const stmt = sqlite.prepare('INSERT INTO historico_partidas (nome_vencedor, pontuacao_vencedor, total_jogadores) VALUES (?, ?, ?)');
    return stmt.run(nomeVencedor, pontuacaoVencedor, totalJogadores);
  },

  buscarRanking: () => {
    const stmt = sqlite.prepare('SELECT nome, pontuacao_total, total_vitorias FROM jogadores ORDER BY pontuacao_total DESC LIMIT 10');
    return stmt.all() as any[];
  },

  limparSessao: () => {
    sqlite.prepare('DELETE FROM respostas_pendentes').run();
    sqlite.prepare('DELETE FROM jogadores_sessao').run();
    sqlite.prepare('UPDATE sessoes_jogo SET esta_ativa = 0').run();
    console.log('🧹 Sessão limpiada do banco de dados');
  },
};
