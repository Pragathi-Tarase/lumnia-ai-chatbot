# Lumnia — AI Chatbot & Conversation Intelligence Platform

Lumnia is an advanced, production-grade AI-powered chatbot and conversation intelligence platform. It enables users to interact with an AI assistant powered by Google Gemini while simultaneously performing real-time sentiment, intent, tone, and confidence analysis on AI-generated responses.

Designed with a sleek, dark glassmorphism design system, Lumnia features secure Firebase Authentication, per-user Firestore chat history persistence, real-time response analysis telemetry, dynamic API response latency measurement, keyword search filtering, and an analytics dashboard.

---

## 🏗️ Tech Stack & System Architecture

Lumnia follows a decoupled, production-ready architecture:

- **Frontend**: React 19 (TypeScript), Vite, TailwindCSS v4, Framer Motion, Lucide Icons.
- **Backend API**: Python Flask, `google-genai` SDK, `flask-cors`, `flask-limiter`, `python-dotenv`.
- **AI Intelligence Engine**: Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`).
- **Database & Storage**: Firebase Firestore (per-user message isolation & persistence).
- **Authentication**: Firebase Authentication (Email/Password & Google SSO).

```
React Frontend (Port 5173) ──► Proxy (/api) ──► Python Flask Backend (Port 5000)
       │                                                      │
       ▼                                                      ▼
Firebase Auth & Firestore                             Google Gemini AI Engine
```

> **Security Note**: The `GEMINI_API_KEY` resides **exclusively** on the Python Flask backend (`backend/.env`). The React frontend never touches or exposes the Gemini API key.

---

## 🌟 Key Features

1. **AI Chat Interface & Real-Time Typing Indicator**:
   - Smooth conversational UI with loading/typing animations ("Analyzing response...").
   - Multi-turn dialog context mapping.

2. **Sequential Response Intelligence Telemetry**:
   - **Target**: Evaluates and profiles the AI-generated chatbot response.
   - **Sentiment Analysis**: Classifies response tone as `positive`, `neutral`, or `negative`.
   - **Intent Detection**: Evaluates conversation intent (`informational`, `emotional`, `transactional`).
   - **Tone Profiling**: Evaluates response style (`formal`, `casual`, `empathetic`).
   - **Confidence Scoring**: Dynamic confidence meter based on AI schema validation.

3. **Dynamic Performance Analytics**:
   - **API Response Latency**: Real-time measurement of end-to-end request-to-response duration (displayed in milliseconds, `N/A` when empty). No hardcoded performance numbers.
   - **Historical Dialogue Metrics**: Aggregated sentiment distribution and intent breakdown.

4. **Conversation History & Keyword Search**:
   - Real-time keyword filtering across conversation history (`X OF Y FOUND`).
   - Per-user Firestore persistence with confirmation gate for purging history.

5. **Security & Authentication**:
   - Email/Password authentication & Google Single Sign-On (SSO).
   - Security rule validation enforcing strict per-user data isolation (`users/{userId}/messages/{messageId}`).
   - Environment-configurable CORS allowed-origins.

---

## 🛠️ Project Structure

```
lumnia/
├── backend/                  # Python Flask Backend
│   ├── app.py                # Flask Application Entrypoint, CORS & Limiter setup
│   ├── routes/
│   │   └── chat_routes.py    # /api/chat & /api/health Endpoints
│   ├── services/
│   │   └── gemini_service.py # Gemini AI & Sequential Analysis Service
│   ├── requirements.txt      # Python Dependencies
│   └── .env.example          # Backend Environment Configuration Template
├── src/                      # React TypeScript Frontend
│   ├── components/           # UI Components
│   │   ├── AnalysisPanel.tsx # Telemetry & Analytics Dashboard
│   │   ├── AuthScreen.tsx    # Firebase Authentication View
│   │   ├── ChatWindow.tsx    # Main Chat View & Search Filter
│   │   └── MessageBubble.tsx # Message Display & Telemetry Badges
│   ├── App.tsx               # Main Application Layout & Auth Sync
│   ├── firebase.ts           # Firebase Auth & Firestore Client Config
│   └── types.ts              # TypeScript Interfaces & Data Models
├── firestore.rules           # Firestore Cloud Security Rules
├── package.json              # Frontend Dependencies & NPM Scripts
├── vite.config.ts            # Vite Configuration & Backend Proxy Setup
└── .env.example              # Main Environment Variables Reference
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Google Gemini API Key ([Get API Key](https://aistudio.google.com/))
- Firebase Project ([Firebase Console](https://console.firebase.google.com/))

---

### 1. Setup Python Flask Backend

```bash
# Navigate to project directory
cd lumnia--main

# (Optional) Create Python Virtual Environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Backend Dependencies
pip install -r backend/requirements.txt

# Create backend/.env File from Template
cp backend/.env.example backend/.env

# Add your Gemini API Key in backend/.env:
# GEMINI_API_KEY=your_actual_gemini_api_key

# Start Python Flask Server (Runs on http://127.0.0.1:5000)
python backend/app.py
```

*Production Scaling Note*: For multi-instance production deployments, configure `Flask-Limiter` to use a persistent/shared storage backend like Redis (`storage_uri="redis://localhost:6379"`) instead of the default in-memory storage.

---

### 2. Setup React Frontend

In a new terminal window:

```bash
# Install Frontend Dependencies
npm install

# Start Vite Development Server (Runs on http://localhost:5173)
npm run dev
```

Open your browser at `http://localhost:5173`. The Vite server automatically proxies `/api/*` requests to the Flask backend on port 5000.

---

## 🔐 Environment Variables

| Variable Name | Location | Required | Description | Example |
|---|---|---|---|---|
| `GEMINI_API_KEY` | `backend/.env` | **Yes** | Google Gemini API Key (Backend ONLY) | `AIzaSy...` |
| `GEMINI_MODEL` | `backend/.env` | No | Gemini Model Variant | `gemini-2.5-flash` |
| `PORT` | `backend/.env` | No | Backend Port | `5000` |
| `FLASK_ENV` | `backend/.env` | No | Environment Mode | `development` / `production` |
| `ALLOWED_ORIGINS` | `backend/.env` | No | CORS Allowed Origins | `http://localhost:5173,http://localhost:3000` |
| `VITE_FIREBASE_API_KEY` | `.env` | Yes | Firebase Web API Key | `AIzaSy...` |

---

## 🧪 Testing & Verification

1. **Backend Health Check**:
   ```bash
   python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:5000/api/health').read().decode())"
   ```
   *Expected Output*: `{"gemini_configured":true,"status":"healthy"}`

2. **Frontend Production Build**:
   ```bash
   npm run build
   ```

3. **Backend Rate Limiting & Error Boundaries**:
   - Handled gracefully with clean JSON error responses (`HTTP 400` / `HTTP 500` / `HTTP 429`) instead of raw stack traces.

---

## 📄 Internship Submission Summary

> **Lumnia** is an AI-powered chatbot and conversation intelligence platform that enables users to interact with a conversational assistant while analyzing sentiment, intent, tone, and confidence of AI responses in real time. The platform features secure Firebase Authentication, persistent per-user Firestore chat history, keyword message filtering, dynamic response latency tracking, responsive dark UI styling, and a clean Python Flask REST API integrating the Google Gemini SDK.

---

## 📜 License

MIT License. Developed for Production & Academic Internship Submission.
