  -- ============================================
  -- COREIN WORKER PORTAL - SUPABASE SCHEMA
  -- Run this ENTIRE file in Supabase SQL Editor
  -- ============================================

  -- Cleanup first (safe even if nothing exists)
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
  DROP FUNCTION IF EXISTS calculate_active_seconds(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) CASCADE;
  DROP POLICY IF EXISTS "users_own_read" ON users;
  DROP POLICY IF EXISTS "users_own_update" ON users;
  DROP POLICY IF EXISTS "users_admin_all" ON users;
  DROP POLICY IF EXISTS "tasks_worker_read" ON tasks;
  DROP POLICY IF EXISTS "tasks_worker_update" ON tasks;
  DROP POLICY IF EXISTS "tasks_admin_all" ON tasks;
  DROP POLICY IF EXISTS "timer_events_own_read" ON timer_events;
  DROP POLICY IF EXISTS "timer_events_own_insert" ON timer_events;
  DROP POLICY IF EXISTS "timer_events_admin_all" ON timer_events;
  DROP POLICY IF EXISTS "screenshots_own_read" ON screenshots;
  DROP POLICY IF EXISTS "screenshots_own_insert" ON screenshots;
  DROP POLICY IF EXISTS "screenshots_admin_all" ON screenshots;
  DROP POLICY IF EXISTS "timer_summaries_own" ON timer_summaries;
  DROP POLICY IF EXISTS "timer_summaries_admin" ON timer_summaries;
  DROP POLICY IF EXISTS "submissions_own_read" ON submissions;
  DROP POLICY IF EXISTS "submissions_own_insert" ON submissions;
  DROP POLICY IF EXISTS "submissions_admin_all" ON submissions;
  DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
  DROP POLICY IF EXISTS "audit_log_admin_read" ON audit_log;
  DROP POLICY IF EXISTS "payments_own_read" ON payments;
  DROP POLICY IF EXISTS "payments_admin_all" ON payments;
  DROP TABLE IF EXISTS payments CASCADE;
  DROP TABLE IF EXISTS audit_log CASCADE;
  DROP TABLE IF EXISTS submissions CASCADE;
  DROP TABLE IF EXISTS timer_summaries CASCADE;
  DROP TABLE IF EXISTS screenshots CASCADE;
  DROP TABLE IF EXISTS timer_events CASCADE;
  DROP TABLE IF EXISTS tasks CASCADE;
  DROP TABLE IF EXISTS users CASCADE;

  -- 1. USERS TABLE
  CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
    avatar TEXT DEFAULT 'U',
    hourly_rate DECIMAL(10,2) DEFAULT 25.00,
    skills TEXT[] DEFAULT '{}',
    device_fingerprint TEXT,
    face_photo_url TEXT,
    joined_at DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
  );

  -- 2. TASKS TABLE
  CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT DEFAULT 'CODE',
    title TEXT NOT NULL,
    project TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'not_started' CHECK (status IN (
      'not_started', 'in_progress', 'submitted', 'reviewed', 'completed'
    )),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    hourly_rate TEXT DEFAULT '$25/hr',
    rate_num DECIMAL(10,2) DEFAULT 25.00,
    due_date TEXT DEFAULT '',
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    started_at TIMESTAMPTZ,
    logged_time TEXT DEFAULT '0h 00m',
    active_seconds_logged INTEGER DEFAULT 0,
    idle_time INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    submitted_code TEXT DEFAULT '',
    submitted_notes TEXT DEFAULT '',
    submitted_at TIMESTAMPTZ,
    submitted_files TEXT[] DEFAULT '{}',
    review_status TEXT DEFAULT '',
    review_comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 3. TIMER EVENTS TABLE
  CREATE TABLE timer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    task_id UUID REFERENCES tasks(id) NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
      'start', 'stop', 'pause', 'resume',
      'keyboard', 'mouse', 'screenshot',
      'idle_detected', 'tab_blur', 'tab_focus'
    )),
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 4. SCREENSHOTS TABLE
  CREATE TABLE screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    task_id UUID REFERENCES tasks(id) NOT NULL,
    storage_path TEXT NOT NULL,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed BOOLEAN DEFAULT false,
    review_result TEXT CHECK (review_result IN ('approved', 'flagged', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ
  );

  -- 5. TIMER SUMMARIES
  CREATE TABLE timer_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    task_id UUID REFERENCES tasks(id) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ,
    active_seconds INTEGER DEFAULT 0,
    idle_seconds INTEGER DEFAULT 0,
    total_elapsed_seconds INTEGER DEFAULT 0,
    keystroke_count INTEGER DEFAULT 0,
    mouse_event_count INTEGER DEFAULT 0,
    screenshot_count INTEGER DEFAULT 0,
    is_anomaly BOOLEAN DEFAULT false,
    anomaly_reasons TEXT[] DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, task_id, period_start)
  );

  -- 6. SUBMISSIONS TABLE
  CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    task_id UUID REFERENCES tasks(id) NOT NULL,
    deliverable_code TEXT NOT NULL,
    deliverable_hash TEXT NOT NULL,
    notes TEXT DEFAULT '',
    files TEXT[] DEFAULT '{}',
    active_seconds_logged INTEGER NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, task_id)
  );

  -- 7. AUDIT LOG
  CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    message TEXT DEFAULT '',
    entity_type TEXT,
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 8. PAYMENTS TABLE
  CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    period_week TEXT NOT NULL,
    total_hours DECIMAL(10,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'accrued' CHECK (status IN (
      'accrued', 'approved', 'processing', 'paid', 'disputed'
    )),
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- INDEXES
  CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, status);
  CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
  CREATE INDEX idx_timer_events_user_task ON timer_events(user_id, task_id, created_at);
  CREATE INDEX idx_timer_events_server_ts ON timer_events(server_timestamp);
  CREATE INDEX idx_screenshots_user ON screenshots(user_id, captured_at);
  CREATE INDEX idx_submissions_hash ON submissions(deliverable_hash);
  CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at);
  CREATE INDEX idx_audit_log_action ON audit_log(action, created_at);
  CREATE INDEX idx_payments_user_week ON payments(user_id, period_week);

  -- ROW-LEVEL SECURITY
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE timer_events ENABLE ROW LEVEL SECURITY;
  ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
  ALTER TABLE timer_summaries ENABLE ROW LEVEL SECURITY;
  ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "users_own_read" ON users FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "users_own_update" ON users FOR UPDATE USING (auth.uid() = id);
  CREATE POLICY "users_own_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
  CREATE POLICY "users_admin_all" ON users FOR ALL USING (id = auth.uid());

  CREATE POLICY "tasks_worker_read" ON tasks FOR SELECT USING (
    assigned_to = auth.uid() OR created_by = auth.uid() OR assigned_to IS NULL
  );
  CREATE POLICY "tasks_worker_update" ON tasks FOR UPDATE USING (
    assigned_to = auth.uid() OR created_by = auth.uid() OR assigned_to IS NULL
  );
  CREATE POLICY "tasks_admin_all" ON tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

  CREATE POLICY "timer_events_own_read" ON timer_events FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "timer_events_own_insert" ON timer_events FOR INSERT WITH CHECK (user_id = auth.uid());
  CREATE POLICY "timer_events_admin_all" ON timer_events FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

  CREATE POLICY "screenshots_own_read" ON screenshots FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "screenshots_own_insert" ON screenshots FOR INSERT WITH CHECK (user_id = auth.uid());
  CREATE POLICY "screenshots_admin_all" ON screenshots FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

  CREATE POLICY "timer_summaries_own" ON timer_summaries FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "timer_summaries_admin" ON timer_summaries FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

  CREATE POLICY "submissions_own_read" ON submissions FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "submissions_own_insert" ON submissions FOR INSERT WITH CHECK (user_id = auth.uid());
  CREATE POLICY "submissions_admin_all" ON submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

  CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT WITH CHECK (true);
  CREATE POLICY "audit_log_admin_read" ON audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

  CREATE POLICY "payments_own_read" ON payments FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

  -- SERVER-SIDE TIMER CALCULATION FUNCTION
  CREATE OR REPLACE FUNCTION calculate_active_seconds(
    p_user_id UUID,
    p_task_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
  ) RETURNS INTEGER AS $$
    WITH events AS (
      SELECT server_timestamp,
            LEAD(server_timestamp) OVER (ORDER BY server_timestamp) AS next_ts
      FROM timer_events
      WHERE user_id = p_user_id
        AND task_id = p_task_id
        AND server_timestamp BETWEEN p_from AND p_to
        AND event_type NOT IN ('idle_detected', 'tab_blur', 'stop', 'pause')
    )
    SELECT COALESCE(SUM(
      EXTRACT(EPOCH FROM (next_ts - server_timestamp))::INTEGER
    ), 0)
    FROM events
    WHERE next_ts IS NOT NULL
  $$ LANGUAGE SQL STABLE;

  -- AUTO-CREATE USER PROFILE ON SIGNUP
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.users (id, email, full_name, role, avatar)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
      UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'U'), 1))
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

  -- ============================================
  -- AFTER CREATING ADMIN USER IN SUPABASE AUTH:
  -- ============================================
  -- UPDATE users SET role = 'admin' WHERE email = 'hello@corein.in';
