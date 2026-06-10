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
  get paddleOcrPythonPath() {
    return process.env.PADDLEOCR_PYTHON_PATH ?? (process.platform === "win32" ? "py" : "python3");
  },
  get paddleOcrBridgePath() {
    return process.env.PADDLEOCR_BRIDGE_PATH ?? "scripts/paddle_ocr_bridge.py";
  }
};

export function requireSupabaseAdminKey(): string {
  return requireEnv(
    "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
    env.supabaseAdminKey
  );
}
