"use client";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Presentation,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import type { Branding, Role } from "@/lib/types";
import { Button, Logo, Modal, post } from "./ui";

export function HeroArt() {
  return (
    <div className="hero-illustration" aria-hidden="true">
      <div className="hero-orbit" />
      <div className="hero-book">
        <BookOpen />
      </div>
      <span className="hero-chip one">
        <CheckCircle2 size={12} /> Learn by doing
      </span>
      <span className="hero-chip two">
        <GraduationCap size={13} /> Build real capability
      </span>
      <Sparkles className="hero-spark" size={24} />
    </div>
  );
}
export default function Login({
  branding,
  demo,
  onSuccess,
  onError,
}: {
  branding: Branding;
  demo: boolean;
  onSuccess: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [recover, setRecover] = useState(false),
    [message, setMessage] = useState("");
  async function signIn() {
    setBusy(true);
    try {
      await post("auth/login", { email, password });
      await onSuccess();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function explore(role: Role) {
    setBusy(true);
    try {
      await post("auth/demo", { role });
      await onSuccess();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="row">
          <Logo src={branding.logo} />
          <div className="brand-wordmark">
            {branding.name}
            <small>Academy</small>
          </div>
        </div>
        <div>
          <div
            className="badge badge-blue"
            style={{
              background: "#ffffff12",
              color: "#c6dcff",
              border: "1px solid #ffffff20",
            }}
          >
            YOUR NEXT CHAPTER STARTS HERE
          </div>
          <h1>
            Learn the process.
            <br />
            Practice the skills.
            <br />
            <span>Build your future.</span>
          </h1>
          <p>
            A guided, hands-on journey into professional e-commerce operations.
            From your first lesson to your final practical assessment.
          </p>
          <HeroArt />
          <div className="login-points">
            <div>
              <strong>45</strong>
              <small>Days of guided learning</small>
            </div>
            <div>
              <strong>14</strong>
              <small>Operational stages</small>
            </div>
            <div>
              <strong>7</strong>
              <small>Competency gates</small>
            </div>
          </div>
        </div>
        <div className="login-story-footer">
          <span>A Subsidiary of {branding.parentName}</span>
          <span>Learn · Practice · Qualify</span>
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-form">
          <p className="eyebrow">WELCOME TO YOUR ACADEMY</p>
          <h2>Let’s keep moving forward.</h2>
          <p>
            Sign in to your learning workspace.
            <br />
            Your next lesson is waiting for you.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void signIn();
            }}
          >
            <label>
              <span className="field-label">Email address</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              <span className="field-label">Password</span>
              <div className="password-wrap">
                <input
                  type={visible ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="between">
              <span className="small muted">Your own private workspace</span>
              <button
                className="forgot"
                type="button"
                onClick={() => {
                  setMessage("");
                  setRecover(true);
                }}
              >
                Forgot password?
              </button>
            </div>
            <Button type="submit" busy={busy}>
              Sign in to Academy <ArrowRight size={16} />
            </Button>
          </form>
          <div className="secure-label">
            <LockKeyhole size={12} /> Secure, role-based access
          </div>
          {demo && (
            <>
              <div className="demo-divider">Take a look around</div>
              <div className="demo-role-buttons">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void explore("student")}
                >
                  <GraduationCap />
                  Learner demo
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void explore("trainer")}
                >
                  <Presentation />
                  Trainer demo
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void explore("admin")}
                >
                  <ShieldCheck />
                  Management demo
                </button>
              </div>
              <p className="demo-note">
                Synthetic training data. No live accounts, orders or payments.
              </p>
            </>
          )}
          <div className="login-parent">
            <Logo src={branding.parentLogo} parent />
            <span>
              A Subsidiary of <strong>{branding.parentName}</strong>
            </span>
          </div>
        </div>
      </section>
      <Modal
        open={recover}
        onClose={() => setRecover(false)}
        title="Recover your access"
        description="Use the email associated with your academy account."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await post<{ message: string }>("auth/recover", {
                email,
              });
              setMessage(r.message);
            } catch (error) {
              onError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            <span className="field-label">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {message && <div className="notice mt-20">{message}</div>}
          <div className="form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setRecover(false)}
            >
              Back to sign in
            </Button>
            <Button busy={busy} type="submit">
              Request recovery <ChevronRight size={15} />
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
