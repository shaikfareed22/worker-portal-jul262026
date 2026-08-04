# COREIN Worker Portal v3.0 — Complete Project Guide

> Production-ready React dashboard with Supabase backend, anti-fraud timer, and real-time task management.

---

## 1. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 | SPA with hot reload |
| Backend | Supabase (PostgreSQL + Auth + Storage) | Database, auth, file uploads |
| Auth | Supabase Auth (Email/Password) | User registration, login, sessions |
| Database | PostgreSQL (via Supabase) | ACID transactions, RLS, JOINs |
| Real-Time | Supabase Realtime (WebSocket) | Live task/worker/audit updates |
| Storage | Supabase Storage | File uploads, screenshot captures |
| Hosting | Cloudflare Pages | Auto-deploy on git push |
| Icons | Lucide React | UI icons |
| Screenshots | html2canvas | Periodic worker screen capture |

---

## 2. Project Structure

```
worker-portal-jul262026/
├── .env                          # Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
├── package.json                  # Dependencies
├── vite.config.js                # Vite build config
├── index.html                    # HTML entry
├── supabase-schema.sql           # Full PostgreSQL schema (tables, RLS, functions, triggers)
├── IMPORTANT-COREIN.md           # This file
├── src/
│   ├── main.jsx                  # React entry
│   ├── App.jsx                   # Root: routing, auth, state, task locking
│   ├── index.css                 # Tailwind imports
│   ├── supabase.js               # Supabase client initialization
│   ├── firebase.js               # Legacy backup (NOT imported anywhere)
│   ├── config/
│   │   └── constants.js          # Idle threshold, keyboard density, jiggle PX values
│   ├── hooks/
│   │   ├── useAuth.js            # Supabase auth (onAuthStateChange, auto-create user row)
│   │   ├── useDarkMode.js        # Dark mode toggle (dark class on <html>)
│   │   ├── useNotification.js    # Toast notifications
│   │   ├── useTaskManager.js     # Supabase real-time task subscriptions
│   │   └── useTimeTracker.js     # Dual-input timer + heartbeat + screenshot capture
│   ├── utils/
│   │   ├── api.js                # ALL Supabase operations (CRUD, subscriptions, timer RPC)
│   │   ├── formatters.js         # formatShortTime, formatDateTime, formatSecondsToTime
│   │   ├── sanitize.js           # XSS prevention (sanitizeInput, sanitizePlain)
│   │   └── validators.js         # validateEmail, validatePassword, validateTaskInput, validateFileUpload
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx     # Login form with validation
│   │   │   └── RegisterPage.jsx  # Registration form with validation
│   │   ├── layout/
│   │   │   ├── Header.jsx        # Top bar
│   │   │   ├── Layout.jsx        # Sidebar + content wrapper
│   │   │   └── Sidebar.jsx       # Navigation (role-based menu)
│   │   ├── tasks/
│   │   │   ├── TaskCard.jsx      # Task card (locked state for one-task-at-a-time)
│   │   │   ├── TaskCreateForm.jsx # Admin task creation
│   │   │   ├── TaskExecution.jsx # Worker task page (copy/paste blocked, deliverable persistence)
│   │   │   └── TaskSubmitModal.jsx # Submission modal (copy/paste blocked)
│   │   ├── tracker/
│   │   │   ├── AntiIdleGuard.jsx  # Anti-idle status panel
│   │   │   └── TrackerBanner.jsx  # Active tracking banner
│   │   ├── shared/
│   │   │   ├── SearchBar.jsx
│   │   │   └── StatCard.jsx
│   │   └── ui/
│   │       ├── ConfirmDialog.jsx
│   │       ├── ErrorBoundary.jsx
│   │       └── Notification.jsx
│   └── pages/
│       ├── Dashboard.jsx         # Worker dashboard with task center
│       ├── MyTasks.jsx           # Task list with lock icons
│       ├── ActiveTasks.jsx       # In-progress tasks
│       ├── CompletedTasks.jsx    # Completed tasks
│       ├── AdminPortal.jsx       # Admin: create, review, time overview
│       ├── Workers.jsx           # Admin: worker list
│       ├── AuditLog.jsx          # Admin: audit trail
│       ├── TimeTracker.jsx       # Time breakdown table
│       ├── Earnings.jsx          # Earnings summary
│       ├── Payouts.jsx           # Payout history
│       ├── Invoices.jsx          # Invoice list
│       ├── Profile.jsx           # User profile
│       ├── Support.jsx           # Support form
│       └── Settings.jsx          # Settings
```

---

## 3. Supabase Database Schema

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User profiles | id (FK auth.users), email, full_name, role (admin/worker), hourly_rate |
| `tasks` | All tasks | id, title, project, status, assigned_to, started_at, active_seconds_logged, submitted_code |
| `timer_events` | Server-side time tracking events | user_id, task_id, event_type, client_timestamp, server_timestamp |
| `screenshots` | Periodic screen captures | user_id, task_id, storage_path, captured_at |
| `timer_summaries` | Calculated time summaries | user_id, task_id, active_seconds, idle_seconds |
| `submissions` | Task submissions with hash | user_id, task_id, deliverable_code, deliverable_hash |
| `audit_log` | Append-only action log | user_id, action, entity_type, entity_id, user_agent |
| `payments` | Payment tracking | user_id, period_week, total_hours, net_amount, status |

### Timer Event Types
```
start, stop, pause, resume    — lifecycle events
keyboard, mouse               — input activity (sent every 5s heartbeat)
screenshot                    — periodic capture marker
idle_detected                 — no input for 10+ seconds
tab_blur, tab_focus           — tab visibility changes
```

### Row-Level Security (RLS) Policies

| Table | Policy | Rule |
|-------|--------|------|
| users | users_own_read | `auth.uid() = id` (read own profile) |
| users | users_own_update | `auth.uid() = id` (update own profile) |
| users | users_own_insert | `auth.uid() = id` (create own profile) |
| users | users_admin_all | `(auth.jwt() ->> 'role') = 'admin'` (admin full access) |
| tasks | tasks_worker_read | assigned_to = auth.uid() OR created_by OR unassigned |
| tasks | tasks_worker_update | assigned_to = auth.uid() OR created_by |
| tasks | tasks_admin_all | admin role |
| timer_events | own_read/insert + admin_all | Worker sees own, admin sees all |
| screenshots | own_read/insert + admin_all | Worker sees own, admin sees all |
| submissions | own_read/insert + admin_all | Worker sees own, admin sees all |
| audit_log | insert (any) + admin_read | Anyone can insert, only admin reads |
| payments | own_read + admin_all | Worker sees own, admin manages all |

### Server-Side Functions

**`calculate_active_seconds(p_user_id, p_task_id, p_from, p_to)`**
- Uses CTE with `LEAD()` window function to compute active time from `timer_events`
- Excludes `idle_detected`, `tab_blur`, `stop`, `pause` events
- Called via `supabase.rpc()` during task submission
- Prevents client-side time manipulation

**`handle_new_user()` (Trigger)**
- Fires `AFTER INSERT ON auth.users`
- Auto-creates `public.users` row with role from metadata
- Runs as `SECURITY DEFINER` (bypasses RLS)

---

## 4. Anti-Fraud System (Mercor-Level)

### Time Tracking Algorithm

```
Every 1 second:
  1. Check keyboard activity (keydown within 10s)
  2. Check mouse activity (mousemove/click >= 5px within 10s)
  3. Check keyboard density (keydown within 30s)
  4. Active = (keyboard OR mouse) AND (keyboard within 30s)
  5. Tab hidden → pause everything
```

### Anti-Cheat Features

| Feature | How It Works | Implementation |
|---------|-------------|----------------|
| Dual-input detection | Both keyboard AND mouse must be active | `useTimeTracker.js` |
| Mouse jiggle filter | Movement < 5px ignored (Euclidean distance) | `useTimeTracker.js:109-113` |
| Keyboard density | Must type within 30s to stay active | `useTimeTracker.js:165` |
| Tab blur pause | `visibilitychange` + `window.blur` pauses timer | `useTimeTracker.js:138-145` |
| Tab blur logging | Tab switches saved to `timer_events` table | `useTimeTracker.js:131-137` |
| Heartbeat to Supabase | Events sent every 5s with event type | `api.sendHeartbeat()` |
| Screenshot capture | html2canvas every 60s, uploaded to storage | `useTimeTracker.js:221-238` |
| Server-side timer | `calculate_active_seconds()` RPC on submit | `api.submitTask()` |
| One-task-at-a-time | Server checks DB for existing in-progress task | `api.startTask()` |
| Copy/paste blocked | onPaste, onCut, onCopy, Ctrl+C/V/X blocked | `TaskExecution.jsx`, `TaskSubmitModal.jsx` |
| Deliverable persistence | localStorage save/restore per taskId | `TaskExecution.jsx:5-21` |
| XSS sanitization | All user inputs sanitized before DB write | `sanitize.js` via `api.js` |
| Input validation | Email, password, task input, file upload | `validators.js` |
| Audit trail | All actions logged with entity_type/id/user_agent | `api.addAudit()` |

### What Each Role Sees

| Metric | Worker | Admin |
|--------|--------|-------|
| Active Time | After submission only | Always (real-time) |
| Idle Time | Hidden | Shown |
| Total Time | Hidden | Shown |
| Efficiency % | Hidden | Shown with color bar |
| Earnings | Dashboard stat | Per-task breakdown |
| Screenshots | Hidden | Viewable in admin |
| Audit Log | Hidden | Full access |

---

## 5. Task Lifecycle

```
Admin creates task
       │
       ▼
  Not Started ◄──── Admin rejects ────┐
       │                              │
       │ Worker clicks "Start"        │
       ▼                              │
  In Progress ──── Worker submits ──► Submitted
                                         │
                                         │ Admin reviews
                                    ┌────┴────┐
                                    ▼         ▼
                              Completed   In Progress
                                          (rejected)
```

### One-Task-at-a-Time Enforcement
1. **Client-side:** `activeTaskId` state in App.jsx, TaskCard shows "Locked" badge
2. **Server-side:** `api.startTask()` queries for existing `in_progress` tasks before allowing start
3. **UI:** TaskExecution shows "Task Locked" screen, MyTasks shows lock icon

---

## 6. Environment Setup

### Prerequisites
- Node.js 18+
- Supabase account (https://supabase.com)

### Step 1: Create Supabase Project
1. Go to https://supabase.com → New Project
2. Note the **Project URL** and **anon public key** from Settings → API

### Step 2: Run Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase-schema.sql` from this project
3. Copy the **entire file** and paste into SQL Editor
4. Click Run — should create all 8 tables, indexes, RLS policies, functions, triggers

### Step 3: Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `task-files`
4. Set to **Public**

### Step 4: Create Admin User
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `hello@corein.in`
4. Set a password
5. Run in SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'hello@corein.in';
```

### Step 5: Configure Environment
Create `.env` in project root:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_full_anon_key_here
```

### Step 6: Install & Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build to dist/
```

### Step 7: Deploy to Cloudflare Pages
```bash
git add -A
git commit -m "Your message"
git push origin main
```
Auto-deploys to: `https://worker-portal-jul262026.shaikfareed2203.workers.dev/`

---

## 7. API Reference (api.js)

### Authentication
| Method | Description |
|--------|-------------|
| `api.login(email, password)` | Sign in + fetch user profile + audit log |
| `api.register(name, email, password)` | Sign up + create user row + audit log |
| `api.logout()` | Sign out + audit log |
| `api.me()` | Get current authenticated user |

### Tasks
| Method | Description |
|--------|-------------|
| `api.getTasks()` | Get tasks (workers: assigned/unassigned, admin: all) |
| `api.createTask(taskData)` | Admin creates task |
| `api.startTask(id)` | Worker starts task (server checks one-task lock) |
| `api.submitTask(id, submission)` | Worker submits (server calculates active time) |
| `api.reviewTask(id, review)` | Admin approves/rejects |
| `api.deleteTask(id)` | Admin deletes task |
| `api.updateTaskStatus(id, status)` | Admin updates status |

### Timer & Screenshots
| Method | Description |
|--------|-------------|
| `api.sendHeartbeat(taskId, ts, hash, eventType)` | Send timer event to Supabase |
| `api.logTimerEvent(taskId, eventType)` | Log tab_blur/tab_focus/idle events |
| `api.captureScreenshot(taskId, canvasBlob)` | Upload screenshot + save metadata |
| `api.getTimeBreakdown(taskId)` | Get server-calculated active seconds |

### Real-Time Subscriptions
| Method | Description |
|--------|-------------|
| `api.subscribeToTasks(userId, admin, callback)` | Live task updates |
| `api.subscribeToWorkers(callback)` | Live worker list updates |
| `api.subscribeToAuditLog(callback)` | Live audit log updates |

---

## 8. Key Files Explained

### `src/supabase.js`
Creates the Supabase client with auth config (autoRefreshToken, persistSession, detectSessionInUrl).

### `src/hooks/useTimeTracker.js`
The core anti-fraud timer:
- Tracks keyboard, mouse, and combined activity
- 10s idle threshold, 30s keyboard density, 5px jiggle filter
- Sends heartbeats to Supabase every 5s with event type
- Captures screenshots via html2canvas every 60s
- Logs tab_blur/tab_focus events to Supabase
- Persists state to localStorage for page refresh survival

### `src/utils/api.js`
All Supabase operations:
- CRUD for tasks, workers, audit log
- Server-side timer calculation via `supabase.rpc('calculate_active_seconds')`
- Screenshot upload to Supabase Storage
- Real-time WebSocket subscriptions
- Input sanitization before all writes

### `src/App.jsx`
Root component:
- Auth routing (login/register → dashboard)
- `activeTaskId` state for one-task-at-a-time enforcement
- Timer state management (activeSeconds, totalElapsed)
- Task start/submit/review handlers

### `supabase-schema.sql`
Complete PostgreSQL schema:
- 8 tables with foreign keys and constraints
- 9 performance indexes
- 16 RLS policies (zero loophole security)
- `calculate_active_seconds()` function (CTE + window functions)
- `handle_new_user()` trigger (auto-create profile on signup)

---

## 9. Cost Analysis

| Resource | Free Tier Limit | At 1000 Users |
|----------|----------------|---------------|
| Database | 500 MB | ~50 MB (50KB/user) |
| Auth Users | 50,000 | 1,000 |
| Storage | 1 GB | ~200 MB (screenshots + files) |
| Edge Functions | 500K invocations | ~100K |
| Realtime | 200 concurrent | ~100 |
| **Monthly Cost** | **$0** | **$0** |

---

## 10. Deployment

| Step | Command/Action |
|------|---------------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Git push (auto-deploy) | `git add -A && git commit -m "msg" && git push` |
| Deploy URL | https://worker-portal-jul262026.shaikfareed2203.workers.dev/ |

---

## 11. Known Limitations & Future Work

### Not Yet Implemented
- **Face verification** — webcam + ML face detection (schema column `face_photo_url` exists)
- **Event timing bot detection** — analyze keystroke intervals for inhuman patterns
- **Admin activity heatmap** — visualize worker activity over time
- **Payment automation** — auto-calculate weekly payouts from time data

### Architecture Decisions
- **Supabase over Firebase:** PostgreSQL RLS for server-side timer (can't be bypassed), SQL JOINs, linear cost, no vendor lock-in
- **Client-side timer + server verification:** Client tracks for UX, server calculates on submit for anti-fraud
- **html2canvas for screenshots:** Lightweight, no server-side rendering needed, 0.5x scale keeps files small
- **Single `task-files` bucket:** Simpler than per-task buckets, RLS handles access control

---

Private — COREIN Internal Use Only
