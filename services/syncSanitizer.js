/**
 * syncSanitizer.js
 * --------------------------------------------------
 * تنظيف بيانات INSERT / UPDATE قبل إرسالها إلى Supabase
 * يمنع أخطاء:
 * - generated columns
 * - expected JSON array
 * - schema mismatch
 * --------------------------------------------------
 */

/**
 * أعمدة عامة ممنوع إرسالها في أي جدول
 */
export const GLOBAL_READ_ONLY_COLUMNS = [
  'id',
  'created_at',
  'updated_at'
];

/**
 * أعمدة خاصة بكل جدول
 */
export const TABLE_READ_ONLY_COLUMNS = {
  activity_records: [
    'participantsCount' // generated column
  ],
  behavior_records: [],
  attendance_records: [],
  health_records: [],
  academic_records: [],
  maintenance_requests: []
};

/**
 * ضمان أن القيمة Array (مهم جدًا لـ Supabase)
 */
export function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

/**
 * تنظيف كائن واحد قبل الإرسال
 */
export function sanitizeForSupabase(
  record,
  {
    table = null,
    forceArrays = [],
    extraReadOnly = []
  } = {}
) {
  const readOnlyColumns = [
    ...GLOBAL_READ_ONLY_COLUMNS,
    ...(table && TABLE_READ_ONLY_COLUMNS[table]
      ? TABLE_READ_ONLY_COLUMNS[table]
      : []),
    ...extraReadOnly
  ];

  const clean = {};

  Object.entries(record || {}).forEach(([key, value]) => {
    // تجاهل الأعمدة المحمية
    if (readOnlyColumns.includes(key)) return;

    // تجاهل undefined
    if (value === undefined) return;

    // إجبار بعض الحقول أن تكون ARRAY
    if (forceArrays.includes(key)) {
      clean[key] = ensureArray(value);
      return;
    }

    clean[key] = value;
  });

  return clean;
}

/**
 * Sync ذكي (INSERT أو UPDATE)
 */
export async function syncRecord({
  supabase,
  table,
  record,
  forceArrays = [],
  extraReadOnly = []
}) {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }

  if (!table) {
    throw new Error('Table name is required');
  }

  const cleanRecord = sanitizeForSupabase(record, {
    table,
    forceArrays,
    extraReadOnly
  });

  // UPDATE
  if (record.id) {
    return supabase
      .from(table)
      .update(cleanRecord)
      .eq('id', record.id);
  }

  // INSERT
  return supabase
    .from(table)
    .insert(cleanRecord);
}
