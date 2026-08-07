-- RUN THIS IN SUPABASE SQL EDITOR TO FIX SCREENSHOT UPLOADS
-- Go to: https://supabase.com/dashboard/project/qcahqsjcosntvoplwbgy/sql/new

-- Allow authenticated users to upload files to task-files bucket
CREATE POLICY IF NOT EXISTS "task_files_insert_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-files');

-- Allow anyone to read files from task-files bucket (public)
CREATE POLICY IF NOT EXISTS "task_files_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'task-files');

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "task_files_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'task-files' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Verify policies were created
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
