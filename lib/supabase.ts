import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing! The app will run in Mock Mode.\n' +
    'Check Vercel Settings > Environment Variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

/**
 * دالة جلب الطلاب المحسنة - تحل مشكلة HTTP2_PROTOCOL_ERROR
 * تطلب فقط الأعمدة الأساسية لتقليل حجم البيانات وطول الرابط
 */
export const fetchStudentsOptimized = async (page = 0, pageSize = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('students')
    .select(`
      id, 
      fullName, 
      academicId, 
      nationalId,
      gender,
      grade,
      roomNumber,
      photoUrl
    `, { count: 'exact' }) // جلب الأعمدة الضرورية فقط
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("خطأ في جلب بيانات الطلاب:", error.message);
    throw error;
  }

  return { data, count };
};