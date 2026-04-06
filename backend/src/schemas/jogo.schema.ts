export interface CriarSessaoDto {
  nomeHost: string;
}

export interface AdicionarJogadorDto {
  nome: string;
}

export interface RevelarDicaDto {
  indiceDica: number;
}

export interface ValidarRespostaDto {
  answerId: number;
  isCorrect: boolean;
  casesToMove: number;
}

export interface EnviarRespostaDto {
  resposta: string;
}

export function validarNome(nome: unknown): string | null {
  if (typeof nome !== 'string') return 'Nome deve ser uma string';
  const trimmed = nome.trim();
  if (trimmed.length < 1 || trimmed.length > 20) return 'Nome deve ter entre 1 e 20 caracteres';
  if (!/^[a-zA-Z0-9À-ÿ\s]+$/.test(trimmed)) return 'Nome contém caracteres inválidos';
  return trimmed;
}

export function validarResposta(resposta: unknown): string | null {
  if (typeof resposta !== 'string') return 'Resposta deve ser uma string';
  const trimmed = resposta.trim();
  if (trimmed.length < 1 || trimmed.length > 100) return 'Resposta deve ter entre 1 e 100 caracteres';
  return trimmed;
}

export function validarIndiceDica(indice: unknown): number | null {
  if (typeof indice !== 'number' || !Number.isInteger(indice)) return null;
  if (indice < 0 || indice > 9) return null;
  return indice;
}

export function validarCasas(casas: unknown): number | null {
  if (typeof casas !== 'number' || !Number.isInteger(casas)) return null;
  if (casas < 1 || casas > 10) return null;
  return casas;
}
