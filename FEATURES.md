# COREIN Worker Portal — Features

## Core Features

### 1. Authentication
| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password login | ✅ | Firebase Auth |
| Registration | ✅ | Auto-creates Firestore user doc |
| Session persistence | ✅ | onAuthStateChanged listener |
| Logout | ✅ | signOut + state clear |
| Role-based access | ✅ | Admin vs Worker views |
| Password reset | ❌ | Not implemented |
| Email verification | ❌ | Not implemented |

### 2. Task Management
| Feature | Status | Notes |
|---------|--------|-------|
| Create task (admin) | ✅ | With title, project, type, priority, rate, assignee |
| View tasks | ✅ | Real-time via onSnapshot |
| Start task (worker) | ✅ | Records startedAt timestamp |
| Submit task (worker) | ✅ | Code, notes, files, time logged |
| Review task (admin) | ✅ | Approve/Reject with reason |
| Delete task (admin) | ✅ | With confirmation dialog |
| Task filtering | ✅ | Active/In Progress/Submitted/Completed tabs |
| Task search | ✅ | Dashboard search bar |
| Task editing | ❌ | Admin cannot edit existing tasks |
| Task assignment | ✅ | Admin assigns to specific worker |
| Unassigned tasks | ✅ | Workers see unassigned tasks |

### 3. Time Tracking
| Feature | Status | Notes |
|---------|--------|-------|
| Dual-input detection | ✅ | Keyboard + Mouse both required |
| 8-second idle cutoff | ✅ | Configurable via constants |
| Active time counter | ✅ | Client-side per-second tracking |
| Total elapsed counter | ✅ | Client-side per-second tracking |
| Tab visibility pause | ✅ | Pauses on tab switch |
| Heartbeat to Firestore | ✅ | Every 5 seconds |
| Server-side time calc | ✅ | idleTime = timeSpent - activeSeconds |
| Time breakdown page | ✅ | Per-task active/elapsed/efficiency |

### 4. Admin Features
| Feature | Status | Notes |
|---------|--------|-------|
| Create tasks | ✅ | Full form with worker dropdown |
| Review submissions | ✅ | Approve/Reject with reason modal |
| Time overview table | ✅ | Active/Idle/Total/Eff%/Earnings per task |
| Worker list | ✅ | Real-time Firestore subscription |
| Audit log | ✅ | Real-time audit trail |
| Delete tasks | ✅ | With confirmation |
| Task editing | ❌ | Cannot modify existing tasks |
| Worker management | ❌ | Cannot edit rates/roles |
| Dashboard stats | ✅ | Active tasks, input time, earnings |

### 5. Worker Features
| Feature | Status | Notes |
|---------|--------|-------|
| View assigned tasks | ✅ | Real-time subscription |
| View unassigned tasks | ✅ | Tasks not assigned to anyone |
| Start/submit tasks | ✅ | Full execution flow |
| View active time | ✅ | After submission |
| Earnings summary | ✅ | Per-task and total |
| Task execution page | ✅ | Full-page with code editor |
| File upload | ✅ | With validation (10MB, allowed types) |
| Profile view | ✅ | Read-only |
| Profile editing | ❌ | Not implemented |

### 6. Earnings & Payments
| Feature | Status | Notes |
|---------|--------|-------|
| Earnings calculation | ✅ | activeSeconds × hourly rate |
| Earnings history | ✅ | Per-task breakdown |
| Payout tracking | ✅ | Shows completed tasks as paid |
| Invoice display | ✅ | Basic list (no PDF) |
| PDF generation | ❌ | Not implemented |
| Payment processing | ❌ | Display only |

### 7. UI/UX
| Feature | Status | Notes |
|---------|--------|-------|
| Dark mode | ✅ | Tailwind dark: classes + html class |
| Responsive design | ✅ | Mobile sidebar, responsive grids |
| Loading states | ✅ | Auth loading spinner |
| Error notifications | ✅ | Red for errors, green for success |
| Confirmation dialogs | ✅ | For delete actions |
| Search | ✅ | Dashboard task search |
| Task status badges | ✅ | Color-coded status pills |
| Empty states | ✅ | "No tasks found" messages |
| Unauthorized redirect | ✅ | Non-admins redirected to Dashboard |
| Accessibility | ❌ | No ARIA labels, no keyboard nav |

### 8. Security
| Feature | Status | Notes |
|---------|--------|-------|
| Firestore security rules | ✅ | Role-based access control |
| XSS sanitization | ✅ | All user input sanitized |
| Input validation | ✅ | Task creation validated |
| File upload validation | ✅ | Size + type checking |
| Admin-only guards | ✅ | requireAdmin() in api.js |
| Client-side role check | ✅ | Before admin operations |
| Server-side role check | ✅ | Firestore rules enforce |
| Rate limiting | ❌ | Not implemented |

---

## Page Inventory

| Page | Functional | Backend | Dark Mode | Notes |
|------|-----------|---------|-----------|-------|
| Dashboard | ✅ | ✅ | ✅ | Full stats + task list |
| My Tasks | ✅ | ✅ | ✅ | All tasks with actions |
| Active Tasks | ✅ | ✅ | ✅ | In-progress filter |
| Completed Tasks | ✅ | ✅ | ✅ | Read-only list |
| Admin Portal | ✅ | ✅ | ✅ | Create + Review + Time table |
| Workers | ✅ | ✅ | ✅ | Real-time worker list |
| Audit Log | ✅ | ✅ | ✅ | Real-time audit trail |
| Time Tracker | ✅ | ✅ | ✅ | Per-task breakdown |
| Earnings | ✅ | ✅ | ✅ | Summary + history |
| Payouts | ✅ | ✅ | ✅ | Completed task payouts |
| Invoices | ⚠️ | ✅ | ✅ | Display only, no download |
| Profile | ⚠️ | ✅ | ✅ | Read-only, no editing |
| Support | ⚠️ | ❌ | ✅ | Form only, no persistence |
| Settings | ✅ | — | ✅ | Dark mode + cache clear |

---

## API Operations

| Operation | Method | Auth | Role | Firestore Collection |
|-----------|--------|------|------|---------------------|
| Login | signInWithEmailAndPassword | Public | Any | — |
| Register | createUserWithEmailAndPassword | Public | Any | users |
| Create task | addDoc | Required | Admin | tasks |
| Get tasks | onSnapshot | Required | Filtered | tasks |
| Start task | updateDoc | Required | Owner | tasks |
| Submit task | updateDoc | Required | Owner | tasks |
| Review task | updateDoc | Required | Admin | tasks |
| Delete task | deleteDoc | Required | Admin | tasks |
| Send heartbeat | addDoc | Required | Self | timeLogs |
| Get workers | onSnapshot | Required | Any | users |
| Get audit log | onSnapshot | Required | Any | auditLogs |
| Upload file | uploadBytes | Required | Any | Storage |

---

## Constants

| Constant | Value | Used In |
|----------|-------|---------|
| DUAL_IDLE_CUTOFF_MS | 8000 | Time tracker idle detection |
| HEARTBEAT_INTERVAL_MS | 5000 | Heartbeat frequency |
| MAX_FILE_SIZE_MB | 10 | File upload limit |
| ALLOWED_FILE_TYPES | .py,.js,.ts,.jsx,.tsx,.txt,.md,.pdf,.zip,.json,.html,.css,.csv | File validation |
| TASK_TYPES | CODE, TEXT, DATA, DESIGN | Task creation |
| PRIORITIES | High, Medium, Low | Task creation |
| RATES | $15-$35/hr | Task creation |
