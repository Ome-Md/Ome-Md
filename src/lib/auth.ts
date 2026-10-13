import { randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { query } from "./db";
import { tokenHash, verifyPassword } from "./password";
import type { Profile } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}
export const demoEnabled = () =>
  process.env.AUTH_MODE !== "supabase" &&
  process.env.DEMO_MODE === "true" &&
  !process.env.VERCEL;
export function supabaseFor(request: NextRequest) {
  const pending: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[] = [];
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          pending.push(...cookies);
        },
      },
    },
  );
  return {
    client,
    apply: (response: NextResponse) => {
      for (const c of pending) response.cookies.set(c.name, c.value, c.options);
      return response;
    },
  };
}
export async function currentUser(
  request: NextRequest,
): Promise<Profile | null> {
  if (process.env.AUTH_MODE === "supabase") {
    const { client } = supabaseFor(request),
      {
        data: { user },
      } = await client.auth.getUser();
    if (!user) return null;
    return (
      (
        await query<Profile>("SELECT * FROM profiles WHERE id=$1 AND enabled", [
          user.id,
        ])
      )[0] ?? null
    );
  }
  const token = request.cookies.get("drc_session")?.value;
  if (!token) return null;
  return (
    (
      await query<Profile>(
        "SELECT p.* FROM sessions s JOIN profiles p ON p.id=s.profile_id WHERE s.token_hash=$1 AND s.expires_at>now() AND p.enabled",
        [tokenHash(token)],
      )
    )[0] ?? null
  );
}
export async function requireUser(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) throw new ApiError(401, "Please sign in to continue.");
  return user;
}
export function requireRole(user: Profile, roles: Profile["role"][]) {
  if (!roles.includes(user.role))
    throw new ApiError(403, "Your role does not permit this action.");
}
export async function createSession(user: Profile, request: NextRequest) {
  const token = randomBytes(32).toString("base64url");
  await query(
    "INSERT INTO sessions(token_hash,profile_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",
    [tokenHash(token), user.id],
  );
  const response = NextResponse.json({ user });
  response.cookies.set("drc_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      request.nextUrl.protocol === "https:" || Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
export async function login(
  request: NextRequest,
  email: string,
  password: string,
) {
  if (process.env.AUTH_MODE === "supabase") {
    const { client, apply } = supabaseFor(request);
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new ApiError(401, "Email or password is incorrect.");
    const profile =
      data.user &&
      (
        await query<Profile>("SELECT * FROM profiles WHERE id=$1 AND enabled", [
          data.user.id,
        ])
      )[0];
    if (!profile) {
      await client.auth.signOut();
      return apply(
        NextResponse.json(
          {
            error:
              "Your account needs an active academy enrollment. Contact management.",
          },
          { status: 403 },
        ),
      );
    }
    return apply(NextResponse.json({ ok: true }));
  }
  const key = tokenHash(
    `${email.toLowerCase()}:${request.headers.get("x-forwarded-for") ?? "local"}`,
  );
  const rate = (
    await query<{ attempts: number; reset_at: string }>(
      "INSERT INTO login_attempts(key,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN login_attempts.reset_at<now() THEN 1 ELSE login_attempts.attempts+1 END,reset_at=CASE WHEN login_attempts.reset_at<now() THEN now()+interval '15 minutes' ELSE login_attempts.reset_at END RETURNING attempts,reset_at",
      [key],
    )
  )[0];
  if (rate.attempts > 10)
    throw new ApiError(
      429,
      "Too many sign-in attempts. Try again in 15 minutes.",
    );
  const record = (
    await query<Profile & { password_hash: string }>(
      "SELECT p.*,c.password_hash FROM profiles p JOIN local_credentials c ON c.profile_id=p.id WHERE lower(p.email)=$1 AND p.enabled",
      [email.toLowerCase()],
    )
  )[0];
  if (!record || !verifyPassword(password, record.password_hash))
    throw new ApiError(401, "Email or password is incorrect.");
  await query("DELETE FROM login_attempts WHERE key=$1", [key]);
  const { password_hash: _, ...user } = record;
  return createSession(user, request);
}
export async function logout(request: NextRequest) {
  if (process.env.AUTH_MODE === "supabase") {
    const { client, apply } = supabaseFor(request);
    await client.auth.signOut();
    return apply(NextResponse.json({ ok: true }));
  }
  const token = request.cookies.get("drc_session")?.value;
  if (token)
    await query("DELETE FROM sessions WHERE token_hash=$1", [tokenHash(token)]);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("drc_session");
  return response;
}
export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host"))
    throw new ApiError(403, "Cross-origin mutations are not permitted.");
}
