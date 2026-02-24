const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ─── Game State ───────────────────────────────────────────────────────────────
const ROUNDS = [
  {
    id: 1,
    title: "Round 1: The Fed Speaks",
    news: "The Federal Reserve has signalled it may pause rate hikes amid mixed inflation data. Manufacturing PMI came in below expectations at 48.2, while the jobs report showed 250,000 new jobs added last month.",
    markets: ["Bond", "Equity", "Forex (USD)", "Property"],
    // price movements after reveal: positive = price went UP
    movements: { Bond: +4.2, Equity: +2.8, "Forex (USD)": -1.5, Property: +1.1 },
    analysis: "Pausing rate hikes → bonds rally (yields fall, prices up). Equities cheer easier money. USD weakens on dovish Fed. Property slightly positive as mortgage rates ease."
  },
  {
    id: 2,
    title: "Round 2: China Slowdown",
    news: "China's GDP growth slows to 4.2%, missing the 5% target. Export data drops 8% YoY. Beijing hints at stimulus but no concrete measures announced yet.",
    markets: ["Bond", "Equity", "Forex (USD)", "Property"],
    movements: { Bond: +2.1, Equity: -3.5, "Forex (USD)": +2.8, Property: -2.2 },
    analysis: "Risk-off: investors flee to safe-haven bonds. Equities fall on growth fears. USD strengthens as safe haven. Property weakens on sentiment and tighter credit."
  },
  {
    id: 3,
    title: "Round 3: Oil Shock",
    news: "OPEC+ announces surprise production cuts of 1.5 million barrels/day. Brent crude surges 8% in a single session. Energy CPI expected to spike next month.",
    markets: ["Bond", "Equity", "Forex (USD)", "Property"],
    movements: { Bond: -3.8, Equity: -1.2, "Forex (USD)": +1.9, Property: -0.8 },
    analysis: "Inflation fears → bonds sell off (yields spike). Equities mixed but net negative on cost pressures. USD strengthens on petrodollar flows. Property squeezed by rate expectations."
  },
  {
    id: 4,
    title: "Round 4: Tech Boom",
    news: "A major AI breakthrough is announced by a leading tech firm. Nasdaq futures up 4% pre-market. Venture capital inflows hit a 3-year high. Consumer confidence index jumps to 112.",
    markets: ["Bond", "Equity", "Forex (USD)", "Property"],
    movements: { Bond: -1.5, Equity: +6.2, "Forex (USD)": +0.8, Property: +2.5 },
    analysis: "Risk-on: equities surge led by tech. Bonds slightly sold as money rotates to equities. USD marginally up on US growth story. Property benefits from improved consumer sentiment."
  }
];

const STARTING_CAPITAL = 10000;

let gameState = {
  phase: 'lobby',       // lobby | news | voting | reveal | leaderboard | end
  currentRound: 0,
  votingOpen: false,
  votes: {},            // socketId -> { market -> { direction, amount } }
  players: {},          // socketId -> { name, pnl, history }
  timerEnd: null,
};

function getRound() { return ROUNDS[gameState.currentRound]; }

function calcPnl(votes, movements) {
  let pnl = 0;
  for (const [market, vote] of Object.entries(votes)) {
    const move = movements[market] || 0;
    const direction = vote.direction === 'long' ? 1 : -1;
    pnl += (vote.amount * direction * move) / 100;
  }
  return Math.round(pnl * 100) / 100;
}

function getLeaderboard() {
  return Object.entries(gameState.players)
    .map(([id, p]) => ({ name: p.name, pnl: Math.round(p.pnl * 100) / 100, capital: Math.round((STARTING_CAPITAL + p.pnl) * 100) / 100 }))
    .sort((a, b) => b.capital - a.capital);
}

function broadcastState() {
  const round = getRound();
  io.emit('state', {
    phase: gameState.phase,
    currentRound: gameState.currentRound,
    round: round ? { id: round.id, title: round.title, news: round.news, markets: round.markets, analysis: gameState.phase === 'reveal' ? round.analysis : null, movements: gameState.phase === 'reveal' ? round.movements : null } : null,
    votingOpen: gameState.votingOpen,
    playerCount: Object.keys(gameState.players).length,
    leaderboard: getLeaderboard(),
    timerEnd: gameState.timerEnd,
  });
}

// ─── Socket Events ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // Player joins
  socket.on('join', ({ name }) => {
    if (!gameState.players[socket.id]) {
      gameState.players[socket.id] = { name, pnl: 0, history: [] };
    }
    socket.emit('joined', { id: socket.id, capital: STARTING_CAPITAL, startingCapital: STARTING_CAPITAL });
    broadcastState();
  });

  // Player submits votes
  socket.on('submitVotes', ({ votes }) => {
    if (!gameState.votingOpen) return;
    gameState.votes[socket.id] = votes;
    socket.emit('votesReceived');
    io.to('host').emit('voteCount', Object.keys(gameState.votes).length);
  });

  // ── Host controls ──
  socket.on('hostJoin', () => {
    socket.join('host');
    socket.emit('hostJoined');
    broadcastState();
  });

  socket.on('hostStartRound', () => {
    gameState.currentRound = 0;
    gameState.phase = 'news';
    gameState.votes = {};
    gameState.votingOpen = false;
    broadcastState();
  });

  socket.on('hostOpenVoting', () => {
    gameState.phase = 'voting';
    gameState.votingOpen = true;
    gameState.votes = {};
    gameState.timerEnd = Date.now() + 60000; // 60 second timer
    broadcastState();
  });

  socket.on('hostReveal', () => {
    gameState.votingOpen = false;
    gameState.phase = 'reveal';
    const round = getRound();
    // Calculate P&L for all players who voted
    for (const [sid, votes] of Object.entries(gameState.votes)) {
      if (gameState.players[sid]) {
        const pnl = calcPnl(votes, round.movements);
        gameState.players[sid].pnl += pnl;
        gameState.players[sid].history.push({ round: round.id, pnl });
        // Send personal result
        io.to(sid).emit('roundResult', { pnl, totalCapital: Math.round((STARTING_CAPITAL + gameState.players[sid].pnl) * 100) / 100 });
      }
    }
    broadcastState();
  });

  socket.on('hostNextRound', () => {
    if (gameState.currentRound < ROUNDS.length - 1) {
      gameState.currentRound++;
      gameState.phase = 'news';
      gameState.votes = {};
      gameState.votingOpen = false;
      broadcastState();
    } else {
      gameState.phase = 'end';
      broadcastState();
    }
  });

  socket.on('hostReset', () => {
    gameState = { phase: 'lobby', currentRound: 0, votingOpen: false, votes: {}, players: {}, timerEnd: null };
    broadcastState();
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Market Call running on http://localhost:${PORT}`));
