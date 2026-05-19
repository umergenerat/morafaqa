/**
 * Deep check - Check ALL table names including camelCase variants
 * and try to bypass RLS by listing actual table info
 */

const SUPABASE_URL = 'https://kahnfrekvtwdtmcgbkbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaG5mcmVrdnR3ZHRtY2dia2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDQwMjQsImV4cCI6MjA4MTIyMDAyNH0.7wKfJ9BQNrQF9iJK3nO944B47QodRgE5PFKuYv4YGgI';

// Check BOTH snake_case and camelCase table names
const allTables = [
  // snake_case
  'students', 'users', 'settings', 'behavior_records', 'health_records',
  'attendance_records', 'exit_records', 'activity_records', 'academic_records',
  'maintenance_requests', 'meal_orders',
  // camelCase (Supabase may have created these)
  'behaviorRecords', 'healthRecords', 'attendanceRecords', 'exitRecords',
  'activityRecords', 'academicRecords', 'maintenanceRequests', 'mealOrders'
];

async function checkTable(table) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?select=*&limit=3`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    const countHeader = res.headers.get('content-range');
    const data = await res.json();
    
    if (res.status === 404 || (data.code === '42P01')) {
      return { table, exists: false, count: '-', note: 'Table does not exist' };
    }
    
    if (!res.ok) {
      return { table, exists: true, count: '?', note: `Error: ${data.message || res.status}` };
    }

    const total = countHeader ? countHeader.split('/')[1] : String(data.length);
    
    // Show sample data keys if any
    let sample = '';
    if (data.length > 0) {
      sample = `Keys: ${Object.keys(data[0]).join(', ')}`;
    }
    
    return { table, exists: true, count: total, note: data.length > 0 ? `✅ HAS DATA! ${sample}` : 'Empty' };
  } catch (err) {
    return { table, exists: false, count: '-', note: `Network error: ${err.message}` };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  DEEP DATA CHECK — All Table Name Variants');
  console.log('═══════════════════════════════════════════════\n');

  let foundData = false;

  for (const table of allTables) {
    const result = await checkTable(table);
    if (!result.exists) continue; // Skip non-existent tables silently
    
    const icon = result.count !== '0' && result.count !== '-' && result.note.includes('HAS DATA') ? '🟢' : '⚪';
    console.log(`  ${icon} ${table.padEnd(25)} | Count: ${String(result.count).padEnd(5)} | ${result.note}`);
    
    if (result.note.includes('HAS DATA')) foundData = true;
  }

  console.log('\n═══════════════════════════════════════════════');
  
  if (foundData) {
    console.log('  ✅ Data found! Some tables have data.');
    console.log('  The app may be querying the wrong table names.');
  } else {
    console.log('  ❌ No data found in ANY table variant.');
    console.log('');
    console.log('  POSSIBLE CAUSES:');
    console.log('  1. Data was deleted (manually or by a migration)');
    console.log('  2. Supabase project was reset/paused');
    console.log('  3. RLS is blocking even with anon key');
    console.log('');
    console.log('  RECOVERY OPTIONS:');
    console.log('  ─────────────────');
    console.log('  A) Check Supabase Dashboard for backups:');
    console.log('     → Go to: https://supabase.com/dashboard/project/kahnfrekvtwdtmcgbkbi/settings/database');
    console.log('     → Look for "Database Backups" or "Point-in-Time Recovery"');
    console.log('');
    console.log('  B) Check if project was paused:');
    console.log('     → Go to: https://supabase.com/dashboard/project/kahnfrekvtwdtmcgbkbi');
    console.log('     → If paused, restore it and data should come back');
    console.log('');
    console.log('  C) Run restore_data_access.sql first, then re-check:');
    console.log('     → The RLS might be blocking silently (returning empty instead of error)');
    console.log('     → Go to SQL Editor and run the restore script');
  }
  
  console.log('═══════════════════════════════════════════════\n');
}

main().catch(console.error);
