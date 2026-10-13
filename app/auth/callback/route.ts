import { NextRequest, NextResponse } from "next/server";
import { supabaseFor } from "@/lib/auth";
export async function GET(request: NextRequest) {
  if (process.env.AUTH_MODE !== "supabase")
    return NextResponse.redirect(
      new URL(
        "/?authError=Hosted+authentication+is+not+configured",
        request.url,
      ),
    );
  const code = request.nextUrl.searchParams.get("code");
  if (!code)
    return NextResponse.redirect(
      new URL("/?authError=Missing+authentication+code", request.url),
    );
  const { client, apply } = supabaseFor(request),
    { error } = await client.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(
      new URL("/?authError=Authentication+failed", request.url),
    );
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  let destination = new URL("/", request.url);
  try {
    const candidate = new URL(next, request.url);
    if (candidate.origin === request.nextUrl.origin && next.startsWith("/"))
      destination = candidate;
  } catch {}
  return apply(NextResponse.redirect(destination));
}
