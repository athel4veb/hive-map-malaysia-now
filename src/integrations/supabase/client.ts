// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://kbyqlgmkowekcobzakpx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieXFsZ21rb3dla2NvYnpha3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNTMwODEsImV4cCI6MjA2NDkyOTA4MX0.y0VFGJ0mJek9aGYsl_RQ0-TOmjdEssOI4QvGyFVzhq0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);