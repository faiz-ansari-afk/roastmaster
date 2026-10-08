<div align="center">

# 🔥 RoastMaster AI (`roastmaster-ai`)

### *The Unfiltered AI Standup Comedian & Code Reviewer With Zero Mercy.*

[![npm version](https://img.shields.io/badge/npm-v1.0.0-EC4899?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/roastmaster-ai)
[![Live Web Stage](https://img.shields.io/badge/Live_Stage-roastmaster--phi.vercel.app-F43F5E?style=for-the-badge&logo=vercel&logoColor=white)](https://roastmaster-phi.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.5_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![pgvector](https://img.shields.io/badge/Aiven_pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://aiven.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

<br />

**Tired of diplomatic PR comments? Roastmaster shreds your repository sins, recursive state loops, and midnight commits — then hands you constructive Senior-Staff architectural advice.**

<br />

[🎙️ Enter The Live Stage](https://roastmaster-phi.vercel.app/chat) · [📦 View on npm](https://www.npmjs.com/package/roastmaster-ai) · [⚡ Quick CLI Start](#-instant-cli-quickstart)

</div>

---

## ⚡ Instant CLI Quickstart

You don't even need to install anything. Run it directly in **any** git repository:

```bash
# Roast your current repository status & questionable dependencies
npx roastmaster-ai --roast-repo
```

```bash
# Roast your uncommitted git diff before your tech lead sees it
npx roastmaster-ai --diff
```

```bash
# Roast a suspicious source code file
npx roastmaster-ai -f src/components/App.tsx
```

```bash
# Quick freestyle query
npx roastmaster-ai "I use localStorage to save production Stripe keys"
```

### 📺 Sample Terminal Output

```text
  ____   ___     _    ____ _____ __  __    _    ____ _____ _____ ____  
 |  _ \ / _ \   / \  / ___|_   _|  \/  |  / \  / ___|_   _| ____|  _ \ 
 | |_) | | | | / _ \ \___ \ | | | |\/| | / _ \ \___ \ | | |  _| | |_) |
 |  _ <| |_| |/ ___ \ ___) || | | |  | |/ ___ \ ___) || | | |___|  _ < 
 |_| \_\\___//_/   \_\____/ |_| |_|  |_/_/   \_\____/ |_| |_____|_| \_\
  LIVE DEV STANDUP • ZERO MERCY CODE CRITIQUE • v2.5 CLI

  📦 Scanning Repository Context...
[✦] Roastmaster analyzing your code sins with zero mercy...

╭──────────────────────────────────────────────────────────────────────────────╮
│  🎙️  STRIPE SUICIDE SHORTCUT                                                 │
│  🏷️  Security  •  🔥 ██████████ 10/10                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  “Storing live Stripe keys in localStorage is like taping your bank PIN      │
│  to a public billboard in Times Square. Even script kiddies will feel        │
│  guilty stealing from someone this clueless.”                                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  💡 BACKSTAGE REAL TALK (CONSTRUCTIVE FIX):                                  │
│  Backstage Real Talk: Move Stripe API calls exclusively to your secure       │
│  backend server, use environment variables, and rotate that compromised      │
│  secret key immediately before your bank account gets wiped.                 │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯

  ✨ Web Stage: https://roastmaster-phi.vercel.app/chat  •  Roastmaster CLI v2.5
```

---

## ✨ Features That Hurt (In a Good Way)

| Feature | Description |
|---|---|
| 🔥 **Zero Mercy Standup Roasts** | Razor-sharp, 1–2 punchline sentences crafted with stand-up crowd work heuristics. Banned clichés and 100% unique roasts. |
| 🛠️ **Backstage Real Talk** | Every savage roast is paired with constructive, senior-staff architectural advice so you actually fix your code. |
| 📂 **RAG Document Ingestion** | Upload system specs, API docs, or RFC PDFs. Powered by **Aiven pgvector**, Roastmaster extracts vector embeddings and quotes your own documentation against you. |
| 🫧 **Liquid Glass UI + Venom Goo Flow** | Hardware-accelerated VisionOS glassmorphism with an organic, flowing blackish-pink **SVG metaball symbiote** background. |
| 💻 **CLI & Web In One** | Seamless terminal workflow via `npx roastmaster-ai` or full interactive web cellar with teleprompter streams at [roastmaster-phi.vercel.app](https://roastmaster-phi.vercel.app). |
| 📝 **Syntax-Highlighted Code Blocks** | Mobile-safe horizontal scroll containment for code snippets and instant clipboard copying. |
| 💾 **Persistent Standup Sets** | Aiven PostgreSQL session persistence, dynamic title renames, shred set confirmation modals, and VIP pass authentication. |

---

## 🛠️ Tech Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    ROASTMASTER CORE ENGINE                    │
├───────────────────────────────┬───────────────────────────────┤
│ Frontend & CLI Interface      │ Artificial Intelligence Core  │
│ • Next.js 16 (App Router)     │ • Google Gemini 2.5 Flash     │
│ • React 19 + Tailwind CSS v4  │ • Multi-turn structured JSON  │
│ • SVG Metaball Goo Engine     │ • Anthropic SDK Integration   │
│ • VisionOS Liquid Glass Tokens│ • Standup Comedy Heuristics   │
├───────────────────────────────┼───────────────────────────────┤
│ Vector Database & RAG         │ Storage & Authentication      │
│ • Aiven PostgreSQL + pgvector │ • PostgreSQL Sessions & Chats │
│ • 768-dim (gemini-embedding-2)│ • Firebase Auth & VIP Passes  │
│ • True Hybrid Search (RRF)    │ • UnPDF Context Ingestion     │
└───────────────────────────────┴───────────────────────────────┘
```

---

## 💻 CLI Commands & Options

You can install globally:
```bash
npm install -g roastmaster-ai
```
Or run directly via `npx`:
```bash
npx roastmaster-ai [flags]
```

### Flags & Options:

| Flag | Shorthand | Description |
|---|---|---|
| `--roast-repo` | `-r` | Inspects `git status`, recent commits, uncommitted diff, and `package.json` to roast the current repo. |
| `--diff` | `-d` | Roasts only uncommitted or staged `git diff` changes before pushing. |
| `--file <path>` | `-f <path>` | Roasts a specific code file directly. |
| `--help` | `-h` | Displays the ASCII manual and command options. |

---

## 🌐 Web Application Setup

If you want to run the web application locally:

### 1. Clone & Install:
```bash
git clone https://github.com/your-username/nomercy.git
cd nomercy
npm install
```

### 2. Configure Environment (`.env`):
```env
# AI Engine
GEMINI_API_KEY="your-gemini-api-key"

# Vector Database & Storage (Aiven PostgreSQL + pgvector)
DATABASE_URL="postgres://avnadmin:password@your-host.aivencloud.com:port/roastmaster?sslmode=require"
EMBEDDING_MODEL="gemini-embedding-2"
EMBEDDING_DIMENSION=768

# Firebase Client Keys (Authentication for VIP Passes)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3. Run Dev Server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live stage.

---

## 📦 How to Publish to npm

Since the package name `roastmaster-ai` is available on npm, publish in 3 simple steps:

### 1. Log in to npm:
```bash
npm login
```

### 2. Verify files to be published:
```bash
npm pack --dry-run
```
*(Notice that only `bin/` and `README.md` are packaged, keeping download size under 15KB!)*

### 3. Publish to npm:
```bash
npm publish --access public
```

Once published, anyone in the world can run:
```bash
npx roastmaster-ai --roast-repo
```

---

## 📜 License

Distributed under the **MIT License**. Feel free to use, fork, and roast responsibly.

<div align="center">
<sub>Built with 🖤 & 💖 for developers who know their code could be better.</sub>
</div>
