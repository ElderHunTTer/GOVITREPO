import { redirect } from "next/navigation";
import { getReviewerContext } from "@/lib/product";
import { signInAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getReviewerContext();
  if (context) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Reviewer access</p>
        <h1>Sign in to the label review console.</h1>
        <p className="page-subtitle">
          Use a Supabase email and password account. For testing, email validation
          can stay disabled and reviewer accounts can be created directly in
          Supabase Auth.
        </p>

        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

        <form action={signInAction} className="form-shell">
          <label className="input-group">
            <span>Email</span>
            <input name="email" placeholder="reviewer@example.gov" type="email" />
          </label>
          <label className="input-group">
            <span>Password</span>
            <input name="password" placeholder="••••••••" type="password" />
          </label>
          <button className="primary-button full-width-button" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
