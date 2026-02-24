# 🎮 Market Call — Live Trading Game

An interactive trading game for financial presentations. Players use their phones to go Long or Short on 4 markets (Bond, Equity, Forex, Property) after seeing a news headline. The host reveals prices and fundamental analysis after all votes are in.

---

## 🚀 Quick Setup (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm start
```

Then open:
- **Host screen** (projected): `http://localhost:3000/host.html`
- **Player link** (share with audience): `http://localhost:3000/player.html`

---

## ☁️ Deploy to Render (Free, Recommended)

1. Push this folder to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
5. Deploy → get a public URL like `https://market-call-xxxx.onrender.com`

Share with your audience:
- **Host:** `https://your-app.onrender.com/host.html`
- **Players:** `https://your-app.onrender.com` (or `/player.html`)

---

## 🎮 How to Run the Game

### Game Flow (per round)
1. **Host opens** `/host.html` on the projected screen
2. **Share** the player URL with the class (QR code or shorten via bit.ly)
3. Players **join** by entering their name
4. **Present the news** (it shows on the host screen)
5. Click **"OPEN VOTING (60s)"** — countdown starts on all screens
6. Players choose **Long / Short** and an **amount ($500–$5,000)** for each market
7. Click **"REVEAL PRICES"** — movements and P&L calculate instantly
8. **Present your fundamental analysis** (shown on host screen)
9. Click **"NEXT ROUND →"** to continue
10. After 4 rounds, **Game Over** screen shows the winner!

### Rounds
| Round | Theme | Key Move |
|-------|-------|----------|
| 1 | Fed Rate Pause | Bonds ↑, Equities ↑, USD ↓ |
| 2 | China Slowdown | Risk-off, Bonds ↑, Equities ↓ |
| 3 | Oil Shock | Bonds ↓ (inflation), Equities ↓ |
| 4 | AI/Tech Boom | Equities ↑↑, Property ↑ |

### Scoring
- Everyone starts with **$10,000**
- Allocate up to $5,000 per market per round
- P&L = `amount × direction × price_move%`
- Leaderboard updates live after each reveal

---

## ✏️ Customising the Game

To change the news, markets, or price movements, edit the `ROUNDS` array in `server.js`:

```js
{
  id: 1,
  title: "Round 1: The Fed Speaks",
  news: "Your custom news text here...",
  markets: ["Bond", "Equity", "Forex (USD)", "Property"],
  movements: { Bond: +4.2, Equity: +2.8, "Forex (USD)": -1.5, Property: +1.1 },
  analysis: "Your fundamental analysis explanation here..."
}
```

Positive movement = price went UP (Long wins). Negative = price went DOWN (Short wins).

---

## 📁 File Structure

```
market-call/
├── server.js          # Node.js + Socket.io backend
├── package.json
└── public/
    ├── index.html     # Redirects to player
    ├── host.html      # Host control panel (project this)
    └── player.html    # Player mobile interface
```
