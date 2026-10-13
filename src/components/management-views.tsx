"use client";
import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  GraduationCap,
  ShieldCheck,
  Layers3,
  CalendarDays,
  Settings,
  ArrowRight,
  ChevronRight,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  Save,
  LogOut,
  Moon,
  Sun,
  FileText,
  Palette,
  Download,
  Search,
  LockKeyhole,
} from "lucide-react";
import type { Profile, Branding } from "@/lib/types";
import { forms } from "@/lib/forms";
import { gateTitles } from "@/lib/domain";
import {
  Button,
  Badge,
  Logo,
  PageHeading,
  Modal,
  Empty,
  useAcademy,
  useTask,
  api,
  post,
  dateLabel,
} from "./ui";

function localDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function PeopleAndCohorts() {
  const { data, refresh, notify } = useAcademy(),
    [tab, setTab] = useState("people"),
    [users, setUsers] = useState<Profile[]>([]),
    [search, setSearch] = useState(""),
    [invite, setInvite] = useState(false),
    [cohortModal, setCohortModal] = useState(false),
    [paymentModal, setPaymentModal] = useState(false),
    [gateModal, setGateModal] = useState(false),
    [manage, setManage] = useState<Profile | null>(null),
    [credential, setCredential] = useState<{
      email: string;
      password: string;
    } | null>(null),
    [confirmAccess, setConfirmAccess] = useState(false),
    [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [role, setRole] = useState<Profile["role"]>("student"),
    [cohort, setCohort] = useState(data.cohorts[0]?.id ?? ""),
    [startDate, setStartDate] = useState(localDate()),
    [cohortName, setCohortName] = useState(""),
    [trainer, setTrainer] = useState(""),
    [student, setStudent] = useState(data.students[0]?.id ?? ""),
    [amount, setAmount] = useState("20000"),
    [reference, setReference] = useState(""),
    [verified, setVerified] = useState(false),
    [gate, setGate] = useState(1),
    [reason, setReason] = useState(""),
    task = useTask();
  async function loadUsers() {
    setUsers(await api<Profile[]>("users"));
  }
  useEffect(() => {
    void loadUsers().catch((error) => notify((error as Error).message, true));
  }, [notify]);
  const list = users.filter((u) =>
    (u.display_name + " " + u.email + " " + u.role)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  async function saved() {
    await refresh();
    await loadUsers();
  }
  return (
    <>
      <PageHeading
        eyebrow="MANAGEMENT WORKSPACE"
        title="People are the heart of your academy."
        description="Manage enrollments, trainer allocations, cohorts and auditable administrative records."
        action={
          <Button onClick={() => setInvite(true)}>
            <Plus size={14} />
            Add academy user
          </Button>
        }
      />
      <div className="page-tabs">
        {[
          ["people", "People"],
          ["cohorts", "Cohorts"],
          ["payments", "Enrollment & payments"],
          ["progression", "Progression controls"],
          ["audit", "Audit history"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={"tab " + (tab === id ? "active" : "")}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "people" && (
        <>
          <div className="list-toolbar">
            <input
              aria-label="Search academy users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a learner, trainer or manager…"
            />
            <Badge>{users.length} academy accounts</Badge>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Role</th>
                    <th>Cohort</th>
                    <th>Account status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="row">
                          <span className="avatar avatar-sm">
                            {u.display_name
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div>
                            <strong>{u.display_name}</strong>
                            <small>{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          tone={
                            u.role === "student"
                              ? "blue"
                              : u.role === "trainer"
                                ? "purple"
                                : "neutral"
                          }
                        >
                          {u.role === "student" ? "Learner" : u.role}
                        </Badge>
                      </td>
                      <td>
                        {data.students.find((s) => s.id === u.id)
                          ?.cohort_name ?? "Trainer / management allocation"}
                      </td>
                      <td>
                        <Badge tone={u.enabled ? "green" : "neutral"}>
                          {u.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setManage(u);
                            setRole(u.role);
                            setCohort("");
                          }}
                        >
                          Manage access
                          <ChevronRight size={12} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {tab === "cohorts" && (
        <>
          <div className="between" style={{ marginBottom: 23 }}>
            <p className="small mb-0">
              Allocate trainers and learners to a structured training batch.
            </p>
            <Button onClick={() => setCohortModal(true)}>
              <Plus size={14} />
              Create cohort
            </Button>
          </div>
          <div className="grid-3">
            {data.cohorts.map((c) => {
              const learners = data.students.filter(
                  (s) => s.cohort_name === c.name,
                ),
                progress = learners.length
                  ? learners.reduce(
                      (sum, s) => sum + (s.completed / 45) * 100,
                      0,
                    ) / learners.length
                  : 0;
              return (
                <article className="card" key={c.id}>
                  <span className="task-icon">
                    <Layers3 size={20} />
                  </span>
                  <h3 className="mt-20">{c.name}</h3>
                  <div className="small muted">
                    Starts{" "}
                    {new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "Asia/Karachi",
                    }).format(new Date(c.start_date))}
                  </div>
                  <div className="between mt-20">
                    <span className="small">
                      {learners.length} enrolled learners
                    </span>
                    <Badge tone="green">{c.status}</Badge>
                  </div>
                  <div className="mini-progress">
                    <span style={{ width: progress + "%" }} />
                  </div>
                  <div className="between mt-20">
                    <small>
                      {progress.toFixed(1)}% average approved progress
                    </small>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCohort(c.id);
                        setInvite(true);
                      }}
                    >
                      Add learner
                      <Plus size={12} />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
      {tab === "payments" && (
        <>
          <div className="notice notice-amber">
            <strong>Manual administrative records</strong>
            <p>
              Proposed course fee: PKR {data.branding.fee.toLocaleString()}.
              Enrollment: PKR {data.branding.enrollmentFee.toLocaleString()};
              remaining PKR {data.branding.balance.toLocaleString()} after 30
              days. These entries do not establish confirmed bank payments.
            </p>
          </div>
          <div className="between mt-28" style={{ marginBottom: 20 }}>
            <h2 className="mb-0">Enrollment & fee records</h2>
            <Button onClick={() => setPaymentModal(true)}>
              <Plus size={14} />
              Record a payment
            </Button>
          </div>
          <div className="card">
            {data.students.map((s) => {
              const records = data.payments.filter(
                  (p) => p.student_id === s.id,
                ),
                recorded = records.reduce(
                  (sum, p) => sum + Number(p.amount),
                  0,
                ),
                verifiedAmount = records
                  .filter((p) => p.verified)
                  .reduce((sum, p) => sum + Number(p.amount), 0);
              return (
                <div className="payment-row" key={s.id}>
                  <div>
                    <strong>{s.display_name}</strong>
                    <p>
                      {s.cohort_name} · {records.length} manual records
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>PKR {recorded.toLocaleString()} recorded</strong>
                    <p>
                      PKR {verifiedAmount.toLocaleString()} manually marked
                      verified · balance depends on bank verification
                    </p>
                  </div>
                </div>
              );
            })}
            {data.payments.map((p) => (
              <div className="payment-row" key={p.id}>
                <div>
                  <strong>{p.reference}</strong>
                  <p>
                    {
                      data.students.find((s) => s.id === p.student_id)
                        ?.display_name
                    }{" "}
                    · {dateLabel(p.created_at)}
                  </p>
                </div>
                <div className="row">
                  <strong>PKR {Number(p.amount).toLocaleString()}</strong>
                  <Badge tone={p.verified ? "green" : "amber"}>
                    {p.verified ? "Manually verified" : "Verification pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === "progression" && (
        <>
          <div className="notice notice-amber">
            <strong>Audited management exceptions</strong>
            <p>
              Operational gates normally follow evidence and trainer approval. A
              management override requires a documented reason. Final
              certification cannot be granted here or bypass critical failures.
            </p>
          </div>
          <div className="card mt-28">
            <h2>Review learner progression</h2>
            {data.students.map((s) => (
              <div className="roster-row" key={s.id}>
                <span className="avatar avatar-sm">
                  {s.display_name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="roster-name">
                  <strong>{s.display_name}</strong>
                  <small>
                    {s.completed}/45 lessons approved · {s.pending} pending
                    reviews
                  </small>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStudent(s.id);
                    setReason("");
                    setGateModal(true);
                  }}
                >
                  Review progression
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === "audit" && (
        <div className="card">
          <h2>Recorded decisions & changes</h2>
          {data.audit.length ? (
            data.audit.map((a) => (
              <div className="audit-row" key={a.id}>
                <div className="between">
                  <strong>
                    {a.action.replaceAll(".", " · ").replaceAll("_", " ")}
                  </strong>
                  <small>{dateLabel(a.created_at)}</small>
                </div>
                <p className="small mb-0">
                  {a.actor_name} · {JSON.stringify(a.details)}
                </p>
              </div>
            ))
          ) : (
            <Empty
              title="Your audit history starts here"
              description="Invitations, reviews, financial records, curriculum edits and progression decisions are recorded automatically."
            />
          )}
        </div>
      )}
      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Add an academy account"
        description="Role and cohort access are assigned by management on the server."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void task.run(async () => {
              const result = await post<{
                profile: Profile;
                temporaryPassword: string | null;
                message: string;
              }>("users", { email, name, role, cohortId: cohort || undefined });
              await saved();
              setInvite(false);
              setEmail("");
              setName("");
              if (result.temporaryPassword)
                setCredential({
                  email: result.profile.email,
                  password: result.temporaryPassword,
                });
              notify(result.message);
            });
          }}
        >
          <div className="form-grid">
            <label className="span-2">
              <span className="field-label">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="span-2">
              <span className="field-label">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              <span className="field-label">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Profile["role"])}
              >
                {["student", "trainer", "admin", "auditor"].map((r) => (
                  <option key={r} value={r}>
                    {r === "student"
                      ? "Learner"
                      : r === "admin"
                        ? "Management"
                        : r}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Cohort allocation</span>
              <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
              >
                <option value="">Allocate later</option>
                {data.cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setInvite(false)}
            >
              Cancel
            </Button>
            <Button busy={task.busy}>Create account</Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={cohortModal}
        onClose={() => setCohortModal(false)}
        title="Create a training cohort"
        description="Set the start date and assign a trainer."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void task.run(async () => {
              await post("cohorts", {
                name: cohortName,
                startDate,
                trainerId: trainer || undefined,
              });
              await saved();
              setCohortModal(false);
              notify("Cohort created with its trainer allocation.");
            });
          }}
        >
          <label>
            <span className="field-label">Cohort name</span>
            <input
              value={cohortName}
              onChange={(e) => setCohortName(e.target.value)}
              required
            />
          </label>
          <label className="mt-20">
            <span className="field-label">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label className="mt-20">
            <span className="field-label">Assigned trainer</span>
            <select
              value={trainer}
              onChange={(e) => setTrainer(e.target.value)}
            >
              <option value="">Allocate later</option>
              {users
                .filter((u) => u.role === "trainer" && u.enabled)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name}
                  </option>
                ))}
            </select>
          </label>
          <div className="form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setCohortModal(false)}
            >
              Cancel
            </Button>
            <Button busy={task.busy}>Create cohort</Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(manage)}
        onClose={() => setManage(null)}
        title={"Manage " + (manage?.display_name ?? "account")}
        description="Every access change is recorded. Disabled users cannot continue authenticated sessions."
      >
        {manage && (
          <>
            <label>
              <span className="field-label">Account role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Profile["role"])}
              >
                {["student", "trainer", "admin", "auditor"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-20">
              <span className="field-label">Add cohort allocation</span>
              <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
              >
                <option value="">Keep existing allocations</option>
                {data.cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <Button
                variant="secondary"
                busy={task.busy}
                onClick={() =>
                  void task.run(async () => {
                    const r = await api<{ temporaryPassword: string }>(
                      "users/" + manage.id,
                      {
                        method: "PATCH",
                        body: JSON.stringify({ resetPassword: true }),
                      },
                    );
                    setCredential({
                      email: manage.email,
                      password: r.temporaryPassword,
                    });
                    notify(
                      "New password generated. Previous sessions have been invalidated.",
                    );
                  })
                }
              >
                <LockKeyhole size={13} />
                Reset local password
              </Button>
              <Button
                busy={task.busy}
                onClick={() =>
                  void task.run(async () => {
                    await api("users/" + manage.id, {
                      method: "PATCH",
                      body: JSON.stringify({
                        role,
                        cohortId: cohort || undefined,
                      }),
                    });
                    await saved();
                    setManage(null);
                    notify("Access settings saved.");
                  })
                }
              >
                Save access
              </Button>
            </div>
            <div className="mt-20">
              <Button
                variant={manage.enabled ? "danger" : "secondary"}
                onClick={() => setConfirmAccess(true)}
              >
                {manage.enabled ? "Disable" : "Enable"} account
              </Button>
            </div>
          </>
        )}
      </Modal>
      <Modal
        open={confirmAccess}
        onClose={() => setConfirmAccess(false)}
        title={
          manage?.enabled ? "Disable this account?" : "Enable this account?"
        }
        description="This changes the person’s access to the academy."
      >
        <p className="small">
          {manage?.enabled
            ? "Existing local sessions will be revoked. The person’s work and history are preserved."
            : "The account can sign in again with its assigned role and cohort permissions."}
        </p>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => setConfirmAccess(false)}>
            Cancel
          </Button>
          <Button
            variant={manage?.enabled ? "danger" : "primary"}
            busy={task.busy}
            onClick={() =>
              void task.run(async () => {
                await api("users/" + manage!.id, {
                  method: "PATCH",
                  body: JSON.stringify({ enabled: !manage!.enabled }),
                });
                setConfirmAccess(false);
                setManage(null);
                await saved();
                notify("Account access updated.");
              })
            }
          >
            Confirm access change
          </Button>
        </div>
      </Modal>
      <Modal
        open={Boolean(credential)}
        onClose={() => setCredential(null)}
        title="Share these credentials securely"
        description="This generated password is displayed only at creation or reset."
      >
        {credential && (
          <>
            <div className="notice notice-amber">
              Do not share this password in a public message or commit it to
              source control.
            </div>
            <label className="mt-20">
              <span className="field-label">Email address</span>
              <input readOnly value={credential.email} />
            </label>
            <label className="mt-20">
              <span className="field-label">Generated password</span>
              <input readOnly type="password" value={credential.password} />
            </label>
            <div className="form-actions">
              <Button
                variant="secondary"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(credential.email + "\n" + credential.password)
                    .then(() =>
                      notify("Credentials copied. Share them securely."),
                    )
                    .catch(() =>
                      notify(
                        "Clipboard access is unavailable. Use the local account record securely.",
                        true,
                      ),
                    )
                }
              >
                <Copy size={13} />
                Copy credentials
              </Button>
              <Button onClick={() => setCredential(null)}>Done</Button>
            </div>
          </>
        )}
      </Modal>
      <Modal
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Record a manual payment"
        description="This is an administrative entry, not an automated bank confirmation."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void task.run(async () => {
              await post("payments", {
                studentId: student,
                amount: Number(amount),
                reference,
                verified,
              });
              await refresh();
              setPaymentModal(false);
              notify(
                "Manual payment record saved with its verification status.",
              );
            });
          }}
        >
          <label>
            <span className="field-label">Learner</span>
            <select
              value={student}
              onChange={(e) => setStudent(e.target.value)}
              required
            >
              {data.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-20">
            <span className="field-label">Amount · PKR</span>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="mt-20">
            <span className="field-label">
              Reference and verification notes
            </span>
            <textarea
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
            />
            <span>
              I have separately checked the bank evidence and authorize this
              manual verification mark.
            </span>
          </label>
          <div className="form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button busy={task.busy}>Record manual entry</Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={gateModal}
        onClose={() => setGateModal(false)}
        title="Record a management progression exception"
        description="Final certification cannot be issued through an override."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void task.run(async () => {
              await post("gates", { studentId: student, gate, reason });
              await refresh();
              setGateModal(false);
              notify(
                "Management override recorded with its reason and audit trail.",
              );
            });
          }}
        >
          <label>
            <span className="field-label">Learner</span>
            <select
              value={student}
              onChange={(e) => setStudent(e.target.value)}
            >
              {data.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-20">
            <span className="field-label">Competency gate</span>
            <select
              value={gate}
              onChange={(e) => setGate(Number(e.target.value))}
            >
              {gateTitles.slice(0, 6).map((title, i) => (
                <option key={title} value={i + 1}>
                  Gate {i + 1} · {title}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-20">
            <span className="field-label">
              Documented reason and supporting evidence
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={20}
              required
            />
          </label>
          <label className="check-label">
            <input type="checkbox" required />
            <span>
              I confirm this is an authorized management exception and it must
              be recorded in the audit history.
            </span>
          </label>
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setGateModal(false)}
            >
              Cancel
            </Button>
            <Button busy={task.busy}>Record audited exception</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
export function AcademySettings() {
  const { data, refresh, notify, openLesson, go } = useAcademy(),
    [tab, setTab] = useState("profile"),
    [name, setName] = useState(data.user!.display_name),
    [theme, setTheme] = useState(
      data.user!.preferences.theme === "dark" ? "dark" : "light",
    ),
    [settings, setSettings] = useState<Branding>(data.branding),
    [resourceTitle, setResourceTitle] = useState(""),
    [oldPassword, setOldPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    task = useTask(),
    admin = data.user!.role === "admin";
  const tabs = [
    ["profile", "Your profile"],
    ["security", "Account security"],
    ...(admin
      ? [
          ["branding", "Brand identity"],
          ["evaluation", "Fees & evaluation"],
          ["curriculum", "Curriculum"],
          ["files", "Training files"],
        ]
      : []),
  ];
  function update(key: keyof Branding, value: unknown) {
    setSettings((s) => ({ ...s, [key]: value }));
  }
  async function saveSettings() {
    await api("branding", { method: "PUT", body: JSON.stringify(settings) });
    await refresh();
    notify(
      "Academy settings saved. The shared theme is updated across your workspace.",
    );
  }
  async function uploadLogo(file: File, kind: string) {
    const form = new FormData();
    form.set("file", file);
    form.set("kind", kind);
    await api("uploads", { method: "POST", body: form });
    await refresh();
    notify("Official logo uploaded. Shared branding is updated.");
  }
  return (
    <>
      <PageHeading
        title="Make your workspace yours."
        description="Your profile preferences are private. Organization settings are controlled by management."
      />
      <div className="settings-grid">
        <nav className="settings-tabs" aria-label="Settings sections">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <section className="card">
          {tab === "profile" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void task.run(async () => {
                  await api("profile", {
                    method: "PATCH",
                    body: JSON.stringify({ displayName: name, theme }),
                  });
                  await refresh();
                  notify("Profile and display preference saved.");
                });
              }}
            >
              <div className="row" style={{ marginBottom: 28 }}>
                <div
                  className="avatar"
                  style={{ width: 58, height: 58, fontSize: 20 }}
                >
                  {name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <h3 className="mb-0">{data.user!.display_name}</h3>
                  <small>
                    {data.user!.role} · {data.user!.email}
                  </small>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  <span className="field-label">Display name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span className="field-label">Email address</span>
                  <input readOnly value={data.user!.email} />
                </label>
                <label>
                  <span className="field-label">Appearance</span>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="light">Light workspace</option>
                    <option value="dark">Dark workspace</option>
                  </select>
                </label>
                <label>
                  <span className="field-label">Assigned role</span>
                  <input readOnly value={data.user!.role} />
                </label>
              </div>
              <div className="form-actions">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    void task.run(async () => {
                      await post("auth/logout", {});
                      await refresh();
                      notify("Signed out securely.");
                    })
                  }
                >
                  <LogOut size={13} />
                  Sign out
                </Button>
                <Button busy={task.busy}>
                  <Save size={13} />
                  Save profile
                </Button>
              </div>
            </form>
          )}
          {tab === "security" && (
            <>
              <h2>Your account, protected.</h2>
              <div className="notice">
                Your role is verified on the server. Learner records, private
                evidence and review controls are scoped to authorized accounts
                and cohorts.
              </div>
              <h3 className="mt-28">Change your password</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void task.run(async () => {
                    await post("auth/password", { oldPassword, newPassword });
                    setOldPassword("");
                    setNewPassword("");
                    notify(
                      "Password changed. Other local sessions have been revoked.",
                    );
                  });
                }}
              >
                <label>
                  <span className="field-label">Current password</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </label>
                <label className="mt-20">
                  <span className="field-label">
                    New password · at least 12 characters
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </label>
                <div className="form-actions">
                  <span className="small muted">
                    Share credentials through a secure channel.
                  </span>
                  <Button busy={task.busy}>Change password</Button>
                </div>
              </form>
            </>
          )}
          {tab === "branding" && admin && (
            <>
              <h2>One identity, everywhere.</h2>
              <p className="small">
                Upload the original Dr. Commerce and NGB Consultancy assets.
                Placeholders are not official logos.
              </p>
              {[
                ["logo", "Dr. Commerce logo"],
                ["parentLogo", "NGB Consultancy logo"],
              ].map(([key, label]) => (
                <div className="logo-upload-row" key={key}>
                  <Logo
                    src={data.branding[key as "logo" | "parentLogo"]}
                    parent={key === "parentLogo"}
                  />
                  <label style={{ flex: 1 }}>
                    <span className="field-label">{label}</span>
                    <input
                      type="file"
                      aria-label={label + " upload"}
                      accept="image/png,image/jpeg,image/webp"
                      disabled={task.busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void task.run(() => uploadLogo(f, key));
                        e.target.value = "";
                      }}
                    />
                    <small>PNG, JPEG or WebP · up to 5 MB</small>
                  </label>
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void task.run(saveSettings);
                }}
              >
                <div className="form-grid mt-28">
                  <label>
                    <span className="field-label">Training brand</span>
                    <input
                      value={settings.name}
                      onChange={(e) => update("name", e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <span className="field-label">Parent organization</span>
                    <input
                      value={settings.parentName}
                      onChange={(e) => update("parentName", e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <span className="field-label">Primary blue</span>
                    <div className="color-field">
                      <input
                        type="color"
                        value={settings.primary}
                        onChange={(e) => update("primary", e.target.value)}
                      />
                      <input
                        value={settings.primary}
                        onChange={(e) => update("primary", e.target.value)}
                      />
                    </div>
                  </label>
                  <label>
                    <span className="field-label">Secondary brand color</span>
                    <div className="color-field">
                      <input
                        type="color"
                        value={settings.secondary}
                        onChange={(e) => update("secondary", e.target.value)}
                      />
                      <input
                        value={settings.secondary}
                        onChange={(e) => update("secondary", e.target.value)}
                      />
                    </div>
                  </label>
                  <label className="span-2">
                    <span className="field-label">Typography</span>
                    <select
                      value={settings.font}
                      onChange={(e) => update("font", e.target.value)}
                    >
                      {[
                        "Inter, ui-sans-serif, system-ui, sans-serif",
                        "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif",
                        "system-ui, sans-serif",
                      ].map((f) => (
                        <option key={f} value={f}>
                          {f.split(",")[0]}
                        </option>
                      ))}
                    </select>
                    <small>
                      Uploaded/self-hosted fonts can be added at deployment. The
                      current workspace uses installed system fallbacks.
                    </small>
                  </label>
                </div>
                <div className="form-actions">
                  <span className="small muted">
                    Shared across login, lessons, dashboards and reports.
                  </span>
                  <Button busy={task.busy}>Save brand identity</Button>
                </div>
              </form>
            </>
          )}
          {tab === "evaluation" && admin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void task.run(saveSettings);
              }}
            >
              <h2>Fees and competency standards</h2>
              <div className="notice notice-amber">
                Course payments are manual administrative records in this
                release. Fee proposals and bank verification are distinct.
              </div>
              <div className="form-grid mt-28">
                {[
                  ["fee", "Proposed total fee · PKR"],
                  ["enrollmentFee", "Enrollment payment · PKR"],
                  ["balance", "Remaining after 30 days · PKR"],
                  ["passMark", "Assessment pass mark %"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <span className="field-label">{label}</span>
                    <input
                      type="number"
                      min="0"
                      max={key === "passMark" ? 100 : undefined}
                      value={String(settings[key as keyof Branding])}
                      onChange={(e) =>
                        update(key as keyof Branding, Number(e.target.value))
                      }
                    />
                  </label>
                ))}
              </div>
              <h3 className="mt-28">Final assessment weights</h3>
              <p className="small">
                Dr. Commerce Recommendation. Weights must total 100%; a critical
                operational failure always blocks certification.
              </p>
              {Object.entries(settings.weights).map(([key, value]) => (
                <label className="grading-row" key={key}>
                  <span>
                    {forms.find((f) => f.key === key)?.short ?? key}
                    {key === "F10" ? " / tracking" : ""}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        weights: {
                          ...s.weights,
                          [key]: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </label>
              ))}
              <div className="form-actions">
                <strong className="small">
                  Total:{" "}
                  {Object.values(settings.weights).reduce((a, b) => a + b, 0)}%
                </strong>
                <Button busy={task.busy}>Save evaluation settings</Button>
              </div>
            </form>
          )}
          {tab === "curriculum" && admin && (
            <>
              <h2>Your editable 45-day curriculum</h2>
              <p className="small">
                Open any lesson, edit its learner content and instructor-only
                script, and retain a document version history.
              </p>
              <div className="lesson-list">
                {data.lessons.map((l) => (
                  <button
                    className="lesson-row"
                    key={l.id}
                    onClick={() => void openLesson(l.id)}
                  >
                    <span className="day-number">
                      <small>DAY</small>
                      {String(l.day).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{l.title}</h3>
                      <p>
                        Version {l.version} · {l.form_key}
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                  </button>
                ))}
              </div>
            </>
          )}
          {tab === "files" && admin && (
            <>
              <h2>Training files & evidence classification</h2>
              <p className="small">
                Add real teaching files. Missing screenshots and videos remain
                labeled placeholders until uploaded and verified.
              </p>
              <label>
                <span className="field-label">Resource title</span>
                <input
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Name this learning resource"
                />
              </label>
              <label
                className="upload-box"
                style={{ display: "block", marginTop: 20 }}
              >
                <UploadCloud size={27} />
                <strong className="small">Upload a teaching file</strong>
                <p>PNG, JPEG, WebP, PDF or plain text · up to 10 MB</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                  disabled={task.busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      void task.run(async () => {
                        if (resourceTitle.trim().length < 3)
                          throw new Error(
                            "Name the resource before uploading.",
                          );
                        const form = new FormData();
                        form.set("file", f);
                        form.set("kind", "resource");
                        form.set("title", resourceTitle);
                        form.set("classification", "pending");
                        await api("uploads", { method: "POST", body: form });
                        await refresh();
                        notify(
                          "Training file uploaded as pending verification.",
                        );
                        setResourceTitle("");
                      });
                    e.target.value = "";
                  }}
                />
              </label>
              <Button
                variant="secondary"
                className="mt-20"
                onClick={() => go("resources")}
              >
                Manage resource links & guidance
                <ArrowRight size={13} />
              </Button>
            </>
          )}
        </section>
      </div>
    </>
  );
}
