-- ============================================================
-- FIX ALL SECURITY ISSUES — Run in Supabase SQL Editor
-- ============================================================

-- ──────────────────────────────────────────────
-- 0. Column migration
-- ──────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS linked_student_ids TEXT[] DEFAULT '{}';

-- ──────────────────────────────────────────────
-- 1. Helper functions (restricted to authenticated only)
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT role FROM public.users WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.is_my_student(p_student_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT p_student_id = ANY(linked_student_ids)
  FROM public.users WHERE id = auth.uid();
$$;

-- Revoke from anon (fixes: anon_security_definer_function_executable)
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_my_student(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_student(TEXT) TO authenticated;

-- ──────────────────────────────────────────────
-- 2. DROP old permissive policies (all known names)
-- ──────────────────────────────────────────────
DO $$ DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'users','students','settings','meal_orders',
    'academic_records','academicRecords',
    'activity_records','activityRecords',
    'attendance_records','attendanceRecords',
    'behavior_records','behaviorRecords',
    'exit_records','exitRecords',
    'health_records','healthRecords',
    'maintenance_requests','maintenanceRequests'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow all settings" ON public.%I', tbl);
    -- also drop any previously created policies from our script
    EXECUTE format('DROP POLICY IF EXISTS "users_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "users_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "users_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "users_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "students_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "students_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "students_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "students_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "academic_records_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "academic_records_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "academic_records_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "academic_records_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "attendance_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "attendance_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "attendance_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "attendance_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "exit_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "exit_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "exit_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "exit_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "health_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "health_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "health_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "health_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "behavior_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "behavior_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "behavior_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "behavior_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "activity_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "activity_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "activity_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "activity_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "meal_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "meal_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "meal_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "meal_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "maintenance_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "maintenance_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "maintenance_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "maintenance_delete" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "settings_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "settings_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "settings_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "settings_delete" ON public.%I', tbl);
  END LOOP;
END $$;

-- ──────────────────────────────────────────────
-- 3. TABLE: users
-- ──────────────────────────────────────────────
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = 'ADMIN');
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated USING (public.get_my_role() = 'ADMIN' OR id = auth.uid());
CREATE POLICY "users_delete" ON public.users FOR DELETE TO authenticated USING (public.get_my_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- 4. TABLE: students
-- ──────────────────────────────────────────────
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated
  USING (
    public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER','NURSE','BURSAR','CATERING_MANAGER')
    OR (public.get_my_role() = 'PARENT' AND public.is_my_student(id::TEXT))
  );
CREATE POLICY "students_insert" ON public.students FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
CREATE POLICY "students_update" ON public.students FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
CREATE POLICY "students_delete" ON public.students FOR DELETE TO authenticated USING (public.get_my_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- 5. MACRO: apply policies to a student-linked table
-- Used for: academic, attendance, exit, health, behavior records (both snake & camel variants)
-- Each table uses camelCase "studentId" column
-- ──────────────────────────────────────────────

-- academic_records + academicRecords
DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public.academic_records FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public.academic_records FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','TEACHER'));
    CREATE POLICY "rec_update" ON public.academic_records FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','TEACHER'));
    CREATE POLICY "rec_delete" ON public.academic_records FOR DELETE TO authenticated USING (public.get_my_role() = 'ADMIN');
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public."academicRecords" FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public."academicRecords" FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','TEACHER'));
    CREATE POLICY "rec_update" ON public."academicRecords" FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','TEACHER'));
    CREATE POLICY "rec_delete" ON public."academicRecords" FOR DELETE TO authenticated USING (public.get_my_role() = 'ADMIN');
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- attendance_records + attendanceRecords
DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public.attendance_records FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER','NURSE')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER'));
    CREATE POLICY "rec_update" ON public.attendance_records FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER'));
    CREATE POLICY "rec_delete" ON public.attendance_records FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public."attendanceRecords" FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER','NURSE')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public."attendanceRecords" FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER'));
    CREATE POLICY "rec_update" ON public."attendanceRecords" FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER'));
    CREATE POLICY "rec_delete" ON public."attendanceRecords" FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- exit_records + exitRecords
DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public.exit_records FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public.exit_records FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
    CREATE POLICY "rec_update" ON public.exit_records FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
    CREATE POLICY "rec_delete" ON public.exit_records FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public."exitRecords" FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public."exitRecords" FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
    CREATE POLICY "rec_update" ON public."exitRecords" FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
    CREATE POLICY "rec_delete" ON public."exitRecords" FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- health_records + healthRecords
DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public.health_records FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','NURSE')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public.health_records FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','NURSE','SUPERVISOR'));
    CREATE POLICY "rec_update" ON public.health_records FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','NURSE','SUPERVISOR'));
    CREATE POLICY "rec_delete" ON public.health_records FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','NURSE','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public."healthRecords" FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','NURSE')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public."healthRecords" FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','NURSE','SUPERVISOR'));
    CREATE POLICY "rec_update" ON public."healthRecords" FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','NURSE','SUPERVISOR'));
    CREATE POLICY "rec_delete" ON public."healthRecords" FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','NURSE','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- behavior_records + behaviorRecords
DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public.behavior_records FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public.behavior_records FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER'));
    CREATE POLICY "rec_update" ON public.behavior_records FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER'));
    CREATE POLICY "rec_delete" ON public.behavior_records FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public."behaviorRecords" FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER')
      OR (public.get_my_role() = 'PARENT' AND public.is_my_student("studentId"::TEXT)));
    CREATE POLICY "rec_insert" ON public."behaviorRecords" FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER'));
    CREATE POLICY "rec_update" ON public."behaviorRecords" FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','TEACHER'));
    CREATE POLICY "rec_delete" ON public."behaviorRecords" FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- activity_records + activityRecords (public read)
DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public.activity_records FOR SELECT TO authenticated USING (true);
    CREATE POLICY "rec_insert" ON public.activity_records FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
    CREATE POLICY "rec_update" ON public.activity_records FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
    CREATE POLICY "rec_delete" ON public.activity_records FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public."activityRecords" FOR SELECT TO authenticated USING (true);
    CREATE POLICY "rec_insert" ON public."activityRecords" FOR INSERT TO authenticated WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
    CREATE POLICY "rec_update" ON public."activityRecords" FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
    CREATE POLICY "rec_delete" ON public."activityRecords" FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','SUPERVISOR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- maintenance_requests + maintenanceRequests
DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public.maintenance_requests FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','BURSAR','NURSE','TEACHER','CATERING_MANAGER'));
    CREATE POLICY "rec_insert" ON public.maintenance_requests FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR','BURSAR','NURSE','TEACHER','CATERING_MANAGER'));
    CREATE POLICY "rec_update" ON public.maintenance_requests FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','BURSAR'));
    CREATE POLICY "rec_delete" ON public.maintenance_requests FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','BURSAR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE $p$
    CREATE POLICY "rec_select" ON public."maintenanceRequests" FOR SELECT TO authenticated
    USING (public.get_my_role() IN ('ADMIN','SUPERVISOR','BURSAR','NURSE','TEACHER','CATERING_MANAGER'));
    CREATE POLICY "rec_insert" ON public."maintenanceRequests" FOR INSERT TO authenticated
    WITH CHECK (public.get_my_role() IN ('ADMIN','SUPERVISOR','BURSAR','NURSE','TEACHER','CATERING_MANAGER'));
    CREATE POLICY "rec_update" ON public."maintenanceRequests" FOR UPDATE TO authenticated USING (public.get_my_role() IN ('ADMIN','BURSAR'));
    CREATE POLICY "rec_delete" ON public."maintenanceRequests" FOR DELETE TO authenticated USING (public.get_my_role() IN ('ADMIN','BURSAR'));
  $p$;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ──────────────────────────────────────────────
-- 6. TABLE: meal_orders
-- ──────────────────────────────────────────────
CREATE POLICY "rec_select" ON public.meal_orders FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('ADMIN','CATERING_MANAGER','BURSAR','SUPERVISOR'));
CREATE POLICY "rec_insert" ON public.meal_orders FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('ADMIN','CATERING_MANAGER','BURSAR','SUPERVISOR'));
CREATE POLICY "rec_update" ON public.meal_orders FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('ADMIN','CATERING_MANAGER','BURSAR'));
CREATE POLICY "rec_delete" ON public.meal_orders FOR DELETE TO authenticated
  USING (public.get_my_role() IN ('ADMIN','CATERING_MANAGER'));

-- ──────────────────────────────────────────────
-- 7. TABLE: settings
-- ──────────────────────────────────────────────
CREATE POLICY "rec_select" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "rec_insert" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = 'ADMIN');
CREATE POLICY "rec_update" ON public.settings FOR UPDATE TO authenticated USING (public.get_my_role() = 'ADMIN');
CREATE POLICY "rec_delete" ON public.settings FOR DELETE TO authenticated USING (public.get_my_role() = 'ADMIN');

-- ──────────────────────────────────────────────
-- 8. FIX: reload_schema_cache search_path
-- ──────────────────────────────────────────────
ALTER FUNCTION public.reload_schema_cache() SET search_path = '';
