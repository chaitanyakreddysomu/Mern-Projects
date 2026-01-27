
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bjtagahtnyzystdghljn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdGFnYWh0bnl6eXN0ZGdobGpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc0NDEwMiwiZXhwIjoyMDg0MzIwMTAyfQ.33Fls13gU1g_v2CFQe4ADzTBlN5b_kJy6VKheD8iglk'; // Service Role

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
