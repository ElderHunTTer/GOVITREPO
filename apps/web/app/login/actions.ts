"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function encodeError(message: string) {
  return encodeURIComponent(message);
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirect(`/login?error=${encodeError("Enter your email and password.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeError("Invalid reviewer credentials.")}`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?error=${encodeError("Unable to establish a session.")}`);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("reviewer_profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    redirect(
      `/login?error=${encodeError("This account is not enabled for reviewer access.")}`
    );
  }

  redirect("/dashboard");
}

