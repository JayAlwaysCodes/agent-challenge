
# 🤖 Jayzen — Personal AI Productivity Agent

> Built with ElizaOS v2 + Nosana decentralized GPU • Inspired by #OpenClaw

Jayzen is a personal AI productivity agent that manages your Gmail, Google Calendar, and reminders — running on decentralized compute, not Big Tech servers.

## ✨ Features
- 📧 **Email Management** — Read, summarize, and send emails via Gmail
- 📅 **Calendar** — View and create Google Calendar events
- ⏰ **Reminders** — Set daily reminders via chat
- 🤖 **AI Chat** — Powered by Qwen3.5 on Nosana's decentralized GPU
- 🔐 **Google OAuth** — Secure personal authentication

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Agent Framework | ElizaOS v2 |
| LLM Inference | Qwen/Qwen3.5-4B via Nosana |
| Backend | Node.js + Express |
| Frontend | HTML/CSS/JS |
| Email | Gmail API (OAuth2) |
| Calendar | Google Calendar API (OAuth2) |
| Reminders | node-cron |
| Deployment | Nosana Decentralized GPU |

## 🚀 Setup

### Prerequisites
- Node.js v20+
- Bun
- Google Cloud account
- Nosana account (for compute credits)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/JayAlwaysCodes/agent-challenge.git
cd agent-challenge
```

**2. Install dependencies**
```bash
bun install
```

**3. Set up environment variables**
```bash
cp .env.example .env
```

Fill in your values:
```bash
OPENAI_API_KEY=nosana
OPENAI_API_URL=https://YOUR_NOSANA_ENDPOINT/v1
MODEL_NAME=Qwen/Qwen3.5-4B
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
SERVER_PORT=3000
```

**4. Set up Google OAuth**
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a project and enable Gmail API + Google Calendar API
- Create OAuth 2.0 credentials (Web application)
- Add `http://localhost:3000/auth/google/callback` as redirect URI

**5. Run Jayzen**
```bash
node server/index.js
```

**6. Open in browser**

**7. Connect your Google account**
Click **"Connect Google"** in the sidebar and authenticate.

## 📁 Project Structure
agent-challenge/
├── agent/
│   └── character.json      # Jayzen's personality
├── server/
│   ├── index.js            # Express server
│   ├── routes/
│   │   ├── agent.js        # AI chat endpoint
│   │   ├── auth.js         # Google OAuth
│   │   └── reminders.js    # Reminders API
│   └── plugins/
│       ├── gmail.js        # Gmail integration
│       └── calendar.js     # Calendar integration
├── web/
│   ├── index.html          # Chat UI
│   ├── styles.css          # Styling
│   └── app.js              # Frontend logic
├── .env.example            # Environment template
└── README.md

## 🌐 Deployment
Jayzen runs on [Nosana](https://nosana.com) decentralized GPU network.

## 🔓 License
MIT — Open source, fork it, make it yours.

## 🙏 Built for
[Nosana x ElizaOS Agent Challenge](https://github.com/nosana-ci/agent-challenge) • #OpenClaw
EOF