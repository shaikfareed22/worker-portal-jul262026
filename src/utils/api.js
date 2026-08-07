import { supabase } from '../supabase';
import { sanitizeInput, sanitizePlain } from './sanitize';
import { validateTaskInput, validateFileUpload } from './validators';

function addAudit(action, message, userId, entityType, entityId) {
  supabase.from('audit_log').insert({
    action, message, user_id: userId,
    entity_type: entityType || null,
    entity_id: entityId || null,
    user_agent: navigator?.userAgent || '',
  }).then(() => {}).catch(() => {});
}

async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
  return data?.role === 'admin';
}

async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!data || data.role !== 'admin') throw new Error('Admin access required');
  return { uid: user.id, data };
}

function mapTask(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    project: row.project,
    description: row.description,
    status: row.status === 'not_started' ? 'Not Started'
      : row.status === 'in_progress' ? 'In Progress'
      : row.status === 'submitted' ? 'Submitted'
      : row.status === 'completed' ? 'Completed'
      : row.status,
    priority: row.priority === 'low' ? 'Low' : row.priority === 'medium' ? 'Medium' : 'High',
    rate: row.hourly_rate,
    rateNum: row.rate_num,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    startedAt: row.started_at,
    loggedTime: row.logged_time,
    activeSecondsLogged: row.active_seconds_logged,
    idleTime: row.idle_time,
    timeSpent: row.time_spent,
    submittedCode: row.submitted_code,
    submittedNotes: row.submitted_notes,
    submittedAt: row.submitted_at,
    submittedFiles: row.submitted_files,
    reviewStatus: row.review_status,
    reviewComment: row.review_comment,
  };
}

function mapStatusForDB(status) {
  const s = status?.toLowerCase();
  if (s === 'not started' || s === 'not_started') return 'not_started';
  if (s === 'in progress' || s === 'in_progress') return 'in_progress';
  if (s === 'submitted') return 'submitted';
  if (s === 'completed') return 'completed';
  return s || 'not_started';
}

export const api = {
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    let { data: userData } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (!userData) {
      const meta = data.user.user_metadata || {};
      const { data: inserted } = await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: meta.full_name || data.user.email.split('@')[0],
        role: meta.role || 'worker',
        avatar: (meta.full_name || 'U').charAt(0).toUpperCase(),
      }, { onConflict: 'id' }).select().single();
      userData = inserted;
    }
    if (!userData) {
      userData = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.email.split('@')[0],
        role: 'worker',
        avatar: 'U',
        hourly_rate: 25,
      };
    }
    addAudit('login', `${email} signed in`, data.user.id);
    return { user: { id: data.user.id, ...userData } };
  },

  register: async (name, email, password) => {
    const cleanName = sanitizePlain(name);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: cleanName, role: 'worker' } }
    });
    if (error) throw error;
    await new Promise(r => setTimeout(r, 1000));
    const { data: userData } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    addAudit('registered', `${email} registered as worker`, data.user.id);
    return { user: { id: data.user.id, ...(userData || { name: cleanName, email, role: 'worker' }) } };
  },

  logout: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) addAudit('logout', `${user.email} signed out`, user.id);
    await supabase.auth.signOut();
  },

  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    return { user: { id: user.id, ...data } };
  },

  getTasks: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { tasks: [] };
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    const admin = userData?.role === 'admin';
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (!admin) {
      query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
    }
    const { data } = await query;
    return { tasks: (data || []).map(mapTask) };
  },

  createTask: async (taskData) => {
    const { uid } = await requireAdmin();
    const errors = validateTaskInput(taskData);
    if (errors.length) throw new Error(errors[0]);
    const { data, error } = await supabase.from('tasks').insert({
      type: taskData.type || 'CODE',
      title: sanitizeInput(taskData.title),
      project: sanitizeInput(taskData.project),
      status: 'not_started',
      priority: (taskData.priority || 'medium').toLowerCase(),
      hourly_rate: taskData.rate || '$25/hr',
      rate_num: taskData.rateNum || 25,
      due_date: taskData.dueDate || '',
      description: sanitizeInput(taskData.description || ''),
      assigned_to: taskData.assignedTo || null,
      created_by: uid,
    }).select().single();
    if (error) throw error;
    addAudit('task_created', `Created: ${taskData.title}`, uid, 'task', data.id);
    return { task: mapTask(data) };
  },

  updateTaskStatus: async (id, status) => {
    const { uid } = await requireAdmin();
    const dbStatus = mapStatusForDB(status);
    const { data, error } = await supabase.from('tasks')
      .update({ status: dbStatus }).eq('id', id).select().single();
    if (error) throw error;
    addAudit('task_updated', `${data.title} → ${status}`, uid, 'task', id);
    return { task: mapTask(data) };
  },

  startTask: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data: existing } = await supabase.from('tasks')
      .select('id').eq('assigned_to', user.id).eq('status', 'in_progress');
    if (existing && existing.length > 0) throw new Error('You already have an active task. Submit it first.');
    const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (!task) throw new Error('Task not found');
    if (task.status !== 'not_started') throw new Error('Task cannot be started in its current status');
    const { data, error } = await supabase.from('tasks').update({
      started_at: task.started_at || new Date().toISOString(),
      status: 'in_progress',
    }).eq('id', id).select().single();
    if (error) throw error;
    addAudit('task_started', `Started: ${task.title}`, user.id, 'task', id);
    return { task: mapTask(data) };
  },

  submitTask: async (id, submission) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (!task) throw new Error('Task not found');
    if (task.status !== 'in_progress') throw new Error('Only in-progress tasks can be submitted');
    let timeSpent = 0;
    if (task.started_at) {
      timeSpent = Math.floor((Date.now() - new Date(task.started_at).getTime()) / 1000);
    }
    const { data: timerRows } = await supabase.rpc('calculate_active_seconds', {
      p_user_id: user.id,
      p_task_id: id,
      p_from: task.started_at,
      p_to: new Date().toISOString(),
    });
    const serverActiveSeconds = timerRows || 0;
    const clientActiveSeconds = submission.activeSecondsLogged || 0;
    const activeSeconds = serverActiveSeconds > 0 ? serverActiveSeconds : clientActiveSeconds;
    const { data, error } = await supabase.from('tasks').update({
      status: 'submitted',
      submitted_code: sanitizeInput(submission.submittedCode || ''),
      submitted_notes: sanitizeInput(submission.submittedNotes || ''),
      submitted_files: Array.isArray(submission.submittedFiles) ? submission.submittedFiles.slice(0, 20) : [],
      submitted_at: new Date().toISOString(),
      active_seconds_logged: activeSeconds,
      logged_time: submission.loggedTime || task.logged_time,
      time_spent: timeSpent,
      idle_time: Math.max(0, timeSpent - activeSeconds),
    }).eq('id', id).select().single();
    if (error) throw error;
    await supabase.from('submissions').upsert({
      user_id: user.id,
      task_id: id,
      deliverable_code: sanitizeInput(submission.submittedCode || ''),
      deliverable_hash: btoa((submission.submittedCode || '').slice(0, 100)),
      notes: sanitizeInput(submission.submittedNotes || ''),
      active_seconds_logged: activeSeconds,
    });
    addAudit('task_submitted', `Submitted: ${task.title} (server: ${serverActiveSeconds}s, client: ${clientActiveSeconds}s)`, user.id, 'task', id);
    return { task: mapTask(data) };
  },

  reviewTask: async (id, review) => {
    const { uid } = await requireAdmin();
    const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (!task) throw new Error('Task not found');
    if (task.status !== 'submitted') throw new Error('Only submitted tasks can be reviewed');
    const newStatus = review.status === 'Approved' ? 'completed' : 'in_progress';
    const { data, error } = await supabase.from('tasks').update({
      status: newStatus,
      review_status: review.status,
      review_comment: sanitizeInput(review.comment || ''),
    }).eq('id', id).select().single();
    if (error) throw error;
    addAudit('task_reviewed', `${task.title}: ${review.status}`, uid, 'task', id);
    return { task: mapTask(data) };
  },

  deleteTask: async (id) => {
    const { uid } = await requireAdmin();
    const { data: task } = await supabase.from('tasks').select('title').eq('id', id).single();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    addAudit('task_deleted', `Deleted: ${task?.title}`, uid, 'task', id);
  },

  getWorkers: async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'worker');
    return { workers: data || [] };
  },

  getAuditLog: async () => {
    const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
    return { auditLog: (data || []).map(l => ({ ...l, timestamp: l.created_at })) };
  },

  sendHeartbeat: async (taskId, clientTimestamp, inputHash, eventType = 'keyboard') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('timer_events').insert({
      user_id: user.id,
      task_id: taskId,
      event_type: eventType,
      client_timestamp: new Date(clientTimestamp).toISOString(),
      metadata: { inputHash }
    });
    return { activeSeconds: 0, totalElapsed: 0, serverTimestamp: Date.now() };
  },

  logTimerEvent: async (taskId, eventType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('timer_events').insert({
      user_id: user.id,
      task_id: taskId,
      event_type: eventType,
      client_timestamp: new Date().toISOString(),
      metadata: {}
    }).then(() => {}).catch(() => {});
  },

  getTimeBreakdown: async (taskId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { breakdown: {} };
    if (taskId) {
      const { data: task } = await supabase.from('tasks').select('started_at').eq('id', taskId).single();
      if (task?.started_at) {
        const { data } = await supabase.rpc('calculate_active_seconds', {
          p_user_id: user.id,
          p_task_id: taskId,
          p_from: task.started_at,
          p_to: new Date().toISOString(),
        });
        return { breakdown: { [taskId]: { activeSeconds: data || 0, totalElapsed: 0 } } };
      }
    }
    const { data } = await supabase.from('timer_events').select('task_id, event_type').eq('user_id', user.id);
    const breakdown = {};
    (data || []).forEach(e => {
      if (!breakdown[e.task_id]) breakdown[e.task_id] = { activeSeconds: 0, totalElapsed: 0 };
      breakdown[e.task_id].totalElapsed += 10;
    });
    return { breakdown };
  },

  getEarnings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { userId: '', rate: 25 };
    const { data } = await supabase.from('users').select('hourly_rate').eq('id', user.id).single();
    return { userId: user.id, rate: data?.hourly_rate || 25 };
  },

  uploadFile: async (file, taskId) => {
    const error = validateFileUpload(file);
    if (error) throw new Error(error);
    const fileName = `${taskId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('task-files').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('task-files').getPublicUrl(fileName);
    return data.publicUrl;
  },

  captureScreenshot: async (taskId, canvasBlob) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !canvasBlob) return null;
    const fileName = `${taskId}/${user.id}/${Date.now()}_screenshot.png`;
    const { error: uploadError } = await supabase.storage.from('task-files').upload(fileName, canvasBlob, {
      contentType: 'image/png',
    });
    if (uploadError) {
      console.error('[Screenshot] Upload failed:', uploadError.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from('task-files').getPublicUrl(fileName);
    const { error: dbError } = await supabase.from('screenshots').insert({
      user_id: user.id,
      task_id: taskId,
      storage_path: fileName,
    });
    if (dbError) console.error('[Screenshot] DB insert failed:', dbError.message);
    addAudit('screenshot_captured', `Screenshot for task`, user.id, 'task', taskId);
    return urlData?.publicUrl || null;
  },

  subscribeToTasks: (userId, admin, callback) => {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (!admin) {
      query = query.or(`assigned_to.eq.${userId},assigned_to.is.null`);
    }
    const fetchTasks = async () => {
      const { data } = await query;
      callback((data || []).map(mapTask));
    };
    fetchTasks();
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  subscribeToWorkers: (callback) => {
    const channel = supabase
      .channel('workers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
        const { data } = await supabase.from('users').select('*').eq('role', 'worker');
        callback(data || []);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  getScreenshotsByTask: async (taskId) => {
    const { data, error } = await supabase
      .from('screenshots')
      .select('*')
      .eq('task_id', taskId)
      .order('captured_at', { ascending: true });
    if (error) return [];
    return (data || []).map((s) => {
      const { data: urlData } = supabase.storage.from('task-files').getPublicUrl(s.storage_path);
      return { ...s, url: urlData?.publicUrl || null };
    });
  },

  subscribeToAuditLog: (callback) => {
    const channel = supabase
      .channel('audit-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_log' }, async () => {
        const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
        callback((data || []).map(l => ({ ...l, timestamp: l.created_at })));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};
