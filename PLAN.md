# COREIN Worker Portal — Development Plan

## Current Status: v3.0.0 (Firebase-powered)

**Stack:** React 19 · Vite 8 · Tailwind CSS 4 · Firebase (Auth + Firestore + Storage)

---

## Phase 1 — Security Hardening ✅ DONE

| Task | Status |
|------|--------|
| Remove hardcoded demo credentials | ✅ |
| Add Firestore security rules | ✅ |
| Add server-side role checks (requireAdmin) | ✅ |
| Wire up XSS sanitization (sanitizeInput) | ✅ |
| Wire up input validation (validateTaskInput) | ✅ |
| Add file upload validation (10MB, allowed types) | ✅ |
| Lock dev server to localhost | ✅ |
| Targeted localStorage cleanup | ✅ |
| Remove dead binary/commit files | ✅ |

## Phase 2 — Bug Fixes ✅ DONE

| Task | Status |
|------|--------|
| Fix Dashboard crash risk (safeTasks) | ✅ |
| Add try/catch to all async handlers | ✅ |
| Fix notification timer memory leak | ✅ |
| Fix register race condition | ✅ |
| Add task status guards (start/submit) | ✅ |
| Fix startTask double write + null ref | ✅ |
| Fix confirmDlg state reset | ✅ |
| Fix render-time setState (unauthorized redirect) | ✅ |
| Replace native prompt() with modal | ✅ |
| Add TimeTracker to sidebar navigation | ✅ |

## Phase 3 — Production Polish ✅ DONE

| Task | Status |
|------|--------|
| Fix dark mode (dark class on html) | ✅ |
| Add loading spinner during auth | ✅ |
| Add unauthorized redirect for non-admins | ✅ |
| Error styling in Notification component | ✅ |
| TaskSubmitModal dark mode + validation | ✅ |
| ConfirmDialog dark mode + null guard | ✅ |
| Fix version mismatch (v3.0.0) | ✅ |
| Remove stale proxy config | ✅ |
| Delete dead code (3 components) | ✅ |
| Fix time tracker unnecessary re-renders | ✅ |

---

## Phase 4 — Features (NEXT)

| Task | Priority | Effort |
|------|----------|--------|
| Add React Router (URL-based navigation) | High | Medium |
| Code splitting (React.lazy per page) | High | Low |
| Support ticket persistence (Firestore) | Medium | Low |
| Admin task editing | Medium | Medium |
| User profile editing | Medium | Low |
| Password reset flow | Medium | Low |
| Real-time notifications from Firestore | Medium | Medium |
| Pagination for task lists + audit log | Medium | Medium |
| Search/filter on more pages | Medium | Low |
| Worker management (rate/role editing) | Low | Medium |
| Invoice PDF generation | Low | Medium |
| Accessibility (ARIA, keyboard nav) | Low | High |

## Phase 5 — Scale & Deploy

| Task | Priority | Effort |
|------|----------|--------|
| Firebase Hosting deployment | High | Low |
| Cloud Functions for server-side logic | Medium | High |
| Email notifications (Cloud Functions) | Medium | Medium |
| Data export / GDPR compliance | Low | Medium |
| Analytics dashboard (Firestore aggregations) | Low | High |
| Multi-project / team support | Low | High |

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1 — Security | 1 day | ✅ Done |
| Phase 2 — Bug Fixes | 1 day | ✅ Done |
| Phase 3 — Production Polish | 1 day | ✅ Done |
| Phase 4 — Features | 2-3 weeks | 🔜 Next |
| Phase 5 — Scale & Deploy | 2-4 weeks | 📋 Planned |

---

## Tech Debt Remaining

1. **Code splitting** — 669KB single bundle, should lazy-load pages
2. **React Router** — no URL-based navigation, no deep linking
3. **Pagination** — all lists load entire collection
4. **Accessibility** — no ARIA labels, no keyboard nav in modals
5. **Testing** — no unit tests, no integration tests
6. **CI/CD** — no automated build/deploy pipeline
