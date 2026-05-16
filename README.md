# 🔐 Password Reset Flow

A complete, production-ready **password reset** web application built with **React + Bootstrap** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## ✨ Features

- 📧 **Email-based reset** — User enters email; backend verifies, generates a secure token, and sends a link
- 🔒 **Cryptographically secure tokens** — 32-byte random hex string via Node.js `crypto`
- ⏰ **Token expiry** — Configurable expiry (default 1 hour); expired links show a clear alert
- 🛡️ **Password strength meter** — Live visual indicator with rule checklist
- 👁️ **Show/hide password** — Toggle visibility on password fields
- ✅ **Client + server validation** — Both layers validate email format, password strength, match
- 🚦 **Rate limiting** — Max 5 reset requests/hour per IP (prevents email flooding)
- 📱 **Fully responsive** — Mobile-first Bootstrap layout
- 🎨 **Polished dark UI** — Outfit + DM Sans fonts, smooth animations, accent glow effects
- 🔄 **Single-use tokens** — Token cleared from DB after successful reset (cannot be reused)

---

## 🗂 Project Structure

```
password-reset/
├── backend/
│   ├── models/
│   │   └── User.js              # Mongoose schema (name, email, password, resetToken, resetTokenExpiry)
│   ├── routes/
│   │   └── auth.js              # POST /forgot-password, GET /verify-token/:token, POST /reset-password/:token
│   ├── utils/
│   │   └── sendEmail.js         # Nodemailer HTML email sender
│   ├── server.js                # Express app entry point
│   ├── package.json
│   └── .env.example             # Copy to .env and fill in
│
├── frontend/
│   ├── public/
│   │   └── index.html           # Google Fonts, Font Awesome
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ForgotPassword.jsx   # Step 1: Enter email
│   │   │   ├── ResetPassword.jsx    # Step 2: Enter new password (token from URL)
│   │   │   └── NotFound.jsx         # 404 fallback
│   │   ├── utils/
│   │   │   └── api.js               # Axios instance + API helpers
│   │   ├── App.js                   # Router setup
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Global styles + CSS variables
│   ├── package.json
│   └── .env.example
│
├── .gitignore
├── package.json                  # Root convenience scripts
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites

- **Node.js** v14+ (recommended: v18 LTS)
- **MongoDB** (Atlas cloud or local)
- **Gmail App Password** (or any SMTP provider)

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/password-reset.git
cd password-reset
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/password-reset-db
JWT_SECRET=your_random_secret_here
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Password Reset <your_gmail@gmail.com>
RESET_TOKEN_EXPIRY=3600000
```

> 💡 **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail"

Start the backend:

```bash
npm run dev   # development (nodemon)
npm start     # production
```

The API runs on `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm start
```

The app opens at `http://localhost:3000`.

---

## 🔄 Password Reset Flow

```
User enters email
       ↓
Backend checks DB
  ├── Not found → Error: "No account with this email"
  └── Found → Generate 64-char random token
                    ↓
              Store token + expiry in DB
                    ↓
              Send email with link:
              {FRONTEND_URL}/reset-password/{token}
                    ↓
         User clicks link → Frontend loads ResetPassword page
                    ↓
              GET /api/auth/verify-token/:token
  ├── Token not found → Show "Invalid link" page
  ├── Token expired   → Show "Expired link" page (clear token from DB)
  └── Token valid     → Show password reset form
                    ↓
         User submits new password
                    ↓
              POST /api/auth/reset-password/:token
  ├── Re-verify token (not expired, not used)
  ├── Validate password strength
  ├── Hash new password (bcrypt, 12 rounds)
  ├── Save to DB
  └── Clear resetToken + resetTokenExpiry from DB
                    ↓
              Show success page ✅
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create test user (demo) |
| POST | `/api/auth/forgot-password` | Request reset email |
| GET  | `/api/auth/verify-token/:token` | Validate token + check expiry |
| POST | `/api/auth/reset-password/:token` | Submit new password |
| GET  | `/api/health` | Server health check |

---

## ☁️ Deployment

### Frontend → Netlify

1. Push code to GitHub
2. Connect repo on [netlify.com](https://www.netlify.com)
3. Set build command: `cd frontend && npm run build`
4. Set publish directory: `frontend/build`
5. Set environment variable: `REACT_APP_API_URL=https://your-render-url.onrender.com/api`

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add all environment variables from `.env.example`

### URLs Format

- GitHub: `https://github.com/<username>/password-reset`
- Render:  `https://password-reset.onrender.com`
- Netlify: `https://password-reset.netlify.app`

---

## 🛡️ Security Notes

- Passwords hashed with **bcrypt** (12 salt rounds)
- Reset tokens are **cryptographically random** (crypto.randomBytes)
- Tokens are **single-use** — cleared after successful reset
- Tokens **expire** after 1 hour (configurable)
- Rate limiting prevents brute-force and email flooding
- CORS restricted to frontend origin only

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Bootstrap 5 |
| Fonts | Outfit (headings), DM Sans (body) |
| Icons | Font Awesome 6 |
| HTTP Client | Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Email | Nodemailer |
| Auth | bcryptjs, crypto |
| Rate Limiting | express-rate-limit |

---

## 📄 License

MIT — free to use and modify.
