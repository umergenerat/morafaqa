import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kahnfrekvtwdtmcgbkbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaG5mcmVrdnR3ZHRtY2dia2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDQwMjQsImV4cCI6MjA4MTIyMDAyNH0.7wKfJ9BQNrQF9iJK3nO944B47QodRgE5PFKuYv4YGgI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMaintenanceSchema() {
    console.log('--- CHECKING MAINTENANCE_REQUESTS SCHEMA ---\n');

    // Try to fetch one record to see actual columns
    const { data, error } = await supabase.from('maintenance_requests').select('*').limit(1);

    if (error) {
        console.error('Error fetching maintenance_requests:', error.message);

        // Try probing common column variations
        console.log('\nProbing column variations:');
        const probes = [
            'dateReported', 'date_reported', 'reporterName', 'reporter_name',
            'costEstimate', 'cost_estimate', 'schoolYear', 'school_year',
            'modifiedBy', 'modified_by', 'modificationDate', 'modification_date'
        ];

        for (const col of probes) {
            const { error: colError } = await supabase.from('maintenance_requests').select(col).limit(1);
            console.log(`  ${col}: ${colError ? '❌ NOT FOUND' : '✅ EXISTS'}`);
        }
    } else if (data && data.length > 0) {
        console.log('Columns found in maintenance_requests:');
        console.log(Object.keys(data[0]).join(', '));
        console.log('\nSample record:');
        console.log(JSON.stringify(data[0], null, 2));
    } else {
        console.log('Table maintenance_requests is empty.');
        console.log('Probing for expected columns...\n');

        const probes = [
            'id', 'title', 'type', 'location', 'description', 'priority', 'status',
            'dateReported', 'date_reported', 'reporterName', 'reporter_name',
            'costEstimate', 'cost_estimate', 'schoolYear', 'school_year'
        ];

        for (const col of probes) {
            const { error: colError } = await supabase.from('maintenance_requests').select(col).limit(1);
            console.log(`  ${col}: ${colError ? '❌' : '✅'}`);
        }
    }

    console.log('\n--- CHECK COMPLETE ---');
}

checkMaintenanceSchema();
