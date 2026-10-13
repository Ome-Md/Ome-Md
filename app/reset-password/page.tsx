"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
export default function ResetPassword() {
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <main className="loading-screen">
      <section className="card" style={{ width: "min(440px,90vw)" }}>
        <h1>Choose a new password.</h1>
        <p className="small">Use your verified Supabase recovery session.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (password !== confirm) {
              setMessage("The passwords do not match.");
              return;
            }
            if (
              !process.env.NEXT_PUBLIC_SUPABASE_URL ||
              !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ) {
              setMessage(
                "Local password recovery is managed by academy administration.",
              );
              return;
            }
            setBusy(true);
            try {
              const client = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              );
              const { error } = await client.auth.updateUser({ password });
              if (error) throw error;
              setMessage("Password updated. You can return to the academy.");
            } catch (error) {
              setMessage((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            <span className="field-label">New password</span>
            <input
              type="password"
              minLength={12}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className="mt-20">
            <span className="field-label">Confirm password</span>
            <input
              type="password"
              minLength={12}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>
          {message && (
            <p className="notice mt-20" role="status">
              {message}
            </p>
          )}
          <div className="form-actions">
            <a className="btn btn-secondary" href="/">
              Back to Academy
            </a>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
