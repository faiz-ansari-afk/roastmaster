<div align="center">

# 🔥 RoastMaster AI

### The AI chatbot that answers your questions while roasting your existence

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

![RoastMaster Preview](https://roastmaster-phi.vercel.app/og-preview.png)

**Ask a question. Get roasted. Repeat.**

[Live Demo](https://roastmaster-phi.vercel.app) · [Report Bug](https://github.com/yourusername/roastmaster/issues) · [Request Feature](https://github.com/yourusername/roastmaster/issues)

</div>

---

## 🎯 What is this?

RoastMaster AI is a savage, hilariously brutal AI chatbot that answers every question with maximum sarcasm and Hinglish roasting. Built with Next.js 15, powered by Google Gemini AI, and backed by Firebase for auth and chat history.

```
You:  "What is 2+2?"
Bot:  "Fine, 2+2=4. Congrats on knowing addition.
       Most log ye age 5 mein seekh lete hain. 🔥"
```

---

## ✨ Features

- 🔥 **Savage Hinglish Roasting** — Every answer dripping with sarcasm and desi memes
- ⚡ **Word-by-word animation** — Replies appear word by word, feels like real typing
- 💾 **Chat History** — All sessions saved per user in Firestore
- 👤 **Guest + Auth Login** — Continue as guest or sign in with Google / Email
- 📱 **Responsive Design** — Works on mobile and desktop
- 🎬 **Animated Intro** — Cinematic landing page with live demo before entering chat
- 🔐 **Secure** — Firestore rules ensure users only access their own data

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| AI | Google Gemini 2.5 Flash Lite |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Deployment | Vercel |

---

## 📁 Project Structure

```
roastmaster/
├── app/
│   ├── layout.js              # Root layout + AuthProvider
│   ├── page.js                # Animated intro page
│   ├── globals.css            # Global styles
│   ├── favicon.svg            # 🔥 Fire favicon
│   ├── chat/
│   │   └── page.jsx           # Main chat page
│   └── api/
│       └── chat/
│           └── route.js       # Gemini API endpoint (server-side)
├── components/
│   ├── AuthModal.jsx          # Login / Signup / Guest modal
│   ├── Sidebar.jsx            # Chat history sidebar
│   └── ChatWindow.jsx         # Main chat UI + word animation
├── contexts/
│   └── AuthContext.jsx        # Firebase Auth state
├── lib/
│   ├── firebase.js            # Firebase initialization
│   └── firestore.js           # Firestore CRUD helpers
└── firestore.rules            # Security rules
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com/) project
- A [Google AI Studio](https://aistudio.google.com/) API key (free)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/roastmaster.git
cd roastmaster
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create project
2. **Authentication** → Enable: `Email/Password`, `Google`, `Anonymous`
3. **Firestore** → Create database → Production mode → Region: `asia-south1`
4. Apply security rules (see below)
5. **Project Settings** → Your apps → Add web app → Copy config

### 4. Apply Firestore Security Rules

In Firebase Console → Firestore → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

### 5. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
# Gemini AI (free key from https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_gemini_key_here

# Firebase (from Firebase Console → Project Settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxx
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🔥

---

## 🌐 Deploy to Vercel

### Option A — GitHub + Vercel (recommended)

1. Push to GitHub:
```bash
git add .
git commit -m "🔥 Initial commit"
git push origin main
```

2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Add all environment variables in Vercel dashboard:
   - `Settings` → `Environment Variables` → add all vars from `.env.local`
4. Deploy!

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
vercel env add GEMINI_API_KEY
# ... add all other env vars
vercel --prod
```

### After deploying

Add your Vercel domain to Firebase authorized domains:
- Firebase Console → **Authentication → Settings → Authorized domains** → Add `roastmaster-phi.vercel.app`

---

## 🗄️ Firestore Data Structure

```
users/
  {userId}/
    sessions/
      {sessionId}/
        title: "What is 2+2?"       ← auto-generated from first message
        createdAt: Timestamp
        updatedAt: Timestamp
        messageCount: 6
        messages/
          {messageId}/
            role: "user" | "assistant"
            content: "What is 2+2?"
            createdAt: Timestamp
```

---

## ⚙️ Configuration

### Change AI personality

Edit `app/api/chat/route.js` → `SYSTEM_PROMPT` constant.

### Change roast language

Add/remove rule 11 in the system prompt to toggle Hinglish mode.

### Change animation speed

In `components/ChatWindow.jsx` → `AnimatedBotMessage`:
```js
const delay = hasPunct ? 120 : 42;  // ms per word
```

### Swap AI model

In `app/api/chat/route.js`:
```js
model: "gemini-2.5-flash-lite"   // change this
```

Available free models: `gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-pro`

---

## 🐛 Common Issues

| Error | Fix |
|---|---|
| `auth/invalid-api-key` | Check `NEXT_PUBLIC_FIREBASE_API_KEY` in env vars |
| `Database '(default)' not found` | Check `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches your actual project ID |
| `permission-denied` on Firestore | Apply security rules in Firebase Console → Firestore → Rules |
| `auth/unauthorized-domain` | Add your domain in Firebase → Authentication → Authorized domains |
| Gemini 429 quota error | Switch model or wait — free tier has rate limits |
| Env vars work locally but not on Vercel | Add all vars in Vercel dashboard → Settings → Environment Variables → Redeploy |

---

## 📄 License

MIT License — do whatever you want with this, just don't blame me when your users cry.

---

<div align="center">

Built with 🔥 by [Faiz](https://github.com/yourusername)

*"Itni dikkat hai toh Pakistan chale jao."* — RoastMaster AI

</div>
