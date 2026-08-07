# Supabase Free Tier — Complete Guide

> Everything you need to know to stay on Supabase free tier forever.

---

## Free Tier Limits

| Feature | Free Tier Limit | What Happens When Exceeded |
|---------|----------------|---------------------------|
| **Database** | 1 GB | Inserts fail, reads still work |
| **Storage** | 1 GB (files) | Uploads fail, existing files readable |
| **Bandwidth** | 2 GB/month | Requests get throttled |
| **Auth** | 50,000 MAUs | Auth stops working |
| **Edge Functions** | 500K invocations/month | Functions fail |
| **Realtime** | 200 concurrent connections | New connections rejected |
| **Projects** | 2 active projects | Must pause/delete one to create new |

---

## Screenshot Storage Math

### Current Settings
- Scale: 0.5 (half resolution)
- Quality: 0.6 (60% PNG)
- Interval: Every 60 seconds
- Format: PNG

### Estimated Sizes

| Screen | Per Screenshot | 1 Task (10 min) | 1 Task (30 min) | 100 Tasks (10 min each) |
|--------|---------------|-----------------|-----------------|------------------------|
| 1080p | ~80 KB | ~80 MB (80 screenshots) | ~240 MB | ~8 GB |
| 1440p | ~120 KB | ~120 MB | ~360 MB | ~12 GB |
| 4K | ~200 KB | ~200 MB | ~600 MB | ~20 GB |

### How Many Screenshots Before Storage Full?

| Screen Resolution | 1 GB Storage | % of Free Tier |
|-------------------|-------------|----------------|
| 1080p (~80 KB each) | ~12,500 screenshots | 100% |
| 1440p (~120 KB each) | ~8,300 screenshots | 100% |
| 4K (~200 KB each) | ~5,000 screenshots | 100% |

**Bottom line:** At 1080p, you get ~12,500 screenshots before storage fills.

---

## How to Free Up Storage

### Option 1: Delete Old Task Screenshots (Recommended)

Go to **Supabase Dashboard → Storage → task-files** and delete folders for completed/archived tasks.

Or run this SQL to delete screenshots for a specific task:

```sql
-- Delete screenshots metadata from database
DELETE FROM screenshots WHERE task_id = 'TASK_ID_HERE';

-- Then manually delete the folder in Storage UI
-- Dashboard → Storage → task-files → {taskId} → Delete folder
```

### Option 2: Delete All Screenshots (Nuclear Option)

```sql
-- Clear all screenshot metadata
TRUNCATE TABLE screenshots;

-- Then delete everything in Storage UI
-- Dashboard → Storage → task-files → Select All → Delete
```

### Option 3: Auto-Cleanup with SQL Function

Create a function that auto-deletes screenshots older than N days:

```sql
CREATE OR REPLACE FUNCTION cleanup_old_screenshots(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM screenshots
  WHERE captured_at < NOW() - (days_old || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Run it manually or via cron
SELECT cleanup_old_screenshots(30);  -- Delete screenshots older than 30 days
```

### Option 4: Reduce Screenshot Size

In `useTimeTracker.js`, reduce quality/scale:

```javascript
// Current: 0.5 scale, 0.6 quality
const canvas = await html2canvas(el, {
  scale: 0.3,        // Lower = smaller file
  backgroundColor: '#ffffff',
});

canvas.toBlob(async (blob) => {
  await api.captureScreenshot(activeTaskId, blob);
}, 'image/png', 0.4);  // Lower = smaller file
```

| Setting | File Size | Quality |
|---------|-----------|---------|
| scale: 0.5, quality: 0.6 | ~80 KB | Good |
| scale: 0.3, quality: 0.4 | ~30 KB | Acceptable |
| scale: 0.2, quality: 0.3 | ~15 KB | Poor |

---

## All Free Tier Limits — Detailed

### 1. Database (PostgreSQL)

| Item | Limit | Notes |
|------|-------|-------|
| Storage | 1 GB | Across all tables |
| Rows | Unlimited | But limited by storage size |
| Connections | 60 concurrent | Connection pooling available |
| Branching | 1 preview branch | For schema changes |

**How to check usage:**
```sql
SELECT
  pg_size_pretty(pg_database_size(current_database())) as db_size;
```

**How to stay under:**
- Use `TEXT` instead of `VARCHAR` (same storage, more flexible)
- Don't store large files in database (use Storage)
- Archive old data regularly

### 2. Storage

| Item | Limit | Notes |
|------|-------|-------|
| Storage | 1 GB | Total file size |
| File Size | 50 MB per file | Single file limit |
| Bandwidth | 2 GB/month | Download/upload combined |

**How to check usage:**
```sql
-- Database metadata size
SELECT
  pg_size_pretty(
    SUM(OCTET_LENGTH(storage_path))::BIGINT
  ) as screenshots_metadata_size
FROM screenshots;
```

In Storage Dashboard: Go to **Storage → Analytics** to see actual file usage.

**How to stay under:**
- Compress images before upload
- Delete old files regularly
- Use thumbnails for previews

### 3. Auth

| Item | Limit | Notes |
|------|-------|-------|
| Monthly Active Users | 50,000 | Users who log in per month |
| SMS (Third-party) | Unlimited | You bring your own provider |
| Social Logins | Unlimited | Google, GitHub, etc. |
| Magic Links | Unlimited | Email-based passwordless |

**How to check usage:**
Dashboard → Authentication → Users → Check active count.

**How to stay under:**
- Don't create test accounts repeatedly
- Clean up unused accounts
- Use soft-delete (mark inactive, don't delete)

### 4. Edge Functions

| Item | Limit | Notes |
|------|-------|-------|
| Invocations | 500,000/month | Function calls |
| CPU Time | 10 seconds per invocation | Per single call |
| Memory | 256 MB per invocation | Per single call |
| Free Credit | $5/month | Covers ~500K invocations |

**How to check usage:**
Dashboard → Edge Functions → Logs → Check invocation count.

### 5. Realtime

| Item | Limit | Notes |
|------|-------|-------|
| Concurrent Connections | 200 | WebSocket connections |
| Messages | Unlimited | But bandwidth counts |
| Postgres Changes | Included | Listen to table changes |

**How to check usage:**
Dashboard → Database → Replication → Check active connections.

### 6. Bandwidth

| Item | Limit | Notes |
|------|-------|-------|
| Total Bandwidth | 2 GB/month | All requests combined |
| CDN | Included | For storage files |
| API Requests | Unlimited | But count toward bandwidth |

**How to check usage:**
Dashboard → Settings → Usage → Check bandwidth graph.

---

## How to Stay on Free Tier Forever

### Daily Habits
1. **Delete test data** after testing
2. **Clean up old screenshots** weekly
3. **Check storage usage** monthly

### Weekly Habits
1. Run cleanup function: `SELECT cleanup_old_screenshots(7);`
2. Delete old task submissions if not needed
3. Review auth users for inactive accounts

### Monthly Habits
1. Check all usage metrics in Dashboard
2. Archive old data to external backup
3. Review if you need to upgrade

### Architecture Tips
1. **Don't store files in database** — use Storage
2. **Compress images** before upload
3. **Use lazy loading** — don't fetch all data at once
4. **Implement pagination** — limit query results
5. **Cache frequently accessed data** — reduce DB queries
6. **Use Edge Functions** for heavy processing — keep DB light

---

## Quick Reference: Usage Commands

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Count rows in each table
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check screenshots count
SELECT COUNT(*) as total_screenshots FROM screenshots;

-- Check screenshots storage estimate
SELECT
  COUNT(*) as total,
  pg_size_pretty(SUM(LENGTH(storage_path))::BIGINT) as metadata_size
FROM screenshots;

-- Find largest tables
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

---

## Emergency: If You Hit Limits

### Storage Full
1. Delete oldest screenshots: `DELETE FROM screenshots WHERE captured_at < NOW() - INTERVAL '7 days';`
2. Delete corresponding files in Storage UI
3. Restart your app

### Database Full
1. Run `VACUUM FULL;` to reclaim space
2. Delete old audit logs: `DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '30 days';`
3. Archive old tasks to external backup

### Bandwidth Exceeded
1. Implement client-side caching
2. Reduce API call frequency
3. Use CDN for static assets

---

## Cost Comparison: Free vs Pro

| Feature | Free | Pro ($25/month) |
|---------|------|-----------------|
| Database | 1 GB | 8 GB |
| Storage | 1 GB | 100 GB |
| Bandwidth | 2 GB | 250 GB |
| Auth MAUs | 50,000 | 100,000 |
| Edge Functions | 500K | 2M |
| Realtime | 200 connections | 500 connections |
| Projects | 2 | Unlimited |
| Support | Community | Email |

---

## Summary

- **Screenshots:** ~12,500 at 1080p before 1GB fills
- **To free space:** Delete old task folders in Storage
- **To stay free:** Clean up weekly, compress images, archive old data
- **Key limit:** 1GB Storage is the tightest constraint for screenshots
- **Solution:** Auto-cleanup function + lower quality settings = stay free forever
