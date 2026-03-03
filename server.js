const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const ROUNDS = [
  {
    id: 1,
    title: "PRE-SHOCK: Hong Kong Financial Landscape",
    cardType: "INITIAL HAND",
    cardIcon: "🃏",
    news: "BEFORE THE EVENT — Hong Kong markets are in a fragile equilibrium. The Hang Seng Index hovers near 20,800. HKD remains within its 7.75–7.85 peg band. Property prices are stabilising after a prolonged correction. Bond yields are moderate, and capital flows are broadly neutral. Fund managers must now choose their initial portfolio allocation before the first macro shock hits.",
    markets: ["HK Equities (HSI)", "HK Property", "HK Bonds", "HKD / Forex"],
    movements: { "HK Equities (HSI)": 0, "HK Property": 0, "HKD / Forex": 0, "HK Bonds": 0 },
    analysis: "PRE-SHOCK BASELINE: Hang Seng ~20,800 | HK 10Y Bond Yield ~4.1% | HKD at 7.784 (within band) | Property: stabilising but fragile. This is your starting hand. Choose your overweight and underweight positions wisely before the first action card is drawn.",
    tip: "💡 ANALYST TIP: Property and Bonds tend to move inversely when rates shift. Consider your duration risk before the Fed makes its next move."
  },
  {
    id: 2,
    title: "TRIGGER 1: Iran War — Sell-Offs Sweep HK & Asian Markets",
    cardType: "ACTION CARD: GEOPOLITICAL SHOCK",
    cardIcon: "💥",
    news: "BREAKING — Sell-offs sweep Hong Kong and Asian markets as gold and oil surge on Iran war fears. The Hang Seng Index tumbles as risk-off sentiment grips the region. Safe-haven assets spike: gold rallies sharply, Brent crude jumps on supply disruption fears. Capital flees emerging market equities. The HKD peg comes under pressure as USD safe-haven demand surges. Hong Kong property sentiment deteriorates as global uncertainty spikes. [Source: SCMP, 2025]",
    markets: ["HK Equities (HSI)", "HK Property", "HK Bonds", "HKD / Forex"],
    movements: { "HK Equities (HSI)": -4.8, "HK Property": -2.1, "HKD / Forex": -1.6, "HK Bonds": +3.2 },
    analysis: "RISK-OFF SWEEP: Geopolitical shock triggers capital flight from Asian equities. HSI falls sharply as institutional investors de-risk. HK Bonds rally as safe-haven demand surges (yields fall, prices up). HKD weakens modestly — HKMA may need to intervene to defend the peg. Property sentiment collapses on global uncertainty. Gold and oil are the winners; HK risk assets are the losers. KEY DISCUSSION: Which asset in your portfolio survived the shock? Did your initial hand protect your capital?",
    tip: "💡 ANALYST TIP: In geopolitical risk-off events, duration (bonds) and safe havens outperform. The HKD peg historically holds, but watch HKMA FX reserves for stress signals."
  },
  {
    id: 3,
    title: "TRIGGER 2: NPC Policy Disappointment — China Cuts Growth Target",
    cardType: "FORCE DEAL CARD: POLICY SHOCK",
    cardIcon: "🟠",
    news: "BEIJING — China's National People's Congress sets 2026 growth target at 4.5%–5%, down from 'around 5%' — signalling leaders may tolerate slower expansion as the property slump and deflation persist. Morgan Stanley analysts warn it may be too early to turn positive, flagging risks of 'policy disappointment' if the NPC fails to deliver an aggressive rescue plan for the housing market. Home sales have yet to find a solid floor. Authorities are expected to rely on special government bonds and selective budget allocations — targeted support rather than broad expansion. No 'bazooka' stimulus forthcoming. [Source: Business Standard / Morgan Stanley, March 2025]",
    markets: ["HK Equities (HSI)", "HK Property", "HK Bonds", "HKD / Forex"],
    movements: { "HK Equities (HSI)": -3.1, "HK Property": -3.8, "HKD / Forex": -0.9, "HK Bonds": +1.4 },
    analysis: "POLICY DISAPPOINTMENT: A lower growth target reduces pressure for large-scale stimulus. Markets had priced in a 'rescue package' — the absence triggers de-rating. HK Property suffers most: China property linkage + no rescue plan = further downside. HSI falls as H-shares re-price on weaker China growth. HK Bonds benefit modestly as rate cut hopes persist. CNH and HKD weaken marginally. KEY DISCUSSION: Does targeted stimulus solve structural weakness? Is the China slowdown a short-term headwind or a structural shift for HK markets?",
    tip: "💡 ANALYST TIP: Policy disappointment in China historically weighs on HK property for 2–3 quarters. Watch for HKMA and HKEX policy responses as secondary circuit breakers."
  },
  {
    id: 4,
    title: "AFTERMATH: Portfolio Verdict — Who Survived the Shocks?",
    cardType: "FINAL DEAL: PORTFOLIO RESOLUTION",
    cardIcon: "🏆",
    news: "AFTERMATH REVIEW — Two macro shocks have hit Hong Kong markets in rapid succession: a geopolitical risk-off event (Iran war) and a China policy disappointment (NPC underwhelm). Markets are now in a post-shock equilibrium. The question for every fund manager: who built the strongest diversified position? Who rotated at the right time? And what does the outlook look like from here — further stress, or a recovery catalyst on the horizon?",
    markets: ["HK Equities (HSI)", "HK Property", "HK Bonds", "HKD / Forex"],
    movements: { "HK Equities (HSI)": +2.3, "HK Property": -1.2, "HKD / Forex": +0.8, "HK Bonds": -0.6 },
    analysis: "OUTLOOK & POSITIONING: Short-term volatility remains elevated — geopolitical risk and China growth uncertainty are not resolved. Medium-term: watch for PBOC easing, HKMA liquidity support, and potential China fiscal surprise. HK Bonds remain the defensive anchor. Property faces structural headwinds (2–3 quarter drag). Equities may find a floor if China delivers targeted tech/consumption stimulus. HKD peg is structurally sound — HKMA has deep FX reserves. TRADE RECOMMENDATION: Overweight bonds + selective HK tech equities. Underweight property until floor is confirmed. Neutral HKD. FUND MANAGER VERDICT: Who preserved capital across both shocks?",
    tip: "💡 FINAL TIP: The best fund managers don't predict every shock — they build resilient portfolios that survive them. Diversification across all four asset classes was the winning strategy."
  }
];

const STARTING_CAPITAL = 10000;
const TIP_COST = 500;

let gameState = {
  phase: 'lobby',
  currentRound: 0,
  votingOpen: false,
  votes: {},
  players: {},
  timerEnd: null,
  votesProcessed: false,
  tipRevealed: false,
};

function getRound() { return ROUNDS[gameState.currentRound]; }

function calcPnl(votes, movements) {
  let pnl = 0;
  for (const [market, vote] of Object.entries(votes)) {
    const move = movements[market] || 0;
    const direction = vote.direction === 'long' ? 1 : -1;
    const multiplier = vote.multiplier || 1;
    pnl += (vote.amount * direction * move * multiplier) / 100;
  }
  return Math.round(pnl * 100) / 100;
}

function getLeaderboard() {
  return Object.entries(gameState.players)
    .map(([id, p]) => ({ name: p.name, pnl: Math.round(p.pnl * 100) / 100, capital: Math.round((STARTING_CAPITAL + p.pnl) * 100) / 100 }))
    .sort((a, b) => b.capital - a.capital);
}

function getVoteTally() {
  const tally = {};
  const round = getRound();
  if (!round) return tally;
  round.markets.forEach(m => { tally[m] = { long: 0, short: 0, skip: 0 }; });
  for (const votes of Object.values(gameState.votes)) {
    for (const [market, vote] of Object.entries(votes)) {
      if (tally[market]) tally[market][vote.direction] = (tally[market][vote.direction] || 0) + 1;
    }
  }
  return tally;
}

function broadcastState() {
  const round = getRound();
  io.emit('state', {
    phase: gameState.phase,
    currentRound: gameState.currentRound,
    round: round ? {
      id: round.id, title: round.title, news: round.news, markets: round.markets,
      cardType: round.cardType, cardIcon: round.cardIcon,
      analysis: gameState.phase === 'reveal' ? round.analysis : null,
      movements: gameState.phase === 'reveal' ? round.movements : null,
      voteTally: gameState.phase === 'reveal' ? getVoteTally() : null,
    } : null,
    votingOpen: gameState.votingOpen,
    playerCount: Object.keys(gameState.players).length,
    leaderboard: getLeaderboard(),
    timerEnd: gameState.timerEnd,
    tipRevealed: gameState.tipRevealed,
  });
}

io.on('connection', (socket) => {
  socket.on('join', ({ name }) => {
    if (!gameState.players[socket.id]) {
      gameState.players[socket.id] = { name, pnl: 0, history: [], tipsBought: 0 };
    }
    socket.emit('joined', { id: socket.id, capital: STARTING_CAPITAL, startingCapital: STARTING_CAPITAL });
    broadcastState();
  });

  socket.on('submitVotes', ({ votes }) => {
    if (!gameState.votingOpen) return;
    gameState.votes[socket.id] = votes;
    socket.emit('votesReceived');
    io.to('host').emit('voteCount', Object.keys(gameState.votes).length);
  });

  socket.on('buyTip', () => {
    const player = gameState.players[socket.id];
    if (!player) return;
    const currentCapital = STARTING_CAPITAL + player.pnl;
    if (currentCapital < TIP_COST) { socket.emit('tipError', 'Not enough capital!'); return; }
    player.pnl -= TIP_COST;
    player.tipsBought++;
    const round = getRound();
    socket.emit('tipRevealed', { tip: round.tip, cost: TIP_COST });
    socket.emit('capitalUpdate', { capital: Math.round((STARTING_CAPITAL + player.pnl) * 100) / 100 });
  });

  socket.on('hostJoin', () => {
    socket.join('host');
    socket.emit('hostJoined');
    broadcastState();
    setTimeout(() => broadcastState(), 200);
  });

  socket.on('hostStartRound', () => {
    gameState.currentRound = 0; gameState.phase = 'news';
    gameState.votes = {}; gameState.votingOpen = false; gameState.tipRevealed = false;
    broadcastState();
  });

  socket.on('hostOpenVoting', () => {
    gameState.phase = 'voting'; gameState.votingOpen = true;
    gameState.votes = {}; gameState.tipRevealed = false;
    gameState.timerEnd = Date.now() + 60000;
    broadcastState();
  });

  socket.on('hostReveal', () => {
    gameState.votingOpen = false; gameState.phase = 'reveal';
    const round = getRound();
    for (const [sid, votes] of Object.entries(gameState.votes)) {
      if (gameState.players[sid]) {
        const pnl = calcPnl(votes, round.movements);
        gameState.players[sid].pnl += pnl;
        gameState.players[sid].history.push({ round: round.id, pnl });
        io.to(sid).emit('roundResult', { pnl, totalCapital: Math.round((STARTING_CAPITAL + gameState.players[sid].pnl) * 100) / 100 });
      }
    }
    gameState.votesProcessed = true;
    broadcastState();
  });

  socket.on('hostNextRound', () => {
    if (gameState.currentRound < ROUNDS.length - 1) {
      gameState.currentRound++; gameState.phase = 'news';
      gameState.votes = {}; gameState.votesProcessed = false;
      gameState.votingOpen = false; gameState.tipRevealed = false;
      broadcastState();
    } else {
      const lb = getLeaderboard();
      for (const [sid, player] of Object.entries(gameState.players)) {
        io.to(sid).emit('finalResult', { totalCapital: Math.round((STARTING_CAPITAL + player.pnl) * 100) / 100, leaderboard: lb });
      }
      gameState.phase = 'end';
      broadcastState();
    }
  });

  socket.on('hostReset', () => {
    gameState = { phase: 'lobby', currentRound: 0, votingOpen: false, votes: {}, players: {}, timerEnd: null, votesProcessed: false, tipRevealed: false };
    broadcastState();
  });

  socket.on('disconnect', () => console.log('Disconnected:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`HK Monopoly Deal Market running on http://localhost:${PORT}`));
