import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugvbuczptstqukbzpbsm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndmJ1Y3pwdHN0cXVrYnpwYnNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwMDU1MywiZXhwIjoyMTA0MTc2NTUzfQ.vLCXroRJGLx_fNVb6j7LHqAUfhsCW7rnFyfnTmaBtQY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
  const { data, error } = await supabase.from('units').select('count');
  console.log('Test units table:', { data, error });
}

test();
