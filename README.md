# Lumnia — AI Chatbot & Conversation Intelligence Platform

Lumnia is an advanced, production-grade AI-powered chatbot and conversation intelligence platform. It enables users to interact with an AI assistant powered by Google Gemini while simultaneously performing real-time sentiment, intent, tone, and confidence analysis on AI-generated responses.

Designed with a sleek, dark glassmorphism design system, Lumnia features secure Firebase Authentication, per-user Firestore chat history persistence, real-time response analysis telemetry, dynamic API response latency measurement, keyword search filtering, and an analytics dashboard.

---

## 🏗️ Tech Stack & System Architecture

Lumnia is deployed as a **Single Render Web Service** where Python Flask handles both API endpoints (`/api/*`) and serves the compiled React SPA static assets (`dist/`):

- **Frontend**: React 19 (TypeScript), Vite, TailwindCSS v4, Framer Motion, Lucide Icons.
- **Backend API & Asset Host**: Python Flask, `google-genai` SDK, `flask-cors`, `flask-limiter`, `gunicorn`.
- **AI Intelligence Engine**: Google Gemini API (`gemini-3.6-flash`).
- **Database & Storage**: Firebase Firestore (per-user message isolation & persistence).
- **Authentication**: Firebase Authentication (Email/Password & Google SSO).

```
Single Render Web Service (Python Flask)
├── /api/*   ──────► Gemini AI Service (Python google-genai SDK)
└── /*       ──────► Built React SPA Static Assets (dist/index.html)
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
│   ├── app.py                # Flask Server (API Routes & React SPA Asset Host)
│   ├── routes/
│   │   └── chat_routes.py    # /api/chat & /api/health Endpoints
│   ├── services/
│   │   └── gemini_service.py # Gemini AI & Sequential Analysis Service
│   ├── requirements.txt      # Python Dependencies (Flask, Gunicorn, google-genai)
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

## 🚀 Local Development Setup

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

---

### 2. Setup React Frontend

In a new terminal window:

```bash
# Install Frontend Dependencies
npm install

# Start Vite Development Server (Runs on http://localhost:5173)
npm run dev
```

Open your browser at `http://localhost:5173`. During local development, Vite automatically proxies `/api/*` requests to the Flask backend on port 5000.

---

## 🌐 Single Render Web Service Deployment Guide

To deploy Lumnia as a **Single Web Service** on Render:

1. Connect your GitHub repository to [Render](https://render.com/).
2. Create a new **Web Service** and select the repository.
3. Configure the service settings:
   - **Environment**: `Python 3`
   - **Build Command**: `npm install && npm run build && pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT backend.app:app`
4. Add **Environment Variables** in the Render Dashboard:
   - `GEMINI_API_KEY`: Secret Gemini API key from Google AI Studio.
   - `GEMINI_MODEL`: `gemini-3.6-flash`
   - `FLASK_ENV`: `production`
5. Click **Deploy Web Service**. Render will build the React SPA, install Python dependencies, and launch Gunicorn to serve both the frontend UI and Flask API endpoints on a single URL.

---

## 🔐 Environment Variables

| Variable Name | Location | Required | Description | Example |
|---|---|---|---|---|
| `GEMINI_API_KEY` | `backend/.env` / Render | **Yes** | Google Gemini API Key (Backend ONLY) | `AIzaSy...` |
| `GEMINI_MODEL` | `backend/.env` / Render | No | Gemini Model Variant | `gemini-3.6-flash` |
| `PORT` | `backend/.env` / Render | No | Backend Port | `5000` |
| `FLASK_ENV` | `backend/.env` / Render | No | Environment Mode | `development` / `production` |
| `ALLOWED_ORIGINS` | `backend/.env` / Render | No | CORS Allowed Origins | `http://localhost:5173,http://localhost:3000` |
| `VITE_FIREBASE_API_KEY` | `.env` | Yes | Firebase Web API Key | `AIzaSy...` |

---

## 🧪 Testing & Verification

1. **Backend & SPA Health Check**:
   ```bash
   python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:5000/api/health').read().decode())"
   ```
   *Expected Output*: `{"gemini_configured":true,"status":"healthy"}`

2. **Frontend SPA Root Check**:
   ```bash
   python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:5000/').read().decode()[:100])"
   ```
   *Expected Output*: `<!doctype html><html lang="en">...`

3. **Frontend Production Build**:
   ```bash
   npm run build
   ```

---

## 📄 Internship Submission Summary

> **Lumnia** is an AI-powered chatbot and conversation intelligence platform that enables users to interact with a conversational assistant while analyzing sentiment, intent, tone, and confidence of AI responses in real time. Deployed as a single Render Web Service, Python Flask serves the compiled React SPA frontend alongside REST API endpoints integrating the Google Gemini SDK with secure Firebase Authentication and Firestore history persistence.

---

## 📜 License

MIT License. Developed for Production & Academic Internship Submission.
