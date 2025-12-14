import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------------
// INSTRUCTIONS:
// 1. Go to your Supabase Dashboard -> Project Settings -> API
// 2. Copy "Project URL" and paste it below.
// 3. Copy "anon" "public" key and paste it below.
// 4. Do NOT use the "service_role" key here.
// ----------------------------------------------------------------------------------

const SUPABASE_URL = 'https://zdxtnofilszrsmwwdoes.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkeHRub2ZpbHN6cnNtd3dkb2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDUzMDksImV4cCI6MjA4MDA4MTMwOX0.8XiCAeUCksBEBNx8S-LJGpYJBMLnhGR7OvxV8fPjCk0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);