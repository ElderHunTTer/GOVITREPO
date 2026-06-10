function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  get nextPublicSupabaseUrl() {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
  },
  get nextPublicSupabasePublishableKey() {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
  },
  get supabaseAdminKey() {
    return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get supabaseStorageBucketLabels() {
    return process.env.SUPABASE_STORAGE_BUCKET_LABELS ?? "label-review-images";
  },
  get geminiApiKey() {
    return process.env.GEMINI_API_KEY;
  },
  get geminiVisionModel() {
    return process.env.GEMINI_VISION_MODEL ?? "gemini-3.5-flash";
  },
  get intakeDebugEnabled() {
    return process.env.INTAKE_DEBUG === "1" || process.env.INTAKE_DEBUG === "true";
  }
};

export function requireSupabaseAdminKey(): string {
  return requireEnv(
    "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
    env.supabaseAdminKey
  );
}
