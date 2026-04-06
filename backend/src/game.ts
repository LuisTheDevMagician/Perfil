import { queries } from './db/queries';
import { gameCards, type Carta, type Jogador, type RespostaPendente, type SessaoJogo } from './models';

function mapDbToJogador(row: any): Jogador {
  return {
    id: row.id,
    id_sessao: row.idSessao ?? row.id_sessao ?? 0,
    id_socket: row.idSocket ?? row.id_socket ?? '',
    nome_jogador: row.nomeJogador ?? row.nome_jogador ?? '',
    pontuacao: row.pontuacao ?? 0,
    rolagem_dado: row.rolagemDado ?? row.rolagem_dado ?? null,
    e_host: row.eHost === 1 || row.e_host === 1,
    e_turno_atual: row.eTurnoAtual === 1 || row.e_turno_atual === 1,
  };
}

function mapDbToResposta(row: any): RespostaPendente {
  return {
    id: row.id,
    id_sessao: row.idSessao ?? row.id_sessao ?? 0,
    nome_jogador: row.nomeJogador ?? row.nome_jogador ?? '',
    resposta: row.resposta ?? '',
    data_envio: row.dataEnvio ?? row.data_envio ?? new Date().toISOString(),
  };
}

function mapDbToSessao(row: any): SessaoJogo {
  return {
    id: row.id ?? 0,
    nome_host: row.nomeHost ?? row.nome_host ?? '',
    id_carta_atual: row.idCartaAtual ?? row.id_carta_atual ?? 0,
    dicas_reveladas: row.dicasReveladas ?? row.dicas_reveladas ?? '[]',
    id_jogador_atual: row.idJogadorAtual ?? row.id_jogador_atual ?? 0,
    esta_ativa: row.estaAtiva === 1 || row.esta_ativa === 1,
    data_criacao: row.dataCriacao ?? row.data_criacao ?? new Date().toISOString(),
  };
}

export class GerenciadorJogo {
  private sessaoAtual: SessaoJogo | null = null;
  private jogadoresMap: Map<string, Jogador> = new Map();
  private jogoIniciado: boolean = false;
  private jogoEncerrado: boolean = false;
  private revelouEstaTurno: boolean = false;

  constructor() {
    this.carregarSessaoAtiva();
  }

  private carregarSessaoAtiva() {
    try {
      const row = queries.buscarSessaoAtiva();
      if (row) {
        this.sessaoAtual = mapDbToSessao(row);
        this.carregarJogadoresSessao(this.sessaoAtual.id);
        console.log('✅ Sessão ativa carregada do banco:', this.sessaoAtual.id);
      }
    } catch (e) {
      console.log('Nenhuma sessão ativa encontrada');
    }
  }

  private carregarJogadoresSessao(idSessao: number) {
    const jogadores = queries.buscarJogadoresSessao(idSessao);
    this.jogadoresMap.clear();
    for (const j of jogadores) {
      const jogador = mapDbToJogador(j);
      this.jogadoresMap.set(jogador.id_socket, jogador);
    }
  }

  criarSessao(nomeHost: string): number {
    const idSessao = queries.criarSessao(nomeHost);
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
    
    const idJogador = queries.adicionarJogador(
      this.sessaoAtual!.id,
      idSocket,
      nome,
      eHost ? 1 : 0
    );

    const jogador: Jogador = {
      id: idJogador,
      id_sessao: this.sessaoAtual!.id,
      id_socket: idSocket,
      nome_jogador: nome,
      pontuacao: 0,
      rolagem_dado: eHost ? 0 : null,
      e_host: eHost,
      e_turno_atual: false
    };
    this.jogadoresMap.set(idSocket, jogador);

    queries.upsertJogador(nome);

    console.log(`✅ Jogador adicionado: ${nome} (${eHost ? 'HOST' : 'JOGADOR'})`);
    return jogador;
  }

  atualizarRolagemDado(idSocket: string, rolagem: number): boolean {
    const jogador = this.jogadoresMap.get(idSocket);
    if (!jogador || jogador.e_host) return false;
    if (typeof rolagem !== 'number' || rolagem < 1 || rolagem > 100) return false;
    
    jogador.rolagem_dado = rolagem;
    queries.atualizarJogador(jogador.id, { rolagemDado: rolagem });
    console.log(`🎲 ${jogador.nome_jogador} rolou ${rolagem}`);
    return true;
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
      queries.atualizarJogador(host.id, { eTurnoAtual: 1 });
      this.jogadoresMap.set(host.id_socket, host);
    }
    for (const j of naoHosts) {
      j.e_turno_atual = false;
      queries.atualizarJogador(j.id, { eTurnoAtual: 0 });
      this.jogadoresMap.set(j.id_socket, j);
    }
    this.atualizarSessao();
    console.log('✅ Ordem de jogo definida');
  }

  iniciarJogo(): boolean {
    if (!this.sessaoAtual) return false;
    
    this.jogoIniciado = true;
    this.jogoEncerrado = false;
    this.revelouEstaTurno = false;
    this.sessaoAtual.id_carta_atual = 0;
    this.sessaoAtual.dicas_reveladas = '[]';
    
    const players = this.getJogadores();
    const primeiroNaoHost = players.find(j => !j.e_host);
    if (primeiroNaoHost) {
      this.sessaoAtual.id_jogador_atual = primeiroNaoHost.id;
      primeiroNaoHost.e_turno_atual = true;
      queries.atualizarJogador(primeiroNaoHost.id, { eTurnoAtual: 1 });
    }
    
    this.atualizarSessao();
    console.log('🎮 Jogo iniciado!');
    return true;
  }

  revelarDica(idSocket: string, indiceDica: number): boolean {
    if (indiceDica < 0 || indiceDica >= 10) return false;
    const jogador = this.jogadoresMap.get(idSocket);
    if (!jogador || jogador.e_host) return false;
    if (!jogador.e_turno_atual) return false;
    if (this.revelouEstaTurno) return false;
    
    const dicasReveladas = JSON.parse(this.sessaoAtual!.dicas_reveladas);
    if (dicasReveladas.includes(indiceDica)) return false;

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
      queries.atualizarJogador(j.id, { eTurnoAtual: 0 });
    }

    jogadores[proximoIdx].e_turno_atual = true;
    this.sessaoAtual!.id_jogador_atual = jogadores[proximoIdx].id;
    queries.atualizarJogador(jogadores[proximoIdx].id, { eTurnoAtual: 1 });
    this.atualizarSessao();
    console.log(`➡️ Vez passou para: ${jogadores[proximoIdx].nome_jogador}`);
  }

  adicionarResposta(idSocket: string, resposta: string): RespostaPendente | null {
    const jogador = this.jogadoresMap.get(idSocket);
    if (!jogador || jogador.e_host) return null;

    const jaRespondeu = this.getRespostas().some(r => r.nome_jogador === jogador.nome_jogador);
    if (jaRespondeu) return null;

    const idResposta = queries.adicionarRespostaPendente(this.sessaoAtual!.id, jogador.nome_jogador, resposta);

    const respostaPendente: RespostaPendente = {
      id: idResposta,
      id_sessao: this.sessaoAtual!.id,
      nome_jogador: jogador.nome_jogador,
      resposta: resposta,
      data_envio: new Date().toISOString()
    };

    console.log(`✉️ ${jogador.nome_jogador} respondeu: "${resposta}"`);
    return respostaPendente;
  }

  getRespostas(): RespostaPendente[] {
    if (!this.sessaoAtual) return [];
    try {
      const respostas = queries.buscarRespostasSessao(this.sessaoAtual.id);
      return respostas.map(mapDbToResposta);
    } catch {
      return [];
    }
  }

  validarResposta(idResposta: number, isCorrect: boolean, casas: number): { sucesso: boolean, nomeJogador?: string, respostaCorreta?: string } {
    if (casas < 1 || casas > 10) return { sucesso: false };
    const respostas = this.getRespostas();
    const resposta = respostas.find(r => r.id === idResposta);
    if (!resposta) return { sucesso: false };

    const jogador = this.getJogadorPorNome(resposta.nome_jogador);
    if (!jogador) return { sucesso: false };

    queries.removerResposta(idResposta);

    if (isCorrect) {
      jogador.pontuacao += casas;
      queries.atualizarPontuacaoPorSocket(jogador.id_socket, jogador.pontuacao);

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
    if (!this.sessaoAtual) return;
    
    this.sessaoAtual.id_carta_atual++;
    this.sessaoAtual.dicas_reveladas = '[]';
    this.revelouEstaTurno = false;

    if (this.sessaoAtual.id_carta_atual >= gameCards.length) {
      this.encerrarJogo();
      return;
    }

    const jogadores = this.getJogadores().filter(j => !j.e_host);
    if (jogadores.length > 0) {
      jogadores[0].e_turno_atual = true;
      this.sessaoAtual.id_jogador_atual = jogadores[0].id;
      queries.atualizarJogador(jogadores[0].id, { eTurnoAtual: 1 });
    }

    queries.limparRespostasSessao(this.sessaoAtual.id);
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
      queries.atualizarPontuacaoJogador(vencedor.nome_jogador, vencedor.pontuacao);
      queries.adicionarVitoria(vencedor.nome_jogador);
    }

    queries.adicionarHistoricoPartida(
      vencedor?.nome_jogador || null,
      vencedor?.pontuacao || null,
      ranking.length
    );

    if (this.sessaoAtual) {
      this.sessaoAtual.esta_ativa = false;
      this.atualizarSessao();
    }
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
      queries.removerJogador(idSocket);
      this.jogadoresMap.delete(idSocket);

      if (jogador.e_host && this.jogadoresMap.size > 0) {
        const novoHost = this.getJogadores()[0];
        novoHost.e_host = true;
        queries.atualizarJogador(novoHost.id, { eTurnoAtual: novoHost.e_turno_atual ? 1 : 0 });
      }
    }
  }

  reiniciarJogo(): boolean {
    if (!this.sessaoAtual) return false;

    const jogadores = this.getJogadores();
    for (const j of jogadores) {
      j.pontuacao = 0;
      j.rolagem_dado = j.e_host ? 0 : null;
      j.e_turno_atual = false;
      queries.atualizarJogador(j.id, { pontuacao: 0, rolagemDado: j.e_host ? 0 : null, eTurnoAtual: 0 });
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
    return true;
  }

  private atualizarSessao() {
    if (!this.sessaoAtual) return;
    queries.atualizarSessao(this.sessaoAtual.id, {
      idCartaAtual: this.sessaoAtual.id_carta_atual,
      dicasReveladas: this.sessaoAtual.dicas_reveladas,
      idJogadorAtual: this.sessaoAtual.id_jogador_atual,
      estaAtiva: this.sessaoAtual.esta_ativa ? 1 : 0,
    });
  }

  getRanking(): any[] {
    return queries.buscarRanking();
  }
}

export const gerenciadorJogo = new GerenciadorJogo();
