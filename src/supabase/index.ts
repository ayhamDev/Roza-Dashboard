import type { Database } from "@/interface/database.types";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
export { supabase };
