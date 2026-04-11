# 🤖 Jayzen — Personal AI Productivity Agent

> Built with ElizaOS v2 + Nosana decentralized GPU • Inspired by #OpenClaw

Jayzen is a personal AI productivity agent that manages your Gmail, Google Calendar, and reminders — running on decentralized compute, not Big Tech servers.

🌐 **Live Demo:** https://2qKWJJfU9mvdbaDHTqB3tjWsDLFJQdXbNTDn4mezP1Jt.node.k8s.prd.nos.ci

---

## ✨ Features
- 📧 **Email Management** — Read, summarize, and check emails via Gmail
- 📅 **Calendar** — View and create Google Calendar events
- ⏰ **Reminders** — Set daily reminders via chat
- 🤖 **AI Chat** — Powered by DeepSeek on Nosana's decentralized GPU
- 🔐 **Google OAuth** — Secure personal authentication

---

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Agent Framework | ElizaOS v2 |
| LLM Inference | DeepSeek-R1 via Nosana decentralized GPU |
| Backend | Node.js + Express |
| Frontend | HTML/CSS/JS |
| Email | Gmail API (OAuth2) |
| Calendar | Google Calendar API (OAuth2) |
| Reminders | node-cron |
| Deployment | Nosana Decentralized GPU (NVIDIA 3060) |

---

## 🚀 Setup

### Prerequisites
- Node.js v20+
- Bun
- Google Cloud account
- Nosana account (for compute credits)

### Installation

**1. Fork & clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/agent-challenge.git
cd agent-challenge
git checkout elizaos-challenge
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
MODEL_NAME=YOUR_MODEL_NAME
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
- Add yourself as a test user under OAuth consent screen

**5. Get your Nosana GPU endpoint**
- Go to [Nosana Dashboard](https://dashboard.nosana.com)
- Deploy a model (e.g. DeepSeek-R1-Distill-Qwen-1.5B)
- Copy the endpoint URL into your `.env`

**6. Start Jayzen**
```bash
elizaos start
```

**7. Open in browser**
http://localhost:3000

**8. Connect your Google account**
Click **"Connect Google"** in the sidebar and authenticate.

---

## 📁 Project Structure
agent-challenge/
├── characters/
│   └── agent.character.json  # Jayzen's ElizaOS character definition
├── server/
│   ├── index.js              # Express server
│   ├── routes/
│   │   ├── agent.js          # AI chat endpoint
│   │   ├── auth.js           # Google OAuth
│   │   └── reminders.js      # Reminders API
│   └── plugins/
│       ├── gmail.js          # Gmail integration
│       └── calendar.js       # Calendar integration
├── web/
│   ├── index.html            # Chat UI
│   ├── styles.css            # Styling
│   └── app.js                # Frontend logic
├── nos_job_def/
│   └── nosana_eliza_job_definition.json  # Nosana deployment config
├── .env.example              # Environment template
└── README.md

---

## 🐳 Deploy on Nosana

**1. Build and push Docker image**
```bash
docker build -t YOUR_DOCKERHUB_USERNAME/jayzen:latest .
docker push YOUR_DOCKERHUB_USERNAME/jayzen:latest
```

**2. Deploy on Nosana Dashboard**
- Go to [Nosana Dashboard](https://dashboard.nosana.com/deploy)
- Use the job definition in `nos_job_def/nosana_eliza_job_definition.json`
- Select your GPU market
- Click Deploy and get your live URL

---

## 🌐 Live Deployment
Jayzen is deployed on [Nosana](https://nosana.com) decentralized GPU network running on NVIDIA 3060.

**Live URL:** https://2qKWJJfU9mvdbaDHTqB3tjWsDLFJQdXbNTDn4mezP1Jt.node.k8s.prd.nos.ci

---

## 🔓 License
MIT — Open source, fork it, make it yours.

---

## 🙏 Built for
[Nosana x ElizaOS Agent Challenge](https://github.com/nosana-ci/agent-challenge) • #OpenClaw