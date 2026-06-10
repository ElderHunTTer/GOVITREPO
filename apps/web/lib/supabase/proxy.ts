import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "../env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof supabaseResponse.cookies.set>[2];
  };

  const supabase = createServerClient(
    env.nextPublicSupabaseUrl,
    env.nextPublicSupabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[], headers: Record<string, string>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          supabaseResponse = NextResponse.next({
            request
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        }
      }
    }
  );

  await supabase.auth.getClaims();

  return supabaseResponse;
}
