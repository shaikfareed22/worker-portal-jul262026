# COREIN Worker Portal v2.0

Production-ready React dashboard with API backend, JWT auth, dual-input anti-idle tracking, full admin panel, and task execution workflow.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | Node.js (raw `http.createServer`) |
| Auth | Cookie-based pseudo-token, bcryptjs password hashing |
| Icons | Lucide React |
| Build | Vite (production build served by Node.js) |
| Database | In-memory (resets on server restart) |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   CLIENT (React)                │
│                                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Dashboard │  │TaskExec   │  │ Admin Portal │ │
│  │ MyTasks   │  │(Worker    │  │ Create Task  │ │
│  │ Active    │  │ FullPage) │  │ Review Subs  │ │
│  │ Completed │  │           │  │ Time Overview│ │
│  └──────────┘  └───────────┘  └──────────────┘ │
│        │              │              │           │
│  ┌─────┴──────────────┴──────────────┴───────┐  │
│  │           useTimeTracker (Hook)            │  │
│  │  - Dual-input detection (kbd + mouse)     │  │
│  │  - 8s idle cutoff                         │  │
│  │  - Heartbeat to server every 5s           │  │
│  └───────────────────┬───────────────────────┘  │
│                      │                          │
│  ┌───────────────────┴───────────────────────┐  │
│  │              api.js (Fetch)               │  │
│  │  - credentials: include (cookie auth)     │  │
│  │  - All REST endpoints                     │  │
│  └───────────────────┬───────────────────────┘  │
└──────────────────────┼──────────────────────────┘
                       │ HTTP
┌──────────────────────┼──────────────────────────┐
│                SERVER (Node.js)                  │
│                      │                          │
│  ┌───────────────────┴───────────────────────┐  │
│  │          http.createServer()              │  │
│  │  - Cookie parsing                         │  │
│  │  - JSON body parsing                      │  │
│  │  - CORS handling                          │  │
│  │  - Static file serving (dist/)            │  │
│  └───────────────────┬───────────────────────┘  │
│                      │                          │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Auth     │ │ Tasks    │ │ Time Tracking  │  │
│  │ /login   │ │ GET/POST │ │ /heartbeat     │  │
│  │ /register│ │ /start   │ │ /breakdown     │  │
│  │ /logout  │ │ /submit  │ │                │  │
│  │ /me      │ │ /review  │ │                │  │
│  └──────────┘ └──────────┘ └────────────────┘  │
│                      │                          │
│  ┌───────────────────┴───────────────────────┐  │
│  │           In-Memory Data Store            │  │
│  │  - USERS_DB (seeded users)                │  │
│  │  - tasks[] (all tasks)                    │  │
│  │  - timeStore{} (heartbeat tracking)       │  │
│  │  - auditLog[] (audit trail)               │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## How It Works

### Authentication Flow
1. User enters email/password on login page
2. Server validates credentials with bcryptjs
3. Server generates token (`tok_{userId}_{timestamp}`) and sets HttpOnly cookie
4. Client stores user data in localStorage for session persistence
5. All API requests include `credentials: 'include'` to send cookie
6. Server extracts userId from token cookie on every request

### Task Lifecycle
```
Not Started → (Worker clicks "Start") → In Progress → (Worker submits) → Submitted → (Admin approves) → Completed
                                                  ↘ (Admin rejects) → In Progress
```

1. **Admin creates task** via Admin Portal form (title, project, type, priority, rate, assign to worker)
2. **Worker sees task** in Dashboard/My Tasks (tasks assigned to them + unassigned tasks)
3. **Worker clicks "View Task"** → navigates to full Task Execution page
4. **Worker clicks "Start Task"** → server records `startedAt` timestamp, status → "In Progress"
5. **Client-side timer runs silently** (no UI shown to worker) — tracks active vs idle seconds
6. **Worker enters deliverable** (code/text) and clicks "Submit Task"
7. **Server calculates** `timeSpent = now - startedAt` and `idleTime = timeSpent - activeSecondsLogged`
8. **Admin reviews** in Admin Portal — sees Active, Idle, Total, Efficiency%, Earnings

### Time Tracking (Dual-Input Anti-Idle)

The timer uses **dual-input validation** to prevent idle time from being counted as work:

| Input | What's Tracked |
|-------|---------------|
| Keyboard | `keydown`, `keyup` events |
| Mouse | `mousemove`, `mousedown`, `click`, `scroll`, `wheel`, `touchstart` |

**Rules:**
- A second counts as **Active** only when BOTH keyboard AND mouse have activity within the last 8 seconds
- If either input is idle for >8 seconds, that second counts as **Idle**
- Tab switching auto-pauses the timer (via `visibilitychange` event)
- Client sends heartbeat to server every 5 seconds for server-side tracking

**What each role sees:**

| Metric | Worker | Admin |
|--------|--------|-------|
| Active Time | ✅ (after submission) | ✅ (always) |
| Idle Time | ❌ Hidden | ✅ Shown |
| Total Time | ❌ Hidden | ✅ Shown |
| Efficiency % | ❌ Hidden | ✅ Shown with color bar |
| Earnings | ✅ (Dashboard stat) | ✅ (per-task) |

### API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/login` | No | Any | Login, returns token + cookie |
| POST | `/api/auth/register` | No | Any | Register new worker |
| POST | `/api/auth/logout` | No | Any | Clear token cookie |
| GET | `/api/auth/me` | Cookie | Any | Get current user profile |
| GET | `/api/tasks` | Cookie | Filtered | List tasks (admin=all, worker=assigned+unassigned) |
| POST | `/api/tasks` | Cookie | Admin | Create new task |
| DELETE | `/api/tasks/:id` | Cookie | Admin | Delete task |
| PUT | `/api/tasks/:id/status` | Cookie | Owner | Update task status |
| POST | `/api/tasks/:id/start` | Cookie | Worker | Start task (records startedAt) |
| POST | `/api/tasks/:id/submit` | Cookie | Owner | Submit task with deliverables + time |
| POST | `/api/tasks/:id/review` | Cookie | Admin | Approve or reject submission |
| POST | `/api/time/heartbeat` | Cookie | Any | Send tracking heartbeat |
| GET | `/api/time/breakdown` | Cookie | Any | Get time breakdown per task |
| GET | `/api/workers` | Cookie | Admin | List all workers |
| GET | `/api/audit` | Cookie | Admin | Get audit log |
| GET | `/api/earnings` | Cookie | Any | Get user's rate |

---

## Seeded Users

| Role | Email | Password | Name |
|------|-------|----------|------|
| Admin | `admin@corein.com` | `admin123` | Admin User |
| Worker | `arjun@corein.com` | `worker123` | Arjun Patel |
| Worker | `priya@corein.com` | `worker123` | Priya Sharma |

---

## Project Structure

```
worker-portal-jul262026/
├── server.js                    # Main Node.js server (all API routes)
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite configuration
├── index.html                   # HTML entry point
├── .env                         # Environment variables
├── server/
│   ├── data/
│   │   ├── tasks.js             # Task data (unused, alternative)
│   │   └── users.js             # User data (unused, alternative)
│   ├── middleware/
│   │   └── auth.js              # JWT middleware (unused, alternative)
│   └── routes/
│       ├── auth.js              # Auth routes (unused, alternative)
│       ├── tasks.js             # Task routes (unused, alternative)
│       ├── time.js              # Time routes (unused, alternative)
│       └── workers.js           # Worker routes (unused, alternative)
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Root component (routing, state, auth)
│   ├── index.css                # Tailwind CSS imports
│   ├── config/
│   │   └── constants.js         # API URLs, task types, rates, keys
│   ├── hooks/
│   │   ├── useAuth.js           # Authentication hook
│   │   ├── useDarkMode.js       # Dark mode toggle
│   │   ├── useNotification.js   # Toast notifications
│   │   ├── useTaskManager.js    # Task CRUD operations
│   │   └── useTimeTracker.js    # Dual-input time tracking
│   ├── utils/
│   │   ├── api.js               # Fetch wrapper for all API calls
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
│   │   │   ├── TaskDetail.jsx   # Admin task detail modal
│   │   │   ├── TaskExecution.jsx # Worker task execution page
│   │   │   └── TaskSubmitModal.jsx # Task submission modal
│   │   ├── tracker/
│   │   │   ├── AntiIdleGuard.jsx # Anti-idle status panel (admin only)
│   │   │   └── TrackerBanner.jsx # Active tracking banner (admin only)
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
│       ├── AdminPortal.jsx      # Admin: create tasks, review, time overview
│       ├── Workers.jsx          # Admin: worker list
│       ├── AuditLog.jsx         # Admin: audit trail
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

## How to Test

### Step 1: Start the Server
```bash
cd worker-portal-jul262026
npm install
npm start
```
Server runs at **http://localhost:4000**

### Step 2: Test Admin Workflow
1. Open http://localhost:4000 in your browser
2. Login as `admin@corein.com` / `admin123`
3. Go to **Admin Portal** in the sidebar
4. Create a task:
   - Title: "Test Timer Task"
   - Project: "QA Testing"
   - Assign To: Select a worker from dropdown
   - Click **Create Task**
5. Go to **Dashboard** → verify the task appears
6. Go to **Admin Portal** → **All Tasks — Time Overview** → verify the new task is listed

### Step 3: Test Worker Workflow
1. Logout (click logout icon in sidebar)
2. Login as `arjun@corein.com` / `worker123`
3. Go to **Dashboard** → find the task created by admin
4. Click **"View Task"** → full execution page opens
5. Click **"Start Task"** → status changes to "In Progress"
6. **Test the timer:**
   - Type on keyboard + move mouse → "Active Time" counter increases
   - Stop moving mouse for 8+ seconds → counter pauses
   - Move mouse again → counter resumes
   - Switch browser tabs → auto-pauses
7. Type something in the **Deliverable** text area
8. Click **"Submit Task"**
9. You should see **"Your Active Time: XX:XX:XX"** displayed
10. Task status changes to "Submitted"

### Step 4: Test Admin Review
1. Logout, login as `admin@corein.com` / `admin123`
2. Go to **Admin Portal**
3. **Submitted — Review** section shows the submitted task with:
   - Green box = Active Time
   - Red box = Idle Time
   - Gray box = Total Time
   - Efficiency bar with percentage
4. Click **Approve** or **Reject**
5. Go to **Dashboard** → click the task title → modal shows Logged Time + Total Time Spent

### Step 5: Verify via API (Optional)
```powershell
# Login as worker
$body = '{"email":"arjun@corein.com","password":"worker123"}'
$resp = Invoke-WebRequest -Uri http://localhost:4000/api/auth/login -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -SessionVariable ws

# Check tasks
Invoke-WebRequest -Uri http://localhost:4000/api/tasks -UseBasicParsing -WebSession $ws | Select-Object -ExpandProperty Content

# Start a task
Invoke-WebRequest -Uri http://localhost:4000/api/tasks/PY-001/start -Method POST -UseBasicParsing -WebSession $ws | Select-Object -ExpandProperty Content
```

---

## Bug Fixes Included

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Worker can't see admin tasks | TaskCreateForm had no worker selector; filter was broken | Added worker dropdown + fixed server filter |
| View Task opens modal only | No task execution page existed | Created TaskExecution.jsx full-page component |
| Time tracker UI visible to workers | TrackerBanner/AntiIdleGuard shown to all | Hidden from workers, shown only to admin |
| Admin can't see time breakdown | No active/idle/total time display | Added time overview table with efficiency |
| Delete button on wrong role | `!isAdmin` check was inverted | Fixed to `isAdmin` |
| No start task endpoint | Missing server-side start tracking | Added POST /api/tasks/:id/start |
| No idle time calculation | Server only stored active time | Added idleTime = timeSpent - activeSecondsLogged |

---

## License

Private — COREIN Internal Use Only
