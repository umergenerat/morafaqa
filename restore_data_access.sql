-- ============================================================
-- RESTORE DATA ACCESS — Run in Supabase SQL Editor
-- ============================================================
-- PROBLEM: RLS policies were set to "TO authenticated" only,
-- but the app uses the anon key (no Supabase Auth).
-- All queries return empty → data appears "lost".
-- SOLUTION: Allow anon + authenticated access on all tables.
-- The data is NOT deleted — just hidden by RLS.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. DROP ALL existing restrictive policies
-- ──────────────────────────────────────────────
DO $$ DECLARE
  tbl TEXT;
  pol RECORD;
  tbls TEXT[] := ARRAY[
    'users','students','settings','meal_orders',
    'academic_records','attendance_records',
    'behavior_records','exit_records',
    'health_records','activity_records',
    'maintenance_requests'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    -- Drop ALL policies on each table dynamically
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- ──────────────────────────────────────────────
-- 2. Ensure RLS is ENABLED (required for policies to work)
-- ──────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Also handle meal_orders if it exists
DO $$ BEGIN
  ALTER TABLE public.meal_orders ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ──────────────────────────────────────────────
-- 3. CREATE open policies (anon + authenticated)
--    Since the app handles auth at the application level,
--    we allow both roles full access.
-- ──────────────────────────────────────────────

-- USERS table
CREATE POLICY "users_full_access" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- STUDENTS table
CREATE POLICY "students_full_access" ON public.students
  FOR ALL USING (true) WITH CHECK (true);

-- SETTINGS table
CREATE POLICY "settings_full_access" ON public.settings
  FOR ALL USING (true) WITH CHECK (true);

-- BEHAVIOR_RECORDS table
CREATE POLICY "behavior_records_full_access" ON public.behavior_records
  FOR ALL USING (true) WITH CHECK (true);

-- HEALTH_RECORDS table
CREATE POLICY "health_records_full_access" ON public.health_records
  FOR ALL USING (true) WITH CHECK (true);

-- ATTENDANCE_RECORDS table
CREATE POLICY "attendance_records_full_access" ON public.attendance_records
  FOR ALL USING (true) WITH CHECK (true);

-- EXIT_RECORDS table
CREATE POLICY "exit_records_full_access" ON public.exit_records
  FOR ALL USING (true) WITH CHECK (true);

-- ACTIVITY_RECORDS table
CREATE POLICY "activity_records_full_access" ON public.activity_records
  FOR ALL USING (true) WITH CHECK (true);

-- ACADEMIC_RECORDS table
CREATE POLICY "academic_records_full_access" ON public.academic_records
  FOR ALL USING (true) WITH CHECK (true);

-- MAINTENANCE_REQUESTS table
CREATE POLICY "maintenance_requests_full_access" ON public.maintenance_requests
  FOR ALL USING (true) WITH CHECK (true);

-- MEAL_ORDERS table (if exists)
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "meal_orders_full_access" ON public.meal_orders FOR ALL USING (true) WITH CHECK (true)';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ──────────────────────────────────────────────
-- 4. VERIFY: Count rows to confirm data is back
-- ──────────────────────────────────────────────
SELECT 'students' AS table_name, COUNT(*) AS row_count FROM public.students
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'behavior_records', COUNT(*) FROM public.behavior_records
UNION ALL
SELECT 'health_records', COUNT(*) FROM public.health_records
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM public.attendance_records
UNION ALL
SELECT 'exit_records', COUNT(*) FROM public.exit_records
UNION ALL
SELECT 'activity_records', COUNT(*) FROM public.activity_records
UNION ALL
SELECT 'academic_records', COUNT(*) FROM public.academic_records
UNION ALL
SELECT 'maintenance_requests', COUNT(*) FROM public.maintenance_requests
UNION ALL
SELECT 'settings', COUNT(*) FROM public.settings
ORDER BY table_name;
