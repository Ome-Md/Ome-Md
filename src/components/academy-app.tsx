"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Route,
  BookOpen,
  FlaskConical,
  ClipboardList,
  Search,
  Workflow,
  Send,
  GraduationCap,
  ChartNoAxesCombined,
  FolderOpen,
  Bell,
  Settings,
  Users,
  Presentation,
  Palette,
  Menu,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
  LifeBuoy,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Bootstrap, Lesson, Submission } from "@/lib/types";
import { getForm } from "@/lib/forms";
import { defaultBranding } from "@/lib/branding";
import { AcademyContext, api, post, Button, Logo, Modal, Badge } from "./ui";
import Login from "./login";
import {
  Dashboard,
  Journey,
  Courses,
  PracticeLab,
  Assignments,
  Operations,
  SubmissionList,
  Performance,
  Resources,
  Notifications,
  Assessments,
  About,
} from "./workspace-views";
import { LessonViewer, PresentationMode } from "./lessons";
import { PracticeForm } from "./practice-form";
import { ReviewDialog } from "./review";
import { PeopleAndCohorts, AcademySettings } from "./management-views";

const nav: {
  id: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
  group?: string;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    id: "journey",
    label: "My Learning Journey",
    icon: Route,
    roles: ["student"],
  },
  { id: "courses", label: "Courses & Lessons", icon: BookOpen },
  {
    id: "practice",
    label: "Practice Lab",
    icon: FlaskConical,
    roles: ["student"],
  },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  {
    id: "research",
    label: "Product Research",
    icon: Search,
    roles: ["student"],
  },
  {
    id: "operations",
    label: "Operational Workflows",
    icon: Workflow,
    group: "OPERATIONS",
  },
  {
    id: "submissions",
    label: "My Submissions",
    icon: Send,
    roles: ["student"],
  },
  {
    id: "queue",
    label: "Approval Queue",
    icon: ClipboardList,
    roles: ["trainer", "admin", "auditor"],
  },
  { id: "assessments", label: "Assessments", icon: GraduationCap },
  { id: "performance", label: "Performance", icon: ChartNoAxesCombined },
  { id: "people", label: "People & Cohorts", icon: Users, roles: ["admin"] },
  {
    id: "resources",
    label: "Resources & SOP Library",
    icon: FolderOpen,
    group: "YOUR WORKSPACE",
  },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Profile & Settings", icon: Settings },
  { id: "about", label: "About the Academy", icon: Info },
];
export default function AcademyApp() {
  const [data, setData] = useState<Bootstrap | null>(null),
    [fatal, setFatal] = useState(""),
    [view, setView] = useState("dashboard"),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(""),
    [toast, setToast] = useState<{ message: string; error?: boolean } | null>(
      null,
    ),
    [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null),
    [selectedRecord, setSelectedRecord] = useState<Submission | null>(null),
    [review, setReview] = useState<Submission | null>(null),
    [presentation, setPresentation] = useState(false),
    [help, setHelp] = useState(false),
    [parentPicker, setParentPicker] = useState<{
      key: string;
      lesson?: string | null;
      assignment?: string | null;
      records: Submission[];
    } | null>(null);
  const dataRef = useRef(data),
    handledHash = useRef<string | null>(null),
    pendingSave = useRef<(() => Promise<void>) | null>(null),
    searchRef = useRef<HTMLInputElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  dataRef.current = data;
  const notify = useCallback((message: string, error = false) => {
    setToast({ message, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6500);
  }, []);
  const refresh = useCallback(async () => {
    setData(await api<Bootstrap>("bootstrap"));
    setFatal("");
  }, []);
  useEffect(() => {
    void refresh().catch((error) => setFatal((error as Error).message));
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [refresh]);
  useEffect(() => {
    if (!data?.user) return;
    const events = new EventSource("/api/events");
    events.onmessage = () => {
      void refresh().catch(() => {});
      window.dispatchEvent(new Event("academy:changed"));
    };
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        void refresh().catch(() => {});
    }, 10000);
    return () => {
      clearInterval(timer);
      events.close();
    };
  }, [data?.user?.id, refresh]);
  useEffect(() => {
    const b = data?.branding ?? defaultBranding;
    document.documentElement.style.setProperty("--brand", b.primary);
    document.documentElement.style.setProperty("--secondary", b.secondary);
    document.documentElement.style.setProperty("--font", b.font);
    document.documentElement.dataset.theme =
      data?.user?.preferences.theme === "dark" ? "dark" : "light";
  }, [data?.branding, data?.user?.preferences.theme]);
  const registerPendingSave = useCallback((save: () => Promise<void>) => {
    pendingSave.current = save;
    return () => {
      if (pendingSave.current === save) pendingSave.current = null;
    };
  }, []);
  const go = useCallback(
    (next: string) => {
      void (async () => {
        await pendingSave.current?.();
        setView(next);
        setSelectedLesson(null);
        setSelectedRecord(null);
        setMobile(false);
        setSearch("");
        handledHash.current = "#" + next;
        window.location.hash = next;
        window.scrollTo({ top: 0, behavior: "instant" });
      })().catch((error) => notify((error as Error).message, true));
    },
    [notify],
  );
  const openLesson = useCallback(
    async (id: string, present = false) => {
      try {
        await pendingSave.current?.();
        const l = await api<Lesson>("lessons/" + id);
        setSelectedLesson(l);
        setSelectedRecord(null);
        setView("lesson");
        setPresentation(present);
        setMobile(false);
        setSearch("");
        handledHash.current = "#lesson/" + id;
        window.location.hash = "lesson/" + id;
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch (error) {
        notify((error as Error).message, true);
      }
    },
    [notify],
  );
  const openRecord = useCallback(
    async (id: string) => {
      try {
        await pendingSave.current?.();
        const record = await api<Submission>("submissions/" + id);
        if (dataRef.current?.user?.role === "student") {
          setSelectedRecord(record);
          setSelectedLesson(null);
          setView("workspace");
          handledHash.current = "#record/" + id;
          window.location.hash = "record/" + id;
          window.scrollTo({ top: 0, behavior: "instant" });
        } else setReview(record);
        setMobile(false);
      } catch (error) {
        notify((error as Error).message, true);
      }
    },
    [notify],
  );
  const openWorkspace = useCallback(
    async (
      key: string,
      lesson?: string | null,
      assignment?: string | null,
      parentId?: string | null,
    ) => {
      const state = dataRef.current;
      if (!state?.user) return;
      try {
        await pendingSave.current?.();
      } catch (error) {
        notify((error as Error).message, true);
        return;
      }
      const spec = getForm(key);
      if (spec.parent && !parentId) {
        const parents = state.submissions.filter(
          (s) =>
            s.form_key === spec.parent &&
            s.status === "approved" &&
            s.student_id === state.user!.id,
        );
        if (!parents.length) {
          notify(
            `An approved ${getForm(spec.parent).short.toLowerCase()} record is required first.`,
            true,
          );
          return;
        }
        if (parents.length > 1) {
          setParentPicker({ key, lesson, assignment, records: parents });
          return;
        }
        parentId = parents[0].id;
      }
      const parent = state.submissions.find((s) => s.id === parentId),
        values: Record<string, unknown> = {
          title: parent?.title ?? "",
          country: parent?.data.country ?? "USA",
        };
      if (key === "F06") {
        Object.assign(values, {
          item: parent?.data.item ?? "",
          shipping: parent?.data.shipping ?? 0,
          currency:
            parent?.data.country === "UK"
              ? "GBP"
              : parent?.data.country === "Europe"
                ? "EUR"
                : "USD",
          mode: "allowance",
          allowance: 20,
          feePercent: 0,
          fixedFee: 0,
          promotionPercent: 0,
          conversion: 0,
          tax: 0,
          other: 0,
        });
        const research = state.submissions.find(
          (s) => s.id === parent?.parent_id,
        );
        values.selling = research?.data.selling ?? "";
      }
      if (key === "F08") {
        values.price = parent?.data.selling ?? "";
        values.shipping = parent?.data.shipping ?? 0;
      }
      try {
        const record = await post<Submission>("submissions", {
          formKey: key,
          parentId: parentId ?? null,
          lessonId:
            lesson ??
            state.lessons.find((l) => l.form_key === key && !l.locked)?.id ??
            null,
          assignmentId: assignment ?? null,
          data: values,
          classification: state.user.synthetic ? "synthetic" : "pending",
        });
        setSelectedRecord(record);
        setSelectedLesson(null);
        setView("workspace");
        setParentPicker(null);
        setMobile(false);
        handledHash.current = "#record/" + record.id;
        window.location.hash = "record/" + record.id;
        await refresh();
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch (error) {
        notify((error as Error).message, true);
      }
    },
    [notify, refresh],
  );
  useEffect(() => {
    if (!data?.user) return;
    const parse = async () => {
      if (handledHash.current === window.location.hash) return;
      try {
        await pendingSave.current?.();
      } catch (error) {
        notify((error as Error).message, true);
        return;
      }
      const [v, id] = window.location.hash.slice(1).split("/");
      if (v === "lesson" && id) void openLesson(id);
      else if (v === "record" && id) void openRecord(id);
      else if (
        nav.some(
          (n) =>
            n.id === v &&
            (!n.roles || n.roles.includes(dataRef.current?.user?.role ?? "")),
        )
      ) {
        handledHash.current = window.location.hash;
        setView(v);
        setSelectedLesson(null);
        setSelectedRecord(null);
      }
    };
    void parse();
    window.addEventListener("hashchange", parse);
    return () => window.removeEventListener("hashchange", parse);
  }, [data?.user?.id, openLesson, openRecord]);
  async function switchDemo(role: string) {
    try {
      await pendingSave.current?.();
      await post("auth/demo", { role });
      go("dashboard");
      await refresh();
      notify(
        "Opened the " +
          (role === "student" ? "learner" : role) +
          " training demo.",
      );
    } catch (error) {
      notify((error as Error).message, true);
    }
  }
  async function signOut() {
    try {
      await post("auth/logout", {});
      setSelectedRecord(null);
      setSelectedLesson(null);
      window.location.hash = "";
      await refresh();
    } catch (error) {
      notify((error as Error).message, true);
    }
  }
  async function theme() {
    if (!data?.user) return;
    try {
      await api("profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: data.user.display_name,
          theme: data.user.preferences.theme === "dark" ? "light" : "dark",
        }),
      });
      await refresh();
    } catch (error) {
      notify((error as Error).message, true);
    }
  }
  const toastElement = toast && (
    <div
      className={"toast" + (toast.error ? " error" : "")}
      role={toast.error ? "alert" : "status"}
    >
      {toast.error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{toast.message}</span>
      <button
        className="icon-btn"
        aria-label="Dismiss message"
        onClick={() => setToast(null)}
      >
        <X size={16} />
      </button>
    </div>
  );
  if (fatal)
    return (
      <div className="loading-screen">
        <AlertCircle size={30} />
        <h2>We couldn’t open your workspace.</h2>
        <p>{fatal}</p>
        <Button
          onClick={() =>
            void refresh().catch((error) => setFatal((error as Error).message))
          }
        >
          Try again
        </Button>
      </div>
    );
  if (!data)
    return (
      <div className="loading-screen">
        <LoaderCircle size={26} className="spin" />
        <span>Opening Dr. Commerce Academy…</span>
      </div>
    );
  if (!data.user)
    return (
      <>
        <Login
          branding={data.branding}
          demo={data.demo}
          onSuccess={async () => {
            go("dashboard");
            await refresh();
          }}
          onError={(message) => notify(message, true)}
        />
        {toastElement}
      </>
    );
  const user = data.user,
    items = nav.filter((n) => !n.roles || n.roles.includes(user.role)),
    unread = data.notifications.filter((n) => !n.read_at).length,
    pending = data.submissions.filter((s) => s.status === "submitted").length;
  const label =
    view === "lesson"
      ? "Lesson workspace"
      : view === "workspace"
        ? getForm(selectedRecord?.form_key ?? "F02").short
        : (items.find((n) => n.id === view)?.label ?? "Dashboard");
  const results = search.trim()
    ? data.lessons
        .filter((l) =>
          (l.title + " " + l.day).toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 7)
    : [];
  return (
    <AcademyContext.Provider
      value={{
        registerPendingSave,
        data,
        refresh,
        go,
        openLesson,
        openWorkspace,
        openRecord,
        notify,
      }}
    >
      <div
        className={
          (collapsed ? "collapsed " : "") + (mobile ? "mobile-open" : "")
        }
      >
        {mobile && (
          <button
            className="mobile-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          />
        )}
        <aside className="sidebar">
          <button
            className="sidebar-brand"
            onClick={() => go("dashboard")}
            aria-label="Dr. Commerce Academy home"
          >
            <Logo src={data.branding.logo} />
            <div className="brand-wordmark">
              {data.branding.name}
              <small>Academy</small>
            </div>
          </button>
          <div className="sidebar-content">
            <div className="nav-label">LEARN & GROW</div>
            {items.map((item) => (
              <div key={item.id}>
                {item.group && <div className="nav-label">{item.group}</div>}
                <button
                  className={
                    "nav-item" +
                    (view === item.id ||
                    (item.id === "courses" && view === "lesson") ||
                    (item.id === "practice" && view === "workspace")
                      ? " active"
                      : "")
                  }
                  onClick={() => go(item.id)}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  {item.id === "queue" && pending > 0 && (
                    <span className="nav-count">{pending}</span>
                  )}
                  {item.id === "notifications" && unread > 0 && (
                    <span className="nav-count">{unread}</span>
                  )}
                </button>
              </div>
            ))}
            <div className="sidebar-help">
              <LifeBuoy size={20} className="text-brand" />
              <h4>A little guidance goes a long way.</h4>
              <p>
                Find your next step, understand the process, and ask for help
                when you need it.
              </p>
              <Button variant="secondary" onClick={() => setHelp(true)}>
                Learning support <ChevronRight size={12} />
              </Button>
            </div>
          </div>
          <div className="sidebar-footer">
            <div className="row">
              <Logo src={data.branding.parentLogo} parent />
              <div>
                <strong>{data.branding.parentName}</strong>
                <span>Next Generation Business</span>
              </div>
            </div>
            <p>A Subsidiary of {data.branding.parentName}</p>
          </div>
        </aside>
        <div className="app-frame">
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="icon-btn"
                aria-label="Toggle navigation"
                onClick={() =>
                  window.innerWidth <= 760
                    ? setMobile(!mobile)
                    : setCollapsed(!collapsed)
                }
              >
                <Menu size={19} />
              </button>
              <span className="topbar-title">Your learning workspace</span>
              <div className="search-wrap">
                <Search />
                <input
                  ref={searchRef}
                  className="search-input"
                  placeholder="Search lessons, topics…"
                  aria-label="Search lessons"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="search-key">⌘ K</span>
                {search && (
                  <div className="search-results">
                    {results.length ? (
                      results.map((l) => (
                        <button
                          className="search-result"
                          key={l.id}
                          onClick={() => void openLesson(l.id)}
                        >
                          <strong>Day {l.day}</strong> · {l.title}
                          {l.locked && (
                            <span className="muted">
                              {" "}
                              · Gate {l.required_gate} required
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="small" style={{ padding: 10, margin: 0 }}>
                        No matching lessons.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="topbar-actions">
              {data.demo && (
                <details className="demo-menu">
                  <summary>
                    <Badge tone="purple">
                      Training demo <ChevronDown size={10} />
                    </Badge>
                  </summary>
                  <div className="demo-options">
                    {["student", "trainer", "admin"].map((role) => (
                      <button
                        key={role}
                        onClick={(e) => {
                          e.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                          void switchDemo(role);
                        }}
                      >
                        {role === "student"
                          ? "Learner"
                          : role === "admin"
                            ? "Management"
                            : "Trainer"}{" "}
                        workspace
                      </button>
                    ))}
                  </div>
                </details>
              )}
              <button
                className="icon-btn theme-button"
                aria-label="Toggle color theme"
                onClick={() => void theme()}
              >
                {user.preferences.theme === "dark" ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>
              <button
                className="icon-btn notification-button"
                aria-label="Open notifications"
                onClick={() => go("notifications")}
              >
                <Bell size={19} />
                {unread > 0 && <span className="notification-dot" />}
              </button>
              <button className="profile-button" onClick={() => go("settings")}>
                <div className="avatar">
                  {user.display_name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <strong>{user.display_name}</strong>
                  <small>
                    {user.role === "student"
                      ? "Learner"
                      : user.role === "admin"
                        ? "Management"
                        : user.role}
                  </small>
                </div>
                <ChevronDown size={12} className="muted" />
              </button>
            </div>
          </header>
          <main className="workspace">
            <div className="breadcrumbs">
              <span>Academy</span>
              <ChevronRight size={10} />
              <span>{label}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  view + (selectedLesson?.id ?? "") + (selectedRecord?.id ?? "")
                }
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {view === "dashboard" && <Dashboard />}
                {view === "journey" && <Journey />}
                {view === "courses" && <Courses />}
                {view === "lesson" && selectedLesson && (
                  <LessonViewer
                    lesson={selectedLesson}
                    onPresent={() => setPresentation(true)}
                    onUpdated={setSelectedLesson}
                  />
                )}
                {view === "workspace" && selectedRecord && (
                  <PracticeForm initial={selectedRecord} />
                )}
                {view === "practice" && <PracticeLab />}
                {view === "assignments" && <Assignments />}
                {view === "research" && <SubmissionList onlyForm="F02" />}
                {view === "operations" && <Operations />}
                {view === "submissions" && <SubmissionList />}
                {view === "queue" && <SubmissionList reviewMode />}
                {view === "assessments" && <Assessments />}
                {view === "performance" && <Performance />}
                {view === "resources" && <Resources />}
                {view === "notifications" && <Notifications />}
                {view === "people" && user.role === "admin" && (
                  <PeopleAndCohorts />
                )}
                {view === "settings" && <AcademySettings />}
                {view === "about" && <About />}
              </motion.div>
            </AnimatePresence>
            <footer className="workspace-footer">
              <span>
                {data.branding.name} Academy — A Subsidiary of{" "}
                {data.branding.parentName}
              </span>
              <span>
                {data.user?.synthetic ? "Synthetic training workspace · " : ""}
                Learn with purpose. Practice with confidence.
              </span>
            </footer>
          </main>
        </div>
        {toastElement}
        <Modal
          open={help}
          onClose={() => setHelp(false)}
          title="Let’s find your next step"
          description="Your trainer is here to guide your progress."
        >
          <ul className="help-list">
            <li>Start with the next available lesson on your dashboard.</li>
            <li>
              Complete the readiness checklist and the assigned practical task.
            </li>
            <li>Attach evidence and submit your work for trainer review.</li>
            <li>
              Use field-specific feedback to correct and resubmit your work.
            </li>
            <li>
              Review the SOP Library when a term or process is unfamiliar.
            </li>
          </ul>
          <div className="form-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setHelp(false);
                go("resources");
              }}
            >
              Open SOP Library
            </Button>
            <Button
              onClick={() => {
                setHelp(false);
                go("courses");
              }}
            >
              Find my lesson <ChevronRight size={15} />
            </Button>
          </div>
        </Modal>
        <Modal
          open={Boolean(parentPicker)}
          onClose={() => setParentPicker(null)}
          title="Choose the approved record"
          description="Verified fields and identifiers will flow into the next workflow."
        >
          {parentPicker?.records.map((s) => (
            <button
              key={s.id}
              className="lesson-row"
              onClick={() =>
                void openWorkspace(
                  parentPicker.key,
                  parentPicker.lesson,
                  parentPicker.assignment,
                  s.id,
                )
              }
            >
              <CheckCircle2 size={19} className="text-green" />
              <div>
                <h3>{s.title}</h3>
                <small>
                  {s.form_key} · approved · revision {s.revision}
                </small>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
        </Modal>
        {review && (
          <ReviewDialog initial={review} onClose={() => setReview(null)} />
        )}
        <PresentationMode
          lesson={selectedLesson}
          open={presentation}
          onClose={() => setPresentation(false)}
        />
      </div>
    </AcademyContext.Provider>
  );
}
