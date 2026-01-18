/**
 * Supabase Keep-Alive Script
 * 
 * This script pings the Supabase database to prevent it from being paused
 * due to inactivity (Supabase pauses free tier projects after 7 days).
 * 
 * Usage: node scripts/keep-alive.js
 * 
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anonymous key
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
    console.log(`🔄 Pinging Supabase at ${new Date().toISOString()}...`);

    try {
        // Simple query to keep the database active
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        if (error) {
            console.error('❌ Error pinging Supabase:', error.message);
            process.exit(1);
        }

        console.log('✅ Supabase ping successful!');
        console.log(`📊 Query returned ${data ? data.length : 0} row(s)`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        process.exit(1);
    }
}

keepAlive();
