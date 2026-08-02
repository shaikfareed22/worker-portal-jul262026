# COREIN Worker Portal — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React SPA)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                    App.jsx                          │ │
│  │  - Auth state (useAuth)                             │ │
│  │  - Task state (useTaskManager)                      │ │
│  │  - Time tracking (useTimeTracker)                   │ │
│  │  - Dark mode (useDarkMode)                          │ │
│  │  - Notifications (useNotification)                  │ │
│  │  - Navigation (state-based, not router)             │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │                                    │
│  ┌──────────────────┴──────────────────────────────────┐ │
│  │                    Pages                            │ │
│  │  Dashboard · MyTasks · ActiveTasks · CompletedTasks │ │
│  │  AdminPortal · Workers · AuditLog                   │ │
│  │  TimeTracker · Earnings · Payouts · Invoices        │ │
│  │  Profile · Support · Settings                       │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │                                    │ │
│  ┌──────────────────┴──────────────────────────────────┐ │
│  │                   api.js                            │ │
│  │  - All Firestore operations (CRUD)                  │ │
│  │  - Real-time subscriptions (onSnapshot)             │ │
│  │  - Firebase Auth operations                         │ │
│  │  - Firebase Storage uploads                         │ │
│  │  - Input sanitization (sanitize.js)                 │ │
│  │  - Input validation (validators.js)                 │ │
│  │  - Role-based access (requireAdmin)                 │ │
│  └──────────────────┬──────────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────┘
                      │ Firebase SDK (HTTPS)
          ┌───────────┼───────────────┐
          │           │               │
   ┌──────┴──────┐ ┌──┴──────────┐ ┌──┴──────────┐
   │Firebase Auth│ │  Firestore  │ │   Firebase  │
   │             │ │  (realtime) │ │   Storage   │
   │ - signIn    │ │             │ │             │
   │ - signUp    │ │ - tasks     │ │ - uploads   │
   │ - signOut   │ │ - users     │ │             │
   │ - onAuth    │ │ - timeLogs  │ │             │
   │   State     │ │ - auditLogs │ │             │
   └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Data Model

### Firestore Collections

```
users/{uid}
  ├── name: string
  ├── email: string
  ├── role: "admin" | "worker"
  ├── avatar: string (first letter)
  ├── rate: number (hourly rate)
  └── joinedAt: string (ISO date)

tasks/{taskId}
  ├── type: "CODE" | "TEXT" | "DATA" | "DESIGN"
  ├── title: string
  ├── project: string
  ├── status: "Not Started" | "In Progress" | "Submitted" | "Completed"
  ├── category: string (mirrors status)
  ├── priority: "High" | "Medium" | "Low"
  ├── rate: string ("$25/hr")
  ├── rateNum: number (25)
  ├── dueDate: string
  ├── description: string
  ├── assignedTo: string | null (user uid)
  ├── createdBy: string (admin uid)
  ├── createdAt: Timestamp
  ├── startedAt: Timestamp | null
  ├── loggedTime: string ("2h 30m")
  ├── activeSecondsLogged: number
  ├── idleTime: number
  ├── timeSpent: number (seconds)
  ├── submittedCode: string
  ├── submittedNotes: string
  ├── submittedAt: Timestamp | null
  ├── submittedFiles: string[]
  ├── reviewStatus: "Approved" | "Rejected" | ""
  └── reviewComment: string

timeLogs/{logId}
  ├── userId: string
  ├── taskId: string
  ├── clientTimestamp: number
  ├── inputHash: string
  └── timestamp: Timestamp

auditLogs/{logId}
  ├── action: string
  ├── message: string
  ├── userId: string
  └── timestamp: Timestamp
```

---

## Component Architecture

```
App.jsx
├── ErrorBoundary
├── Layout
│   ├── Sidebar (nav, user info, logout)
│   ├── Header (search, notifications, dark mode toggle)
│   └── {children} ← Page components
├── TaskExecution (worker full-page view)
├── TaskSubmitModal (submission dialog)
├── ConfirmDialog (delete confirmation)
└── Notification (toast messages)

Pages:
├── Dashboard.jsx       → StatCard + TaskCard list + search/filter
├── MyTasks.jsx         → TaskCard list with status badges
├── ActiveTasks.jsx     → In-progress tasks with submit button
├── CompletedTasks.jsx  → Read-only completed list
├── AdminPortal.jsx     → TaskCreateForm + review section + time table
├── Workers.jsx         → Real-time worker list
├── AuditLog.jsx        → Real-time audit trail
├── TimeTracker.jsx     → Per-task time breakdown
├── Earnings.jsx        → Earnings summary + history
├── Payouts.jsx         → Completed task payouts
├── Invoices.jsx        → Invoice display
├── Profile.jsx         → User info + stats
├── Support.jsx         → Support form (placeholder)
└── Settings.jsx        → Dark mode + cache clear
```

---

## Authentication Flow

```
1. User enters email/password
2. api.login() → Firebase signInWithEmailAndPassword()
3. Firebase Auth returns user object (uid, email)
4. api.login() reads users/{uid} from Firestore for role
5. useAuth hook sets user state with role info
6. App renders appropriate UI based on isAdmin/isWorker
7. onAuthStateChanged listener persists session across refreshes
```

---

## Task Lifecycle

```
Admin creates task
  → Firestore: tasks/{id} created with status="Not Started"
  → Real-time: onSnapshot fires, worker sees task immediately

Worker clicks "Start Task"
  → Firestore: startedAt=now, status="In Progress"
  → Client: useTimeTracker starts dual-input tracking

Worker works (keyboard + mouse tracked)
  → Client: activeSeconds increment only when BOTH inputs active
  → Client: heartbeat sent to Firestore every 5 seconds

Worker clicks "Submit"
  → Firestore: submittedCode, submittedAt, activeSecondsLogged, timeSpent, idleTime
  → Firestore: status="Submitted"

Admin reviews
  → If Approved: status="Completed"
  → If Rejected: status="In Progress" (worker re-does task)
```

---

## Time Tracking System

### Dual-Input Anti-Idle

```
Every 1 second:
  1. Check if keyboard activity within last 8 seconds
  2. Check if mouse activity within last 8 seconds
  3. BOTH active → count as "Active" second
  4. EITHER idle → count as "Idle" second
  5. Tab hidden → auto-pause (visibilitychange event)

Events tracked:
  Keyboard: keydown, keyup
  Mouse: mousemove, mousedown, click, scroll, wheel, touchstart
```

### What Each Role Sees

| Metric | Worker | Admin |
|--------|--------|-------|
| Active Time | ✅ (after submit) | ✅ (always) |
| Idle Time | ❌ | ✅ |
| Total Time | ❌ | ✅ |
| Efficiency % | ❌ | ✅ (color-coded) |
| Earnings | ✅ (summary) | ✅ (per-task) |

---

## Security Model

### Client-Side Guards
- `requireAdmin()` in api.js checks Firestore user role before admin operations
- `sanitizeInput()` on all user text (XSS prevention)
- `validateTaskInput()` on task creation
- `validateFileUpload()` on file uploads (10MB limit, allowed types)

### Firestore Rules
- **users:** Read any, write self, admin delete all
- **tasks:** Read any, create admin-only, update any, delete admin-only
- **timeLogs:** Read any, create self-only, no edit/delete
- **auditLogs:** Read any, create any, no edit/delete

---

## File Structure

```
worker-portal-jul262026/
├── firestore.rules              # Firestore security rules
├── package.json                 # Dependencies
├── vite.config.js               # Build config
├── .env                         # Firebase config (gitignored)
├── src/
│   ├── firebase.js              # Firebase init + exports
│   ├── App.jsx                  # Root component
│   ├── config/constants.js      # App constants
│   ├── hooks/
│   │   ├── useAuth.js           # Firebase Auth
│   │   ├── useTaskManager.js    # Firestore task subscriptions
│   │   ├── useTimeTracker.js    # Dual-input time tracking
│   │   ├── useDarkMode.js       # Theme persistence
│   │   └── useNotification.js   # Toast notifications
│   ├── utils/
│   │   ├── api.js               # All Firestore operations
│   │   ├── formatters.js        # Time/date/earnings formatters
│   │   ├── sanitize.js          # XSS sanitization
│   │   ├── storage.js           # LocalStorage helpers
│   │   └── validators.js        # Input validation
│   ├── components/
│   │   ├── auth/                # LoginPage, RegisterPage
│   │   ├── layout/              # Sidebar, Header, Layout
│   │   ├── tasks/               # TaskCard, TaskCreateForm, TaskExecution, TaskSubmitModal
│   │   └── ui/                  # ConfirmDialog, ErrorBoundary, Notification
│   └── pages/                   # 15 page components
└── dist/                        # Production build
```
