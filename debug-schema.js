import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kahnfrekvtwdtmcgbkbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaG5mcmVrdnR3ZHRtY2dia2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDQwMjQsImV4cCI6MjA4MTIyMDAyNH0.7wKfJ9BQNrQF9iJK3nO944B47QodRgE5PFKuYv4YGgI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- INTROSPECTION START ---');

    // Helper to check a table
    const checkTable = async (tableName) => {
        console.log(`\nChecking table: ${tableName}`);
        // First try to fetch a row
        const { data, error } = await supabase.from(tableName).select('*').limit(1);

        if (error) {
            console.error(`Error fetching ${tableName}:`, error.message);
            return;
        }

        if (data && data.length > 0) {
            console.log(`Columns found in ${tableName}:`, Object.keys(data[0]).join(', '));
        } else {
            console.log(`Table ${tableName} is empty. Trying to insert a dummy record to provoke column error...`);
            // We can't easily discover columns of empty table without admin API or inspection functions (which likely fail for anon)
            // But we can try to select specific columns we care about.
            const { error: colError } = await supabase.from(tableName).select('schoolYear').limit(1);
            if (colError) console.log(`Probe 'schoolYear' failed: ${colError.message}`);
            else console.log(`Probe 'schoolYear' SUCCESS.`);

            const { error: colError2 } = await supabase.from(tableName).select('academic_id').limit(1);
            if (colError2) console.log(`Probe 'academic_id' failed: ${colError2.message}`);
            else console.log(`Probe 'academic_id' SUCCESS.`);

            const { error: colError3 } = await supabase.from(tableName).select('academicId').limit(1);
            if (colError3) console.log(`Probe 'academicId' failed: ${colError3.message}`);
            else console.log(`Probe 'academicId' SUCCESS.`);
        }
    };

    await checkTable('students');
    await checkTable('academic_records');

    console.log('\n--- INTROSPECTION END ---');
}

checkSchema();
