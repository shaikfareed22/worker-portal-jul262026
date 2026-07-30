# COREIN Worker Portal v3.0

Production-ready React dashboard powered by **Firebase** — no server required.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | **None** — client talks directly to Firebase |
| Auth | Firebase Authentication (Email/Password) |
| Database | Cloud Firestore (real-time onSnapshot) |
| Storage | Firebase Storage (file uploads) |
| Icons | Lucide React |
| Hosting | Cloudflare Pages / Vite preview |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                 CLIENT (React SPA)                   │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Dashboard │  │ TaskExec  │  │  Admin Portal    │  │
│  │ MyTasks   │  │ (Worker   │  │  Create Task     │  │
│  │ Active    │  │  FullPage)│  │  Review Subs     │  │
│  │ Completed │  │           │  │  Time Overview   │  │
│  └──────────┘  └───────────┘  └──────────────────┘  │
│        │              │               │               │
│  ┌─────┴──────────────┴───────────────┴──────────┐   │
│  │           useTimeTracker (Hook)               │   │
│  │  - Dual-input detection (kbd + mouse)         │   │
│  │  - 8s idle cutoff                             │   │
│  │  - Heartbeats to Firestore every 5s           │   │
│  └───────────────────┬───────────────────────────┘   │
│                      │                               │
│  ┌───────────────────┴───────────────────────────┐   │
│  │              api.js (Firestore SDK)           │   │
│  │  - Real-time onSnapshot subscriptions         │   │
│  │  - Offline persistence via IndexedDB          │   │
│  └───────────────────┬───────────────────────────┘   │
└──────────────────────┼───────────────────────────────┘
                       │ Firebase SDK
          ┌────────────┼────────────────┐
          │            │                │
   ┌──────┴──────┐ ┌──┴───────────┐ ┌──┴──────────┐
   │ Firebase Auth│ │  Firestore  │ │   Firebase  │
   │  (signIn,   │ │  (tasks,    │ │   Storage   │
   │  signOut,   │ │  users,     │ │  (file      │
   │  onAuth     │ │  timeLogs,  │ │   uploads)  │
   │  State)     │ │  auditLogs) │ │             │
   └─────────────┘ └──────────────┘ └─────────────┘
```

---

## How It Works

### Authentication Flow
1. User enters email/password on login page
2. `signInWithEmailAndPassword()` from Firebase Auth SDK
3. `onAuthStateChanged` listener fires with user object
4. Client reads `users/{uid}` from Firestore to get role + profile
5. All Firestore queries are scoped by the authenticated user

### Task Lifecycle
```
Not Started → (Worker clicks "Start") → In Progress → (Worker submits) → Submitted → (Admin approves) → Completed
                                                  ↘ (Admin rejects) → In Progress
```

1. **Admin creates task** via Admin Portal form → written to Firestore `tasks` collection
2. **Worker sees task** in real-time via `onSnapshot` — no polling needed
3. **Worker clicks "View Task"** → navigates to full Task Execution page
4. **Worker clicks "Start Task"** → Firestore records `startedAt` timestamp
5. **Client-side timer runs silently** — tracks active vs idle seconds
6. **Worker enters deliverable** and clicks "Submit Task"
7. **Server calculates** `timeSpent = now - startedAt` and `idleTime = timeSpent - activeSecondsLogged`
8. **Admin reviews** — sees Active, Idle, Total, Efficiency%, Earnings

### Time Tracking (Dual-Input Anti-Idle)

| Input | What's Tracked |
|-------|---------------|
| Keyboard | `keydown`, `keyup` events |
| Mouse | `mousemove`, `mousedown`, `click`, `scroll`, `wheel`, `touchstart` |

**Rules:**
- A second counts as **Active** only when BOTH keyboard AND mouse have activity within the last 8 seconds
- If either input is idle for >8 seconds, that second counts as **Idle**
- Tab switching auto-pauses the timer (via `visibilitychange` event)
- Client writes heartbeat to Firestore every 5 seconds

**What each role sees:**

| Metric | Worker | Admin |
|--------|--------|-------|
| Active Time | ✅ (after submission) | ✅ (always) |
| Idle Time | ❌ Hidden | ✅ Shown |
| Total Time | ❌ Hidden | ✅ Shown |
| Efficiency % | ❌ Hidden | ✅ Shown with color bar |
| Earnings | ✅ (Dashboard stat) | ✅ (per-task) |

---

## Firebase Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles with role (`admin`/`worker`), email, name |
| `tasks` | All tasks with status, assignedTo, submission, time data |
| `timeLogs` | Heartbeat tracking logs (active/idle per second) |
| `auditLogs` | Admin action audit trail |

---

## Setup & Configuration

### 1. Firebase Console Setup
1. Create project `corein-portal` at https://console.firebase.google.com
2. Enable **Authentication** → Email/Password
3. Create **Firestore Database** (test mode, closest region)
4. Enable **Storage** (test mode)
5. Register web app → copy config

### 2. Environment Variables
Create `.env` in project root:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=corein-portal.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=corein-portal
VITE_FIREBASE_STORAGE_BUCKET=corein-portal.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    match /timeLogs/{logId} {
      allow read, write: if request.auth != null;
    }
    match /auditLogs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Composite Index
Create index on `tasks` collection: `assignedTo` ASC + `createdAt` DESC

### 5. Install & Run
```bash
npm install
npm run dev        # Development server at http://localhost:5173
npm run build      # Production build to dist/
npm run preview    # Preview production build
```

---

## How to Test

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Create Admin User
1. Register via the app with any email (e.g. `admin@corein.com` / `admin123`)
2. Go to **Firestore Console** → `users` collection → find the new doc
3. Click **Edit** → change `role` from `"worker"` to `"admin"` → Save

### Step 3: Test Admin Workflow
1. Login as admin
2. Go to **Admin Portal** → Create a task (assign to a worker)
3. Go to **Dashboard** → verify the task appears
4. Go to **Admin Portal** → **All Tasks — Time Overview** → verify new task listed

### Step 4: Test Worker Workflow
1. Logout → Login as the worker you assigned the task to
2. Go to **Dashboard** → find the task
3. Click **"View Task"** → full execution page opens
4. Click **"Start Task"** → timer starts silently
5. Type on keyboard + move mouse → "Active Time" counter increases
6. Enter deliverable → Click **"Submit Task"**
7. See **"Your Active Time: XX:XX:XX"** displayed

### Step 5: Test Admin Review
1. Logout → Login as admin
2. Go to **Admin Portal** → **Submitted — Review** shows:
   - Green box = Active Time
   - Red box = Idle Time
   - Gray box = Total Time
   - Efficiency bar with percentage
3. Click **Approve** or **Reject**

---

## Project Structure

```
worker-portal-jul262026/
├── package.json                 # Dependencies (firebase, react, lucide-react)
├── vite.config.js               # Vite configuration
├── index.html                   # HTML entry point
├── .env                         # Firebase config (gitignored)
├── .gitignore                   # Git ignore rules
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Root component (routing, auth, state)
│   ├── index.css                # Tailwind CSS imports
│   ├── firebase.js              # Firebase config, auth, db, storage exports
│   ├── config/
│   │   └── constants.js         # Task types, rates, keys
│   ├── hooks/
│   │   ├── useAuth.js           # Firebase Auth (onAuthStateChanged)
│   │   ├── useDarkMode.js       # Dark mode toggle
│   │   ├── useNotification.js   # Toast notifications
│   │   ├── useTaskManager.js    # Firestore real-time task subscriptions
│   │   └── useTimeTracker.js    # Dual-input time tracking + Firestore heartbeats
│   ├── utils/
│   │   ├── api.js               # All Firestore operations (CRUD, subscriptions)
│   │   ├── formatters.js        # Time/date/earnings formatters
│   │   ├── sanitize.js          # Input sanitization
│   │   ├── storage.js           # LocalStorage helpers
│   │   └── validators.js        # Form validators
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx    # Login form
│   │   │   └── RegisterPage.jsx # Registration form
│   │   ├── layout/
│   │   │   ├── Header.jsx       # Top header bar
│   │   │   ├── Layout.jsx       # Main layout wrapper
│   │   │   └── Sidebar.jsx      # Navigation sidebar
│   │   ├── tasks/
│   │   │   ├── TaskCard.jsx     # Task list item
│   │   │   ├── TaskCreateForm.jsx # Admin task creation form
│   │   │   ├── TaskExecution.jsx  # Worker task execution page
│   │   │   └── TaskSubmitModal.jsx # Task submission modal
│   │   ├── tracker/
│   │   │   ├── AntiIdleGuard.jsx   # Anti-idle status panel (admin only)
│   │   │   └── TrackerBanner.jsx   # Active tracking banner (admin only)
│   │   ├── shared/
│   │   │   ├── SearchBar.jsx    # Search input
│   │   │   └── StatCard.jsx     # Dashboard stat card
│   │   └── ui/
│   │       ├── ConfirmDialog.jsx # Confirmation dialog
│   │       ├── ErrorBoundary.jsx # React error boundary
│   │       └── Notification.jsx  # Toast notification
│   └── pages/
│       ├── Dashboard.jsx        # Main dashboard with task center
│       ├── MyTasks.jsx          # All tasks list
│       ├── ActiveTasks.jsx      # In-progress tasks
│       ├── CompletedTasks.jsx   # Completed tasks
│       ├── AdminPortal.jsx      # Admin: create, review, time overview
│       ├── Workers.jsx          # Admin: worker list (real-time)
│       ├── AuditLog.jsx         # Admin: audit trail (real-time)
│       ├── TimeTracker.jsx      # Time breakdown table
│       ├── Earnings.jsx         # Earnings summary
│       ├── Payouts.jsx          # Payout history
│       ├── Invoices.jsx         # Invoice list
│       ├── Profile.jsx          # User profile
│       ├── Support.jsx          # Support form
│       └── Settings.jsx         # Settings (theme, clear data)
└── dist/                        # Production build output
```

---

## Removed in v3.0

The following were removed during the Firebase migration:
- `server.js` — Node.js backend (replaced by Firebase SDK)
- `server/` directory — Express routes, middleware, in-memory data store
- `bcryptjs` — password hashing (handled by Firebase Auth)
- `jsonwebtoken` — JWT tokens (handled by Firebase Auth)
- `cloudflared.exe` — binary committed to repo (now gitignored)

---

## License

Private — COREIN Internal Use Only
