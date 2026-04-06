import { db, queries } from './db';
import { gameCards, type Carta, type Jogador, type RespostaPendente, type SessaoJogo } from './models';

export class GerenciadorJogo {
  private sessaoAtual: SessaoJogo | null = null;
  private jogadoresMap: Map<string, Jogador> = new Map();
  private respostasMap: Map<number, RespostaPendente[]> = new Map();
  private jogoIniciado: boolean = false;
  private jogoEncerrado: boolean = false;
  private revelouEstaTurno: boolean = false;

  constructor() {
    this.carregarSessaoAtiva();
  }

  private carregarSessaoAtiva() {
    try {
      const row = queries.buscarSessaoAtiva.get() as any;
      if (row) {
        this.sessaoAtual = {
          id: row.id,
          nome_host: row.nome_host,
          id_carta_atual: row.id_carta_atual,
          dicas_reveladas: row.dicas_reveladas,
          id_jogador_atual: row.id_jogador_atual,
          esta_ativa: row.esta_ativa === 1,
          data_criacao: row.data_criacao
        };
        this.carregarJogadoresSessao(this.sessaoAtual.id);
        console.log('✅ Sessão ativa carregada do banco:', this.sessaoAtual.id);
      }
    } catch (e) {
      console.log('Nenhuma sessão ativa encontrada');
    }
  }

  private carregarJogadoresSessao(idSessao: number) {
    const jogadores = queries.buscarJogadoresSessao.all({ id_sessao: idSessao }) as any[];
    this.jogadoresMap.clear();
    for (const j of jogadores) {
      const jogador: Jogador = {
        id: j.id,
        id_sessao: j.id_sessao,
        id_socket: j.id_socket,
        nome_jogador: j.nome_jogador,
        pontuacao: j.pontuacao,
        rolagem_dado: j.rolagem_dado,
        e_host: j.e_host === 1,
        e_turno_atual: j.e_turno_atual === 1
      };
      this.jogadoresMap.set(j.id_socket, jogador);
    }
  }

  criarSessao(nomeHost: string): number {
    const result = queries.criarSessao.run({ nome_host: nomeHost });
    const idSessao = Number(result.lastInsertId);
    this.sessaoAtual = {
      id: idSessao,
      nome_host: nomeHost,
      id_carta_atual: 0,
      dicas_reveladas: '[]',
      id_jogador_atual: 0,
      esta_ativa: true,
      data_criacao: new Date().toISOString()
    };
    this.jogadoresMap.clear();
    this.jogoIniciado = false;
    this.jogoEncerrado = false;
    this.revelouEstaTurno = false;
    console.log('✅ Sessão criada:', idSessao);
    return idSessao;
  }

  getSessaoAtual(): SessaoJogo | null {
    return this.sessaoAtual;
  }

  buscarSessaoAtiva(): SessaoJogo | null {
    if (this.sessaoAtual && this.sessaoAtual.esta_ativa) {
      return this.sessaoAtual;
    }
    return null;
  }

  getJogadores(): Jogador[] {
    return Array.from(this.jogadoresMap.values());
  }

  getJogadorPorSocket(idSocket: string): Jogador | undefined {
    return this.jogadoresMap.get(idSocket);
  }

  getJogadorPorNome(nome: string): Jogador | undefined {
    return Array.from(this.jogadoresMap.values()).find(j => j.nome_jogador === nome);
  }

  adicionarJogador(idSocket: string, nome: string): Jogador | null {
    if (this.jogadoresMap.size >= 11) {
      return null;
    }
    const existing = this.getJogadorPorNome(nome);
    if (existing) {
      return null;
    }
    const eHost = this.jogadoresMap.size === 0;
    const pontuacao = 0;
    const rolagemDado = eHost ? 0 : null;
    const eTurnoAtual = false;
    
    queries.adicionarJogadorSessao.run({
      id_sessao: this.sessaoAtual!.id,
      id_socket: idSocket,
      nome_jogador: nome,
      pontuacao: pontuacao,
      rolagem_dado: rolagemDado,
      e_host: eHost ? 1 : 0,
      e_turno_atual: eTurnoAtual ? 1 : 0
    });

    const row = (db.query('SELECT last_insert_rowid() as id').get() as any);
    const idJogador = Number(row.id);

    const jogador: Jogador = {
      id: idJogador,
      id_sessao: this.sessaoAtual!.id,
      id_socket: idSocket,
      nome_jogador: nome,
      pontuacao: pontuacao,
      rolagem_dado: rolagemDado,
      e_host: eHost,
      e_turno_atual: eTurnoAtual
    };
    this.jogadoresMap.set(idSocket, jogador);

    queries.upsertJogador.run({ nome: nome });

    console.log(`✅ Jogador adicionado: ${nome} (${eHost ? 'HOST' : 'JOGADOR'})`);
    return jogador;
  }

  atualizarRolagemDado(idSocket: string, rolagem: number) {
    const jogador = this.jogadoresMap.get(idSocket);
    if (jogador && !jogador.e_host) {
      jogador.rolagem_dado = rolagem;
      queries.atualizarJogador.run({
        id: jogador.id,
        pontuacao: jogador.pontuacao,
        rolagem_dado: rolagem,
        e_turno_atual: jogador.e_turno_atual ? 1 : 0
      });
      console.log(`🎲 ${jogador.nome_jogador} rolou ${rolagem}`);
    }
  }

  ordenarJogadores() {
    const host = Array.from(this.jogadoresMap.values()).find(j => j.e_host);
    const naoHosts = Array.from(this.jogadoresMap.values())
      .filter(j => !j.e_host)
      .sort((a, b) => {
        if (a.rolagem_dado === null) return 1;
        if (b.rolagem_dado === null) return -1;
        return (b.rolagem_dado || 0) - (a.rolagem_dado || 0);
      });
    
    this.jogadoresMap.clear();
    if (host) {
      host.e_turno_atual = true;
      this.jogadoresMap.set(host.id_socket, host);
    }
    for (const j of naoHosts) {
      j.e_turno_atual = false;
      this.jogadoresMap.set(j.id_socket, j);
    }
    this.atualizarSessao();
    console.log('✅ Ordem de jogo definida');
  }

  iniciarJogo() {
    this.jogoIniciado = true;
    this.jogoEncerrado = false;
    this.revelouEstaTurno = false;
    this.sessaoAtual!.id_carta_atual = 0;
    this.sessaoAtual!.dicas_reveladas = '[]';
    
    const players = this.getJogadores();
    const primeiroNaoHost = players.find(j => !j.e_host);
    if (primeiroNaoHost) {
      this.sessaoAtual!.id_jogador_atual = primeiroNaoHost.id;
      primeiroNaoHost.e_turno_atual = true;
      queries.atualizarJogador.run({
        id: primeiroNaoHost.id,
        pontuacao: primeiroNaoHost.pontuacao,
        rolagem_dado: primeiroNaoHost.rolagem_dado,
        e_turno_atual: 1
      });
    }
    
    this.atualizarSessao();
    console.log('🎮 Jogo iniciado!');
  }

  revelarDica(idSocket: string, indiceDica: number): boolean {
    const jogador = this.jogadoresMap.get(idSocket);
    if (!jogador || jogador.e_host) return false;
    if (!jogador.e_turno_atual) return false;
    if (this.revelouEstaTurno) return false;
    
    const dicasReveladas = JSON.parse(this.sessaoAtual!.dicas_reveladas);
    if (dicasReveladas.includes(indiceDica)) return false;
    if (indiceDica < 0 || indiceDica >= 10) return false;

    dicasReveladas.push(indiceDica);
    this.sessaoAtual!.dicas_reveladas = JSON.stringify(dicasReveladas);
    this.revelouEstaTurno = true;
    this.atualizarSessao();
    console.log(`✅ Dica ${indiceDica + 1} revelada por ${jogador.nome_jogador}`);
    return true;
  }

  passarVez(idSocket: string): boolean {
    const jogador = this.jogadoresMap.get(idSocket);
    if (!jogador || !jogador.e_turno_atual) return false;

    this.revelouEstaTurno = false;
    this.proximoJogador();
    return true;
  }

  private proximoJogador() {
    const jogadores = this.getJogadores().filter(j => !j.e_host);
    if (jogadores.length === 0) return;

    const idxAtual = jogadores.findIndex(j => j.e_turno_atual);
    let proximoIdx = idxAtual + 1;
    if (proximoIdx >= jogadores.length) {
      proximoIdx = 0;
    }

    for (const j of jogadores) {
      j.e_turno_atual = false;
      queries.atualizarJogador.run({
        id: j.id,
        pontuacao: j.pontuacao,
        rolagem_dado: j.rolagem_dado,
        e_turno_atual: 0
      });
    }

    jogadores[proximoIdx].e_turno_atual = true;
    this.sessaoAtual!.id_jogador_atual = jogadores[proximoIdx].id;
    queries.atualizarJogador.run({
      id: jogadores[proximoIdx].id,
      pontuacao: jogadores[proximoIdx].pontuacao,
      rolagem_dado: jogadores[proximoIdx].rolagem_dado,
      e_turno_atual: 1
    });
    this.atualizarSessao();
    console.log(`➡️ Vez passou para: ${jogadores[proximoIdx].nome_jogador}`);
  }

  adicionarResposta(idSocket: string, resposta: string): RespostaPendente | null {
    const jogador = this.jogadoresMap.get(idSocket);
    if (!jogador || jogador.e_host) return null;

    const jaRespondeu = this.getRespostas().some(r => r.nome_jogador === jogador.nome_jogador);
    if (jaRespondeu) return null;

    queries.adicionarRespostaPendente.run({
      id_sessao: this.sessaoAtual!.id,
      nome_jogador: jogador.nome_jogador,
      resposta: resposta
    });

    const row = (db.query('SELECT last_insert_rowid() as id').get() as any);
    const idResposta = Number(row.id);

    const respostaPendente: RespostaPendente = {
      id: idResposta,
      id_sessao: this.sessaoAtual!.id,
      nome_jogador: jogador.nome_jogador,
      resposta: resposta,
      data_envio: new Date().toISOString()
    };

    const respostas = this.getRespostas();
    respostas.push(respostaPendente);
    console.log(`✉️ ${jogador.nome_jogador} respondeu: "${resposta}"`);
    return respostaPendente;
  }

  getRespostas(): RespostaPendente[] {
    if (!this.sessaoAtual) return [];
    try {
      return queries.buscarRespostasSessao.all({ id_sessao: this.sessaoAtual.id }) as RespostaPendente[];
    } catch {
      return [];
    }
  }

  validarResposta(idResposta: number, isCorrect: boolean, casas: number): { sucesso: boolean, nomeJogador?: string, respostaCorreta?: string } {
    const respostas = this.getRespostas();
    const resposta = respostas.find(r => r.id === idResposta);
    if (!resposta) return { sucesso: false };

    const jogador = this.getJogadorPorNome(resposta.nome_jogador);
    if (!jogador) return { sucesso: false };

    queries.removerResposta.run({ id: idResposta });

    if (isCorrect) {
      jogador.pontuacao += casas;
      queries.atualizarPontuacaoPorSocket.run({
        id_socket: jogador.id_socket,
        pontuacao: jogador.pontuacao
      });

      const cartaAtual = this.getCartaAtual();
      console.log(`✓ ${jogador.nome_jogador} acertou! +${casas} pontos`);

      setTimeout(() => {
        this.proximaCarta();
      }, 3000);

      return { sucesso: true, nomeJogador: jogador.nome_jogador, respostaCorreta: cartaAtual?.nome };
    } else {
      this.revelouEstaTurno = false;
      this.proximoJogador();
      console.log(`✗ ${jogador.nome_jogador} errou`);
      return { sucesso: true };
    }
  }

  revelarResposta(): string | null {
    if (!this.sessaoAtual) return null;
    const cartaAtual = this.getCartaAtual();
    if (!cartaAtual) return null;

    console.log(`📖 Host revelou a resposta: ${cartaAtual.nome}`);
    
    setTimeout(() => {
      this.proximaCarta();
    }, 3000);

    return cartaAtual.nome;
  }

  private proximaCarta() {
    this.sessaoAtual!.id_carta_atual++;
    this.sessaoAtual!.dicas_reveladas = '[]';
    this.revelouEstaTurno = false;

    if (this.sessaoAtual!.id_carta_atual >= gameCards.length) {
      this.encerrarJogo();
      return;
    }

    const jogadores = this.getJogadores().filter(j => !j.e_host);
    if (jogadores.length > 0) {
      jogadores[0].e_turno_atual = true;
      this.sessaoAtual!.id_jogador_atual = jogadores[0].id;
    }

    queries.limparRespostasSessao.run({ id_sessao: this.sessaoAtual!.id });
    this.atualizarSessao();
    console.log(`🃏 Próxima carta: ${this.getCartaAtual()?.nome}`);
  }

  private encerrarJogo() {
    this.jogoEncerrado = true;
    this.jogoIniciado = false;

    const jogadores = this.getJogadores();
    const ranking = jogadores
      .filter(j => !j.e_host)
      .sort((a, b) => b.pontuacao - a.pontuacao);

    const vencedor = ranking[0];
    if (vencedor) {
      queries.atualizarPontuacaoJogador.run({
        nome: vencedor.nome_jogador,
        pontuacao: vencedor.pontuacao
      });
      queries.adicionarVitoria.run({ nome: vencedor.nome_jogador });
    }

    queries.adicionarHistoricoPartida.run({
      nome_vencedor: vencedor?.nome_jogador,
      pontuacao_vencedor: vencedor?.pontuacao,
      total_jogadores: ranking.length
    });

    this.sessaoAtual!.esta_ativa = false;
    this.atualizarSessao();
    console.log('🏆 Jogo encerrado! Vencedor:', vencedor?.nome_jogador);
  }

  getJogoEncerrado(): boolean {
    return this.jogoEncerrado;
  }

  getCartaAtual(): Carta | null {
    if (!this.sessaoAtual) return null;
    return gameCards[this.sessaoAtual.id_carta_atual] || null;
  }

  getDicasReveladas(): number[] {
    if (!this.sessaoAtual) return [];
    try {
      return JSON.parse(this.sessaoAtual.dicas_reveladas);
    } catch {
      return [];
    }
  }

  getJogoIniciado(): boolean {
    return this.jogoIniciado;
  }

  getRevelouEstaTurno(): boolean {
    return this.revelouEstaTurno;
  }

  removerJogador(idSocket: string) {
    const jogador = this.jogadoresMap.get(idSocket);
    if (jogador) {
      console.log(`❌ ${jogador.nome_jogador} desconectou`);
      queries.removerJogador.run({ id_socket: idSocket });
      this.jogadoresMap.delete(idSocket);

      if (jogador.e_host && this.jogadoresMap.size > 0) {
        const novoHost = this.getJogadores()[0];
        novoHost.e_host = true;
        queries.atualizarJogador.run({
          id: novoHost.id,
          pontuacao: novoHost.pontuacao,
          rolagem_dado: novoHost.rolagem_dado,
          e_turno_atual: novoHost.e_turno_atual ? 1 : 0
        });
      }
    }
  }

  reiniciarJogo() {
    if (!this.sessaoAtual) return;

    const jogadores = this.getJogadores();
    for (const j of jogadores) {
      j.pontuacao = 0;
      j.rolagem_dado = j.e_host ? 0 : null;
      j.e_turno_atual = false;
      queries.atualizarJogador.run({
        id: j.id,
        pontuacao: 0,
        rolagem_dado: j.rolagem_dado,
        e_turno_atual: 0
      });
    }

    this.jogoIniciado = false;
    this.jogoEncerrado = false;
    this.sessaoAtual.id_carta_atual = 0;
    this.sessaoAtual.dicas_reveladas = '[]';
    this.sessaoAtual.esta_ativa = false;
    this.atualizarSessao();

    this.sessaoAtual = null;
    this.jogadoresMap.clear();
    console.log('🔄 Jogo reiniciado');
  }

  private atualizarSessao() {
    if (!this.sessaoAtual) return;
    queries.atualizarSessao.run({
      id: this.sessaoAtual.id,
      id_carta_atual: this.sessaoAtual.id_carta_atual,
      dicas_reveladas: this.sessaoAtual.dicas_reveladas,
      id_jogador_atual: this.sessaoAtual.id_jogador_atual,
      esta_ativa: this.sessaoAtual.esta_ativa ? 1 : 0
    });
  }

  getRanking(): any[] {
    return queries.buscarRanking.all() as any[];
  }
}

export const gerenciadorJogo = new GerenciadorJogo();
