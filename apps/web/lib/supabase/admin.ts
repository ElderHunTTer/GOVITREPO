import { createClient } from "@supabase/supabase-js";
import { env, requireSupabaseAdminKey } from "../env";

export function createAdminClient() {
  return createClient(
    env.nextPublicSupabaseUrl,
    requireSupabaseAdminKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

