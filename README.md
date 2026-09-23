# EventForge

[![CI](https://github.com/Moeijiro/eventforge/actions/workflows/ci.yml/badge.svg)](https://github.com/Moeijiro/eventforge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![discord.py](https://img.shields.io/badge/Discord-discord.py%20v2.4-5865F2.svg?logo=discord)](https://discordpy.readthedocs.io/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg?logo=next.js)](https://nextjs.org/)

> **EventForge** is a tournament, competitive event, and matchmaking platform built for Discord communities. It manages full competition lifecycles—from registration and check-ins to deterministic bracket generation (with automatic byes), score verification, dispute escalation, and live interactive bracket visualizations.

---

## Tournament Lifecycle Flow

```mermaid
flowchart TD
    A[Admin Publishes Tournament] --> B[Registration Opens in Discord]
    B --> C[Players / Teams Join via Interaction Buttons]
    C --> D{Check-In Window Opens (e.g. T-30m)}
    D -->|Player Confirmed| E[Participant Active in Seed Pool]
    D -->|No Check-In| F[Auto-Drop / Discard Unchecked]
    
    E --> G[Deterministic Bracket Generation]
    G -->|Non-Power-of-Two?| H[Calculate & Allocate Optimal Byes]
    G --> I[Spawn Match Channels / Threads]
    
    I --> J[Match Round Active]
    J --> K[Player A Submits Score (e.g. 2-1)]
    K --> L{Player B Action}
    L -->|Confirms Score| M[Match Finalized & Winner Advances Automatically]
    L -->|Disputes Result| N[Dispute Flagged -> Staff Alerted with Audit Log]
    
    M --> O{Next Round Matches Ready?}
    O -->|Yes| J
    O -->|Final Complete| P[Crown Champion & Archive Tournament Results]
```

---

## Bracket Algorithm & Mathematical Byes

For single-elimination tournaments with $N$ participants:
1. **Bracket Size ($S$)**: Next power of two $S = 2^{\lceil \log_2 N \rceil}$ (e.g., $N=6 \implies S=8$, $N=13 \implies S=16$).
2. **Number of Byes ($B$)**: $B = S - N$.
3. **Round 1 Matches**: $M_1 = \frac{N - B}{2}$. Byes automatically advance top-seeded participants to Round 2 without unplayed match deadlocks.
4. **Deterministic Winner Advancement**: Matches are indexed as $(R, M)$ where winners feed directly into $(\text{Round } R+1, \lfloor M / 2 \rfloor)$.

---

## Core Features

- 🏆 **Single-Elimination & Round-Robin**: Clean algorithmic pairings for both knockout brackets and round-robin points-based leagues.
- 🌳 **Interactive Live Bracket Visualizer**: Web interface rendering desktop horizontal round nodes and mobile-responsive match inspection drawers.
- 🤝 **Dual-Confirmation Result Submission**: Prevents score fraud by requiring opponent confirmation before advancing winners.
- ⚖️ **Staff Dispute Management**: Disputed matches pause bracket advancement for that match, alerting admins to review Discord match chat logs and submit overrides.
- 🕒 **Automated Check-In Windows**: Prevents tournament no-shows by enforcing 30-minute check-in windows prior to bracket generation.
- 🎮 **Lightweight 1v1 Queue Mode**: Self-service matchmaking queue that matches online players and provisions private duel threads.
- 📊 **Verified Tournament Audit Trail**: Immutable logging of registrations, score claims, confirmations, dispute overrides, and champion declarations.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/tournaments/{guild_id}` | List active and archived tournaments |
| `POST` | `/api/v1/tournaments/{guild_id}` | Create and schedule a tournament |
| `GET` | `/api/v1/tournaments/{guild_id}/{id}` | Tournament details, participants, and status |
| `POST` | `/api/v1/tournaments/{guild_id}/{id}/generate-bracket` | Execute bracket algorithm and spawn Round 1 |
| `GET` | `/api/v1/tournaments/{guild_id}/{id}/matches` | List matches by round |
| `POST` | `/api/v1/matches/{match_id}/submit` | Participant score report |
| `POST` | `/api/v1/matches/{match_id}/confirm` | Opponent score confirmation |
| `POST` | `/api/v1/matches/{match_id}/override` | Admin manual dispute resolution |
| `GET` | `/api/v1/leaderboards/{guild_id}` | Community competitive match stats |
| `POST` | `/api/v1/demo/seed` | Seed demo 8-player and 16-player tournaments |

---

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), `discord.py 2.4`, Pydantic v2, pytest
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Database**: SQLite (Dev) / PostgreSQL (Production ready)

---

## Quickstart

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env

pytest
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000` to inspect EventForge.

---

## License

MIT © [Moeijiro](https://github.com/Moeijiro)
