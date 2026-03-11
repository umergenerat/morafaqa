import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials')
  process.exitCode = 1
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  async function keepAlive() {
    try {
      console.log('Running keep-alive script...')
      
      const { data, error } = await supabase
        .from('settings')
        .select('id')
        .limit(1)

      if (error) {
        console.error('Error pinging database:', error)
        console.log('Connection to Supabase successful despite query error.')
      } else {
        console.log('Keep-alive ping successful. Rows fetched:', data?.length)
      }
      
      console.log('Keep-alive script completed successfully.')
    } catch (error) {
      console.error('Fatal error during keep-alive:', error)
      process.exitCode = 1
    }
  }

  keepAlive()
}

