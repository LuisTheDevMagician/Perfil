# Design: Timer de 30 Segundos por Vez

## Resumo

Cada jogador tem 30 segundos para responder quando é a sua vez. Se o tempo esgotar sem resposta, a vez passa automaticamente para o próximo jogador. Se o jogador enviar uma resposta antes, o timer para e desaparece, e o botão "Passar Vez" fica bloqueado até a validação do HOST.

O timer é visível em todas as telas (HOST + todos os jogadores).

---

## Fluxo de Dados

O servidor passa a incluir `turnStartedAt: number` (timestamp `Date.now()` em ms) em todos os eventos que trocam o jogador da vez:

- `game-started`
- `answer-incorrect`
- `next-card`
- `clue-revealed` (já emitido quando a vez passa via `pass-turn`)

Todos os clientes calculam `restante = 30 - (Date.now() - turnStartedAt) / 1000` em um `setInterval` de 100ms. Nenhum evento de tick é enviado pela rede.

No handler `clue-revealed`, o cliente só reinicia o timer se `newPlayerId !== currentPlayerId` — evitando reset ao revelar uma dica sem mudar a vez.

---

## Backend

### `game.ts` — `GerenciadorJogo`

**Novo campo:**
```ts
private timerAutoPass: ReturnType<typeof setTimeout> | null = null;
```

**Novo método `iniciarTimerVez()`:**
- Cancela qualquer timer anterior (`clearTimeout`)
- Agenda `setTimeout` de **32 segundos** (2s de folga para latência de rede)
- O callback obtém o socket do jogador atual via `getSocketIdJogadorAtual()` e chama `this.passarVez(socketId)`
- Se `getSocketIdJogadorAtual()` retornar vazio (jogador desconectado), chama `proximoJogador()` diretamente

**Novo método `cancelarTimerVez()`:**
- Chama `clearTimeout(this.timerAutoPass)` e seta `null`

**Onde chamar `iniciarTimerVez()`:**
- `iniciarJogo()` — após definir o primeiro jogador da vez
- `proximoJogador()` — sempre que a vez muda (por erro ou `pass-turn`)
- `proximaCarta()` — nova carta, mesmo jogador ou novo

**Onde chamar `cancelarTimerVez()`:**
- `validarResposta()` quando `isCorrect === true` — a carta vai acabar, timer desnecessário
- `encerrarJogo()`
- `limparTudo()`
- `reiniciarJogo()`

### `ws.ts`

Adicionar `turnStartedAt: Date.now()` ao payload dos eventos emitidos em:
- `handleGameStarted` → evento `game-started`
- `handleAnswerIncorrect` → evento `answer-incorrect`
- `handleNextCard` (dentro de `proximaCarta` via callback) → evento `next-card`
- Handler de `pass-turn` / `clue-revealed` quando há mudança de vez → evento `clue-revealed`

---

## Frontend

### `game/page.tsx`

**Novos estados:**
```ts
const [turnStartedAt, setTurnStartedAt] = useState<number>(0);
const [timeLeft, setTimeLeft] = useState<number>(30);
```

**`useEffect` do timer:**
```ts
useEffect(() => {
  if (turnStartedAt === 0) return;
  const interval = setInterval(() => {
    const remaining = Math.max(0, 30 - (Date.now() - turnStartedAt) / 1000);
    setTimeLeft(remaining);
  }, 100);
  return () => clearInterval(interval);
}, [turnStartedAt]);
```

**Auto-passe no cliente:**
```ts
useEffect(() => {
  if (isMyTurn && !hasAnswered && timeLeft === 0 && turnStartedAt > 0) {
    socketRef.current?.emit('pass-turn');
  }
}, [timeLeft, isMyTurn, hasAnswered, turnStartedAt]);
```

**Onde atualizar `turnStartedAt`:**
- `handleGameStarted` → `setTurnStartedAt(data.turnStartedAt)`
- `handleAnswerIncorrect` → `setTurnStartedAt(data.turnStartedAt)`
- `handleNextCard` → `setTurnStartedAt(data.turnStartedAt)`
- `handleClueRevealed` → apenas se `newPlayerId !== currentPlayerId` → `setTurnStartedAt(data.turnStartedAt)`

**Onde limpar o timer:**
- `handleNextCard`, `handleAnswerCorrect`, `handleGameEnded` → `setTurnStartedAt(0)` e `setTimeLeft(30)`

### Componente `CountdownRing`

SVG inline com dois círculos: trilha de fundo e arco de progresso via `stroke-dashoffset`.

```
circumference = 2π × r
dashoffset = circumference × (1 - timeLeft / 30)
```

- Raio: 20px (compacto, ao lado do nome do jogador da vez)
- Cor padrão: primária do tema (azul/verde)
- Cor nos últimos 10 segundos: vermelho + animação de pulso leve
- Exibe o número de segundos inteiros no centro do anel
- Desaparece (`display: none`) quando `hasAnswered === true` ou `turnStartedAt === 0`

**Posicionamento:** Próximo ao nome/chip do jogador da vez, visível tanto na view do HOST quanto na view dos jogadores.

### Botão "Passar Vez"

Adicionar `disabled={... || hasAnswered}` — uma vez que o jogador enviou uma resposta, o botão fica desabilitado até a validação do HOST (que dispara `answer-correct` ou `answer-incorrect`, resetando `hasAnswered`).

---

## Edge Cases

| Situação | Comportamento |
|---|---|
| Jogador fecha o navegador antes de responder | Servidor dispara `passarVez` após 32s via fallback |
| Timer expira simultaneamente no cliente e servidor | O cliente emite `pass-turn` primeiro; o servidor recebe e processa normalmente; o fallback de 32s é cancelado quando `passarVez` é chamado |
| Só 1 jogador não-HOST | Timer expira, vez passa para si mesmo (comportamento existente do `proximoJogador`) |
| Jogador reconecta durante contagem | Timer do cliente reinicia em 30s; `turnStartedAt` não é persistido no game-state (aceitável para jogo LAN presencial) |
| Servidor reinicia durante jogo | `turnStartedAt` não é persistido (estado em memória); timer reinicia quando o jogo é retomado |
