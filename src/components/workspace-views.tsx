"use client";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ArrowRight,
  ChevronRight,
  Check,
  Lock,
  Clock3,
  Play,
  ClipboardCheck,
  FileSearch,
  TrendingUp,
  Send,
  MessageSquare,
  FlaskConical,
  GraduationCap,
  Layers3,
  ShieldCheck,
  Presentation,
  Users,
  Download,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Bell,
  FileText,
  FolderOpen,
  Link2,
  Trophy,
  CheckCheck,
  Search,
  Route as RouteIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  Bootstrap,
  Lesson,
  Resource,
  Submission,
  Profile,
} from "@/lib/types";
import { forms, getForm } from "@/lib/forms";
import { gateTitles } from "@/lib/domain";
import { platforms } from "@/lib/curriculum";
import {
  Button,
  Badge,
  Ring,
  Empty,
  PageHeading,
  StatusBadge,
  EvidenceBadge,
  Modal,
  ExternalLink,
  useAcademy,
  useTask,
  api,
  post,
  dateLabel,
} from "./ui";
import { HeroArt } from "./login";
import { CalculatorPanel } from "./practice-form";

export function nextLesson(data: Bootstrap) {
  return data.lessons.find((l) => !l.completed && !l.locked);
}
function currentModule(data: Bootstrap) {
  const l = nextLesson(data);
  return data.modules.find((m) => m.id === l?.module_id);
}
function stageStatus(data: Bootstrap, id: string) {
  const lessons = data.lessons.filter((l) => l.module_id === id);
  if (lessons.length && lessons.every((l) => l.completed)) return "complete";
  if (currentModule(data)?.id === id) return "current";
  if (lessons.every((l) => l.locked)) return "locked";
  return "ready";
}
function Stat({
  label,
  value,
  note,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof BookOpen;
  tone?: string;
}) {
  return (
    <div className="stat-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <span className={"stat-icon " + tone}>
        <Icon />
      </span>
    </div>
  );
}
export function Dashboard() {
  const { data, go, openLesson, openWorkspace, openRecord } = useAcademy(),
    u = data.user!,
    learner = u.role === "student",
    trainer = u.role === "trainer" || u.role === "auditor",
    current = learner
      ? nextLesson(data)
      : data.lessons.find((l) => l.day === 8),
    completed = data.lessons.filter((l) => l.completed).length,
    progress = (completed / 45) * 100,
    roster = data.students,
    score = roster.find((s) => s.id === u.id)?.score,
    pending = data.submissions.filter((s) => s.status === "submitted"),
    latestFeedback = data.notifications.find((n) => n.submission_id),
    tasks = data.assignments
      .filter((a) => a.lesson_id === current?.id)
      .slice(0, 2);
  return (
    <>
      <PageHeading
        title={
          learner
            ? `Welcome back, ${u.display_name.split(" ")[0]}.`
            : `Welcome back, ${trainer ? u.display_name.split(" ")[0] : "team"}.`
        }
        description={
          learner
            ? "Every step you take brings you closer to your next opportunity."
            : trainer
              ? "Guide your learners, review their work, and help them move forward."
              : "A clear view of your people, progress and academy operations."
        }
        action={
          <Badge tone="blue">
            {learner
              ? (data.cohorts[0]?.name ?? "Enrollment pending")
              : trainer
                ? "Trainer workspace"
                : "Management workspace"}
          </Badge>
        }
      />
      <div className="hero-grid">
        <section className="welcome-card">
          <div>
            <p className="eyebrow">
              {learner
                ? "YOUR JOURNEY, ONE STEP AT A TIME"
                : trainer
                  ? "MAKE EVERY LESSON COUNT"
                  : "BUILDING THE NEXT GENERATION"}
            </p>
            <h2>
              {learner ? (
                <>
                  Build skills.
                  <br />
                  Make your next move.
                </>
              ) : trainer ? (
                <>
                  Teach with purpose.
                  <br />
                  Turn learning into capability.
                </>
              ) : (
                <>
                  Great training.
                  <br />
                  Measurable progress.
                </>
              )}
            </h2>
            <p>
              {learner
                ? "Your hands-on commerce journey continues. Learn the process, put it into practice, and grow with expert guidance."
                : trainer
                  ? "Bring the operating methodology to life with structured lessons, practical tasks, and meaningful feedback."
                  : "Connect your curriculum, cohorts and approvals in one supervised learning environment."}
            </p>
            <div className="row wrap">
              <Button
                onClick={() =>
                  learner
                    ? current
                      ? void openLesson(current.id)
                      : go("submissions")
                    : u.role === "auditor"
                      ? go("queue")
                      : trainer
                        ? current
                          ? void openLesson(current.id, true)
                          : go("courses")
                        : go("people")
                }
              >
                {learner
                  ? "Continue Training"
                  : u.role === "auditor"
                    ? "Review learner evidence"
                    : trainer
                      ? "Start Teaching"
                      : "Manage your academy"}
                <ArrowRight size={14} />
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  go(learner ? "practice" : trainer ? "queue" : "performance")
                }
              >
                {learner
                  ? "Open Practice Lab"
                  : trainer
                    ? "Review submissions"
                    : "View performance"}
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>
          <HeroArt />
        </section>
        <section className="card progress-card">
          <h3>
            {learner
              ? "Your learning journey"
              : trainer
                ? "Your classroom at a glance"
                : "Academy completion"}
          </h3>
          <div className="progress-summary">
            <Ring
              value={
                learner
                  ? progress
                  : roster.length
                    ? roster.reduce((s, r) => s + (r.completed / 45) * 100, 0) /
                      roster.length
                    : 0
              }
            />
            <div>
              <strong>
                {learner
                  ? `Day ${String(current?.day ?? 45).padStart(2, "0")}`
                  : roster.length}
                <p>
                  {learner
                    ? "of your 45-day program"
                    : trainer
                      ? "assigned learners"
                      : "enrolled learners"}
                </p>
              </strong>
            </div>
          </div>
          <div className="card-note">
            <CheckCircle2 size={13} className="text-green" />
            {learner
              ? `${completed} lessons approved. Keep moving forward.`
              : "Progress reflects approved practical work."}
          </div>
        </section>
      </div>
      <div className="stat-grid">
        {learner ? (
          <>
            <Stat
              label="Course progress"
              value={`${Math.round(progress)}%`}
              note="Approved learning milestones"
              icon={TrendingUp}
            />
            <Stat
              label="Lessons completed"
              value={`${completed} / 45`}
              note="Evidence reviewed by your trainer"
              icon={BookOpen}
              tone="green"
            />
            <Stat
              label="Pending reviews"
              value={pending.length}
              note="Awaiting trainer feedback"
              icon={ClipboardCheck}
              tone="amber"
            />
            <Stat
              label="Assessment score"
              value={score === null || score === undefined ? "—" : `${score}%`}
              note={
                score === null || score === undefined
                  ? "Your first evaluation is ahead"
                  : "Based on trainer-reviewed work"
              }
              icon={GraduationCap}
              tone="purple"
            />
          </>
        ) : (
          <>
            <Stat
              label={trainer ? "Assigned learners" : "Enrolled learners"}
              value={roster.length}
              note="Within your authorized cohorts"
              icon={Users}
            />
            <Stat
              label="Active cohorts"
              value={data.cohorts.length}
              note="Connected to your training program"
              icon={Layers3}
              tone="green"
            />
            <Stat
              label="Pending approvals"
              value={pending.length}
              note="Ready for your review"
              icon={ClipboardCheck}
              tone="amber"
            />
            <Stat
              label="Approved submissions"
              value={
                data.submissions.filter((s) => s.status === "approved").length
              }
              note="Evidence and feedback retained"
              icon={ShieldCheck}
              tone="purple"
            />
          </>
        )}
      </div>
      <div className="dashboard-main">
        <div className="stack">
          <section className="card">
            <div className="card-heading">
              <h2>
                {learner
                  ? "Pick up where you left off"
                  : trainer
                    ? "Your next classroom session"
                    : "Academy learning program"}
              </h2>
              <button onClick={() => go("courses")}>
                All lessons{" "}
                <ArrowUpRight
                  size={12}
                  style={{ display: "inline", marginLeft: 4 }}
                />
              </button>
            </div>
            {current ? (
              <div className="current-lesson">
                <div className="lesson-art">
                  <FileSearch />
                  <Badge tone="blue">
                    {learner ? "CURRENT LESSON" : "TEACHING SESSION"}
                  </Badge>
                </div>
                <div className="lesson-info">
                  <p className="eyebrow">
                    DAY {String(current.day).padStart(2, "0")} ·{" "}
                    {getForm(current.form_key).short}
                  </p>
                  <h3>{current.title}</h3>
                  <p>{current.objective}</p>
                  <div className="lesson-meta">
                    <span>
                      <Clock3 />
                      {current.minutes} min
                    </span>
                    <span>
                      <Layers3 />
                      Lesson + practical task
                    </span>
                  </div>
                  <div className="row">
                    <Button onClick={() => void openLesson(current.id)}>
                      {learner ? "Continue lesson" : "Open lesson"}
                      <ArrowRight size={13} />
                    </Button>
                    {!learner && (
                      <Button
                        variant="secondary"
                        onClick={() => void openLesson(current.id, true)}
                      >
                        <Presentation size={13} />
                        Presentation Mode
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Empty
                title="Your next step needs trainer approval"
                description="Review your submissions and any correction notes. The next competency stage unlocks when its evidence is approved."
              >
                <Button onClick={() => go("submissions")}>
                  Open my submissions
                </Button>
              </Empty>
            )}
          </section>
          <section className="card">
            <div className="card-heading">
              <h2>
                {learner
                  ? "Your focus for today"
                  : trainer
                    ? "The approval desk"
                    : "People & progression"}
              </h2>
              <button
                onClick={() =>
                  go(learner ? "assignments" : trainer ? "queue" : "people")
                }
              >
                {learner
                  ? "View assignments"
                  : trainer
                    ? "Open queue"
                    : "Open management"}
                <ArrowUpRight
                  size={12}
                  style={{ display: "inline", marginLeft: 4 }}
                />
              </button>
            </div>
            {learner ? (
              <>
                {tasks.map((a) => (
                  <div className="task-row" key={a.id}>
                    <span className="task-icon">
                      <ClipboardCheck />
                    </span>
                    <div className="task-copy">
                      <h4>{a.title}</h4>
                      <p>
                        {a.due_at
                          ? "Due " + dateLabel(a.due_at)
                          : "Self-paced practice"}{" "}
                        · {a.required_evidence.slice(0, 48)}…
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void openWorkspace(a.form_key, a.lesson_id, a.id)
                      }
                    >
                      Start task
                      <ChevronRight size={12} />
                    </Button>
                  </div>
                ))}
                <div className="task-row">
                  <span
                    className="task-icon"
                    style={{ color: "#9a7ac7", background: "#f2effc" }}
                  >
                    <FlaskConical />
                  </span>
                  <div className="task-copy">
                    <h4>Build confidence through practice</h4>
                    <p>50 research exercises, from beginner to advanced.</p>
                  </div>
                  <Button variant="secondary" onClick={() => go("practice")}>
                    Explore lab
                    <ChevronRight size={12} />
                  </Button>
                </div>
              </>
            ) : pending.length ? (
              pending.slice(0, 3).map((s) => (
                <div className="task-row" key={s.id}>
                  <span className="task-icon">
                    <FileSearch />
                  </span>
                  <div className="task-copy">
                    <h4>{s.title}</h4>
                    <p>
                      {s.student_name} · {getForm(s.form_key).short}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => void openRecord(s.id)}
                  >
                    Review
                    <ChevronRight size={12} />
                  </Button>
                </div>
              ))
            ) : (
              <Empty
                title={
                  trainer ? "A clear review queue" : "Your academy is connected"
                }
                description={
                  trainer
                    ? "New learner submissions will appear here with their evidence, revision history and rubric."
                    : "Open People & Cohorts to enroll learners, allocate trainers and record administrative payments."
                }
              >
                <Button
                  variant="secondary"
                  onClick={() => go(trainer ? "courses" : "people")}
                >
                  {trainer ? "Prepare a lesson" : "Manage cohorts"}
                </Button>
              </Empty>
            )}
          </section>
        </div>
        <aside>
          <section className="card roadmap-mini">
            <div className="card-heading">
              <h2>{learner ? "Your training roadmap" : "Program stages"}</h2>
              <button onClick={() => go(learner ? "journey" : "courses")}>
                View all
              </button>
            </div>
            {data.modules
              .filter((m) => m.stage > 0)
              .slice(0, 7)
              .map((m) => {
                const status = learner ? stageStatus(data, m.id) : "ready";
                return (
                  <button
                    className="roadmap-step"
                    key={m.id}
                    onClick={() =>
                      void openLesson(
                        data.lessons.find((l) => l.module_id === m.id)!.id,
                      )
                    }
                  >
                    <span className={"step-dot " + status}>
                      {status === "complete" ? (
                        <Check />
                      ) : status === "locked" ? (
                        <Lock />
                      ) : (
                        String(m.stage).padStart(2, "0")
                      )}
                    </span>
                    <span className={"roadmap-copy " + status}>
                      <strong>{m.title}</strong>
                      <small>
                        {status === "complete"
                          ? "Completed"
                          : status === "current"
                            ? "Your current stage"
                            : status === "locked"
                              ? "Unlocks after trainer approval"
                              : "Coming up next"}
                      </small>
                    </span>
                  </button>
                );
              })}
            <div className="card-note">
              14 stages. One connected operating journey.
            </div>
          </section>
          <section className="card feedback-card">
            <div className="card-heading">
              <h2 style={{ fontSize: 14 }}>
                {learner ? "Trainer feedback" : "Learning with care"}
              </h2>
              <MessageSquare size={15} className="muted" />
            </div>
            <div className="feedback-empty">
              <span className="feedback-avatar">
                <MessageSquare size={15} />
              </span>
              <div>
                <strong>
                  {latestFeedback
                    ? "Your trainer has an update"
                    : "Guidance at every step"}
                </strong>
                <p>
                  {latestFeedback
                    ? latestFeedback.message
                    : "Submit your practical work to receive specific feedback and a clear next step."}
                </p>
              </div>
            </div>
            {latestFeedback && (
              <Button
                variant="ghost"
                className="full mt-20"
                onClick={() => void openRecord(latestFeedback.submission_id!)}
              >
                Read feedback
                <ArrowRight size={13} />
              </Button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
export function Journey() {
  const { data, openLesson } = useAcademy();
  return (
    <>
      <PageHeading
        eyebrow="YOUR 45-DAY PROGRAM"
        title="One journey. Fourteen possibilities."
        description="A connected path from understanding the basics to supervised operational competence."
      />
      <div className="notice mb-0">
        <strong>
          Understand → Practice → Submit evidence → Trainer review → Correct →
          Get approved
        </strong>
        <p>
          Checklist completion does not bypass an approval gate. Your next stage
          is earned through evaluated practical work.
        </p>
      </div>
      <div className="journey-grid mt-28">
        {data.modules.map((m) => {
          const status = stageStatus(data, m.id),
            lessons = data.lessons.filter((l) => l.module_id === m.id),
            done = lessons.filter((l) => l.completed).length;
          return (
            <button
              key={m.id}
              className={"stage-card " + status}
              onClick={() =>
                void openLesson(
                  (lessons.find((l) => !l.completed) ?? lessons[0]).id,
                )
              }
            >
              <span className="stage-number">
                {m.stage === 0
                  ? "FOUNDATION"
                  : `STAGE ${String(m.stage).padStart(2, "0")}`}
              </span>
              {status === "locked" ? (
                <Lock size={16} className="stage-lock" />
              ) : status === "complete" ? (
                <CheckCircle2 size={17} className="stage-lock text-green" />
              ) : null}
              <h3>{m.title}</h3>
              <p>{m.description}</p>
              <div className="between">
                <small>
                  {lessons.length
                    ? `Days ${lessons[0].day}–${lessons[lessons.length - 1].day}`
                    : "Part of the integrated project"}
                </small>
                <Badge
                  tone={
                    status === "complete"
                      ? "green"
                      : status === "current"
                        ? "blue"
                        : "neutral"
                  }
                >
                  {status === "complete"
                    ? "Completed"
                    : status === "current"
                      ? "In progress"
                      : status === "locked"
                        ? "Locked"
                        : "Available"}
                </Badge>
              </div>
              <div className="mini-progress">
                <span
                  style={{
                    width: `${lessons.length ? (done / lessons.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
export function Courses() {
  const { data, openLesson } = useAcademy(),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const lessons = data.lessons.filter(
    (l) =>
      (filter === "all" || l.module_id === filter) &&
      l.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="PROFESSIONAL OPERATIONS SPECIALIST"
        title="Your course, chapter by chapter."
        description="45 editable lessons. Practical assignments, clear SOPs and meaningful evaluation."
        action={<Badge tone="blue">45-day program</Badge>}
      />
      <div className="list-toolbar">
        <input
          aria-label="Filter course lessons"
          placeholder="Find a lesson…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter by module"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All modules</option>
          {data.modules.map((m) => (
            <option value={m.id} key={m.id}>
              {m.stage === 0 ? "Foundation" : String(m.stage).padStart(2, "0")}{" "}
              · {m.title}
            </option>
          ))}
        </select>
      </div>
      <div className="lesson-list">
        {lessons.map((l) => (
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
                {l.minutes} min · {getForm(l.form_key).short} · Evidence +
                trainer evaluation
              </p>
            </div>
            <Badge tone={l.completed ? "green" : l.locked ? "neutral" : "blue"}>
              {l.completed
                ? "Approved"
                : l.locked
                  ? "Gate " + l.required_gate + " required"
                  : "Available"}
            </Badge>
            {l.locked ? (
              <Lock size={15} className="muted" />
            ) : (
              <ChevronRight size={16} className="text-brand" />
            )}
          </button>
        ))}
      </div>
      {!lessons.length && (
        <Empty
          title="No matching lessons"
          description="Try another search or choose all modules."
        />
      )}
    </>
  );
}
export function PracticeLab() {
  const { data, openWorkspace } = useAcademy(),
    [difficulty, setDifficulty] = useState("all"),
    [query, setQuery] = useState(""),
    [count, setCount] = useState(12);
  const exercises = data.assignments.filter(
    (a) =>
      !a.lesson_id &&
      (difficulty === "all" || a.difficulty === difficulty) &&
      a.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="LEARN BY DOING"
        title="The practice lab."
        description="A safe space to work through the operating methodology, build accuracy and collect evidence."
        action={<Badge tone="purple">Synthetic exercises</Badge>}
      />
      <div className="list-toolbar">
        <input
          aria-label="Search exercises"
          placeholder="Find a practice exercise…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCount(12);
          }}
        />
        <select
          aria-label="Exercise difficulty"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setCount(12);
          }}
        >
          <option value="all">All difficulty levels</option>
          {["Beginner", "Intermediate", "Advanced"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="grid-3">
        {exercises.slice(0, count).map((a) => (
          <article className="card exercise-card" key={a.id}>
            <Badge
              tone={
                a.difficulty === "Beginner"
                  ? "green"
                  : a.difficulty === "Intermediate"
                    ? "blue"
                    : "purple"
              }
            >
              {a.difficulty}
            </Badge>
            <h3>{a.title}</h3>
            <p>{a.instructions}</p>
            <div className="small muted" style={{ marginBottom: 15 }}>
              Rubric: {a.max_score} points · evidence required
            </div>
            <Button
              variant="secondary"
              onClick={() => void openWorkspace(a.form_key, a.lesson_id, a.id)}
            >
              Start exercise
              <ArrowRight size={13} />
            </Button>
          </article>
        ))}
      </div>
      {exercises.length > count && (
        <div style={{ textAlign: "center", marginTop: 25 }}>
          <Button variant="secondary" onClick={() => setCount(count + 12)}>
            Show more exercises ({exercises.length - count} remaining)
          </Button>
        </div>
      )}
    </>
  );
}
export function Assignments() {
  const { data, openWorkspace, openLesson, openRecord } = useAcademy(),
    [filter, setFilter] = useState("upcoming"),
    isStudent = data.user!.role === "student",
    current = nextLesson(data);
  const assignments = data.assignments.filter(
    (a) =>
      a.lesson_id &&
      (filter === "all" ||
        (filter === "upcoming"
          ? data.lessons.find((l) => l.id === a.lesson_id)?.day === current?.day
          : data.submissions.some((s) => s.assignment_id === a.id))),
  );
  return (
    <>
      <PageHeading
        title={
          isStudent
            ? "Turn understanding into action."
            : "Practical work, connected to the lesson."
        }
        description="Every assignment includes required evidence, a rubric and a trainer review."
      />
      <div className="page-tabs">
        {["upcoming", "submitted", "all"].map((f) => (
          <button
            key={f}
            className={"tab " + (filter === f ? "active" : "")}
            onClick={() => setFilter(f)}
          >
            {f === "upcoming"
              ? "Your next tasks"
              : f === "submitted"
                ? "With submissions"
                : "All assigned tasks"}
          </button>
        ))}
      </div>
      <div className="stack">
        {assignments.map((a) => {
          const existing = data.submissions.find(
            (s) => s.assignment_id === a.id,
          );
          return (
            <article className="card submission-card" key={a.id}>
              <span className="task-icon">
                <ClipboardCheck />
              </span>
              <div className="submission-main">
                <h3>{a.title}</h3>
                <p>
                  {getForm(a.form_key).short} ·{" "}
                  {a.due_at ? "Due " + dateLabel(a.due_at) : "Self-paced"} ·{" "}
                  {a.max_score}-point rubric
                </p>
                <p style={{ marginTop: 6 }}>{a.required_evidence}</p>
              </div>
              {existing && <StatusBadge status={existing.status} />}
              <Button
                variant="secondary"
                onClick={() =>
                  isStudent
                    ? existing
                      ? void openRecord(existing.id)
                      : void openWorkspace(a.form_key, a.lesson_id, a.id)
                    : void openLesson(a.lesson_id!)
                }
              >
                {isStudent
                  ? existing
                    ? "Open work"
                    : "Start task"
                  : "Open teaching plan"}
                <ChevronRight size={13} />
              </Button>
            </article>
          );
        })}
      </div>
      {!assignments.length && (
        <Empty
          title="No tasks in this view"
          description="Use All assigned tasks to explore the practical calendar, or return to your next lesson."
        />
      )}
    </>
  );
}
export function Operations() {
  const { data, openWorkspace, go } = useAcademy(),
    student = data.user!.role === "student",
    gate = Math.max(0, ...data.gates.map((g) => g.gate));
  return (
    <>
      <PageHeading
        eyebrow="THE OPERATING METHODOLOGY"
        title="From research to real capability."
        description="Fifteen connected forms, one traceable product journey. Live-account actions remain separately authorized."
      />
      <div className="notice notice-amber">
        <strong>Supervised training workspace</strong>
        <p>
          Approved work flows into the next form with its identifiers intact.
          This academy has no live publishing, purchasing, refund or messaging
          integration.
        </p>
      </div>
      <div className="form-directory mt-28">
        {forms.map((f) => (
          <button
            className="form-link"
            key={f.key}
            onClick={() => (student ? void openWorkspace(f.key) : go("queue"))}
          >
            <span className="form-code">{f.key}</span>
            <div>
              <h3>{f.title}</h3>
              <p>
                {f.parent
                  ? `Continues from approved ${f.parent}`
                  : "Starts a training record"}
              </p>
              <div style={{ marginTop: 10 }}>
                <Badge tone={student && gate < f.gate ? "neutral" : "blue"}>
                  {student && gate < f.gate ? (
                    <>
                      <Lock size={10} />
                      Gate {f.gate} required
                    </>
                  ) : (
                    "Open workspace"
                  )}
                </Badge>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
export function SubmissionList({
  onlyForm,
  reviewMode = false,
}: {
  onlyForm?: string;
  reviewMode?: boolean;
}) {
  const { data, openWorkspace, openRecord } = useAcademy(),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(reviewMode ? "submitted" : "all");
  const records = data.submissions.filter(
    (s) =>
      (!onlyForm || s.form_key === onlyForm) &&
      (status === "all" || s.status === status) &&
      (s.title + " " + s.student_name)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow={
          reviewMode
            ? "EVIDENCE, FEEDBACK & PROGRESSION"
            : onlyForm
              ? "PRODUCT HUNTING WORKSPACE"
              : "YOUR PRACTICAL PORTFOLIO"
        }
        title={
          reviewMode
            ? "Make feedback matter."
            : onlyForm
              ? "Find the opportunity. Verify the evidence."
              : "Your work. Your progress."
        }
        description={
          reviewMode
            ? "Review the exact revision, source evidence and field-level details before making a decision."
            : "Every draft, correction and approval stays connected to its original record."
        }
        action={
          onlyForm ? (
            <Button onClick={() => void openWorkspace("F02")}>
              <Plus size={14} />
              New product
            </Button>
          ) : (
            <a className="btn btn-secondary" href="/api/export">
              <Download size={14} />
              Export CSV
            </a>
          )
        }
      />
      <div className="list-toolbar">
        <input
          aria-label="Search submissions"
          placeholder="Search products or learners…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter submission status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {[
            "draft",
            "submitted",
            "changes_requested",
            "approved",
            "rejected",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {records.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {reviewMode && <th>Learner / cohort</th>}
                  <th>Product / record</th>
                  <th>Workflow</th>
                  <th>Evidence context</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((s) => (
                  <tr key={s.id}>
                    {reviewMode && (
                      <td>
                        <strong>{s.student_name}</strong>
                        <small>{s.cohort_name}</small>
                      </td>
                    )}
                    <td>
                      <strong>{s.title || "Untitled draft"}</strong>
                      <small>
                        Revision {s.revision} ·{" "}
                        {String(s.data.country ?? "Training record")}
                      </small>
                    </td>
                    <td>
                      {s.form_key}
                      <small style={{ display: "block" }}>
                        {getForm(s.form_key).short}
                      </small>
                    </td>
                    <td>
                      <EvidenceBadge value={s.classification} />
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>{dateLabel(s.updated_at)}</td>
                    <td>
                      <Button
                        variant="secondary"
                        onClick={() => void openRecord(s.id)}
                      >
                        {reviewMode ? "Review" : "Open"}
                        <ChevronRight size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              reviewMode
                ? "Your review queue is clear"
                : "Your first record starts here"
            }
            description={
              reviewMode
                ? "New submissions from your assigned learners will appear here, with their evidence and review history."
                : "Open a practical exercise, save a draft and submit attributable evidence for trainer feedback."
            }
          >
            {!reviewMode && (
              <Button onClick={() => void openWorkspace("F02")}>
                Start product research
                <ArrowRight size={13} />
              </Button>
            )}
          </Empty>
        )}
      </div>
    </>
  );
}
export function Performance() {
  const { data } = useAcademy(),
    learner = data.user!.role === "student",
    [selected, setSelected] = useState(
      data.user!.role === "student"
        ? data.user!.id
        : (data.students[0]?.id ?? ""),
    ),
    records = data.submissions.filter(
      (s) =>
        s.student_id === selected &&
        s.status === "approved" &&
        s.score !== null &&
        s.score !== undefined,
    ),
    student = data.students.find((s) => s.id === selected);
  const metrics = Object.entries(data.branding.weights).map(([key, weight]) => {
      const rows = records.filter((s) => s.form_key === key);
      return {
        key,
        name: getForm(key).short,
        score: rows.length
          ? rows.reduce((sum, s) => sum + Number(s.score), 0) / rows.length
          : 0,
        weight,
        assessed: rows.length > 0,
      };
    }),
    overall = metrics.reduce((sum, m) => sum + (m.score * m.weight) / 100, 0),
    critical = data.submissions.some(
      (s) => s.student_id === selected && s.critical && s.status !== "approved",
    ),
    cert = data.certificates.find((c) => c.student_id === selected);
  return (
    <>
      <PageHeading
        eyebrow="EVALUATION THAT HELPS YOU GROW"
        title={
          learner
            ? "Your skills, taking shape."
            : "See the progress behind the numbers."
        }
        description="Scores come from trainer-reviewed practical work. Unassessed categories remain provisional."
        action={
          <a className="btn btn-secondary" href="/api/export">
            <Download size={14} />
            Export records
          </a>
        }
      />
      {!learner && (
        <select
          aria-label="Choose learner performance"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ maxWidth: 300, marginBottom: 23 }}
        >
          {data.students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name} · {s.cohort_name}
            </option>
          ))}
        </select>
      )}
      <div className="stat-grid">
        <Stat
          label="Approved lessons"
          value={`${student?.completed ?? 0} / 45`}
          note="Practical milestones"
          icon={BookOpen}
        />
        <Stat
          label="Approved assignments"
          value={records.length}
          note="Trainer-reviewed evidence"
          icon={ClipboardCheck}
          tone="green"
        />
        <Stat
          label="Weighted overall score"
          value={
            metrics.some((m) => m.assessed) ? overall.toFixed(1) + "%" : "—"
          }
          note="Provisional until every category is assessed"
          icon={GraduationCap}
          tone="purple"
        />
        <Stat
          label="Certification"
          value={cert ? "Qualified" : critical ? "Blocked" : "In progress"}
          note={
            critical
              ? "Resolve critical failures first"
              : "Final review and all gates required"
          }
          icon={ShieldCheck}
          tone="amber"
        />
      </div>
      <div className="grid-2">
        <section className="card">
          <div className="card-heading">
            <h2>Operational competencies</h2>
            <Badge tone="blue">Pass mark {data.branding.passMark}%</Badge>
          </div>
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics}
                margin={{ left: -20, right: 8, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="key"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--brand-light)" }}
                  contentStyle={{
                    borderRadius: 9,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    fontSize: 11,
                  }}
                />
                <Bar
                  dataKey="score"
                  name="Approved-work score"
                  fill="var(--brand)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="card-note">
            Zero-height bars indicate unassessed work, not verified zero
            performance.
          </p>
        </section>
        <section className="card">
          <h2>Your assessment breakdown</h2>
          {metrics.map((m) => (
            <div key={m.key} className="rubric-row">
              <span>
                {m.name}
                <small style={{ display: "block", fontSize: 9 }}>
                  {m.weight}% of final assessment
                </small>
              </span>
              <strong>
                {m.assessed ? m.score.toFixed(1) + "%" : "Awaiting review"}
              </strong>
            </div>
          ))}
          <div
            className={
              "notice mt-20 " + (critical ? "notice-red" : "notice-amber")
            }
          >
            {critical
              ? "An unresolved critical operational failure prevents certification even when the total score is above the pass mark."
              : "A passing knowledge quiz does not authorize live operations. Practical approvals and the final competency review remain required."}
          </div>
        </section>
      </div>
      {learner && (
        <section className="card mt-28">
          <h2>Your seven competency gates</h2>
          {gateTitles.map((title, i) => {
            const gate = data.gates.find((g) => g.gate === i + 1);
            return (
              <div className="gate-row" key={title}>
                <span className={"step-dot " + (gate ? "complete" : "")}>
                  {gate ? <Check /> : <Lock />}
                </span>
                <div>
                  <strong>
                    Gate {i + 1} · {title}
                  </strong>
                  <p>
                    {gate
                      ? gate.reason
                      : "Evidence, appropriate reviews and previous competency conditions are required."}
                  </p>
                </div>
                <Badge tone={gate ? "green" : "neutral"}>
                  {gate ? "Approved" : "Locked"}
                </Badge>
              </div>
            );
          })}
        </section>
      )}
      {cert?.status === "review_required" && (
        <div className="notice warning">
          Certification requires renewed review. Resolve the outstanding
          assessment or critical failure before a certificate can be printed.
        </div>
      )}
      {cert?.status === "qualified" && (
        <>
          <section className="certificate">
            <div className="eyebrow">
              DR. COMMERCE ACADEMY · NGB CONSULTANCY
            </div>
            <Trophy
              size={39}
              className="text-brand"
              style={{ margin: "0 auto" }}
            />
            <h2>Certificate of Operational Competency</h2>
            <p>This certifies that</p>
            <div className="recipient">{student?.display_name}</div>
            <p>
              has met the supervised evaluation requirements for
              <br />
              <strong>
                Professional eBay Dropshipping Operations Specialist
              </strong>
            </p>
            <p>Final assessed score: {cert.score}%</p>
            <small>
              Certificate record {cert.id}
              <br />A Subsidiary of NGB Consultancy
              {data.user?.synthetic ? " · Synthetic training certificate" : ""}
            </small>
          </section>
          <div style={{ textAlign: "center" }}>
            <Button variant="secondary" onClick={() => window.print()}>
              <Download size={14} />
              Print competency report
            </Button>
          </div>
        </>
      )}
    </>
  );
}
export function Notifications() {
  const { data, refresh, openRecord, go } = useAcademy(),
    task = useTask();
  return (
    <>
      <PageHeading
        title="Every update, in one place."
        description="Assignments, trainer feedback and progression decisions from your academy workspace."
        action={
          <Button
            variant="secondary"
            busy={task.busy}
            onClick={() =>
              void task.run(async () => {
                await api("notifications/all", { method: "PATCH", body: "{}" });
                await refresh();
              })
            }
          >
            <CheckCheck size={14} />
            Mark all read
          </Button>
        }
      />
      <div className="stack">
        {data.notifications.map((n) => (
          <article
            className={"notification-card " + (!n.read_at ? "unread" : "")}
            key={n.id}
          >
            <span className="icon-circle">
              <Bell size={17} />
            </span>
            <div className="notification-copy">
              <div className="between">
                <h3>{n.title}</h3>
                <small>{dateLabel(n.created_at)}</small>
              </div>
              <p>{n.message}</p>
              <div className="row wrap">
                <Button
                  variant="ghost"
                  onClick={() =>
                    void task.run(async () => {
                      await api("notifications/" + n.id, {
                        method: "PATCH",
                        body: "{}",
                      });
                      await refresh();
                      if (n.submission_id) await openRecord(n.submission_id);
                      else go("courses");
                    })
                  }
                >
                  {n.submission_id ? "Open submission" : "Open your course"}
                  <ArrowRight size={12} />
                </Button>
                {!n.read_at && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      void task.run(async () => {
                        await api("notifications/" + n.id, {
                          method: "PATCH",
                          body: "{}",
                        });
                        await refresh();
                      })
                    }
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!data.notifications.length && (
        <Empty
          title="You’re all caught up"
          description="New assignments and review decisions will appear here as you move through the program."
        />
      )}
    </>
  );
}
export function Resources() {
  const { data, refresh, notify, openLesson } = useAcademy(),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<Resource | null>(null),
    [add, setAdd] = useState(false),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [url, setUrl] = useState(""),
    [kind, setKind] = useState("SOP"),
    [classification, setClassification] = useState("pending"),
    [calculator, setCalculator] = useState<Record<string, unknown>>({
      item: 2.01,
      shipping: 0,
      selling: 5.88,
      mode: "allowance",
      allowance: 20,
      feePercent: 0,
      fixedFee: 0,
      promotionPercent: 0,
      conversion: 0,
      tax: 0,
      other: 0,
      currency: "USD",
    }),
    task = useTask();
  const records = data.resources.filter((r) =>
    (r.title + " " + r.description)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="TOOLS FOR YOUR NEXT STEP"
        title="Keep good guidance close."
        description="Operating procedures, source references and clearly classified learning resources."
        action={
          data.user!.role === "admin" ? (
            <Button onClick={() => setAdd(true)}>
              <Plus size={14} />
              Add resource
            </Button>
          ) : undefined
        }
      />
      <div className="list-toolbar">
        <input
          aria-label="Search resources"
          placeholder="Find an SOP or resource…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Badge>{records.length} resources</Badge>
      </div>
      <div className="grid-3">
        {records.map((r) => (
          <article className="card resource-card" key={r.id}>
            <span className="resource-icon">
              {r.kind === "Policy" ? (
                <ShieldCheck size={22} />
              ) : r.kind === "Calculator" ? (
                <TrendingUp size={22} />
              ) : (
                <FileText size={22} />
              )}
            </span>
            <div className="row wrap" style={{ marginBottom: 12 }}>
              <Badge>{r.kind}</Badge>
              <EvidenceBadge value={r.classification} />
            </div>
            <h3>{r.title}</h3>
            <p>{r.description}</p>
            {r.url ? (
              <ExternalLink href={r.url}>
                {r.kind === "File" ? "Open uploaded file" : "Open reference"}
              </ExternalLink>
            ) : (
              <Button variant="ghost" onClick={() => setSelected(r)}>
                {r.kind === "Calculator"
                  ? "Explore the worked example"
                  : "Read resource"}
                <ArrowRight size={12} />
              </Button>
            )}
          </article>
        ))}
      </div>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        wide={selected?.kind === "Calculator"}
        title={selected?.title ?? "Academy resource"}
        description="Sources and estimates must remain clearly classified."
      >
        {selected && (
          <>
            <EvidenceBadge value={selected.classification} />
            <p
              className="mt-20"
              style={{
                fontSize: 13,
                lineHeight: 1.9,
                color: "var(--ink)",
                whiteSpace: "pre-wrap",
              }}
            >
              {selected.description}
            </p>
            {selected.kind === "Calculator" && (
              <>
                <div className="form-grid">
                  {[
                    ["item", "Source item price"],
                    ["shipping", "Shipping"],
                    ["selling", "Planned selling price"],
                    ["allowance", "Additional-cost allowance %"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      <span className="field-label">{label}</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={String(calculator[key])}
                        onChange={(e) =>
                          setCalculator({
                            ...calculator,
                            [key]: e.target.value,
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <CalculatorPanel values={calculator} />
                <div className="notice mt-20">
                  Internal example, pending verification. These inputs produce
                  143.8%, not 101%. Explore assumptions here; create an
                  approved-source costing record to submit your own work.
                </div>
              </>
            )}
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close resource
              </Button>
              <Button
                onClick={() => {
                  const stage =
                    selected.kind === "Calculator"
                      ? 7
                      : selected.title.includes("Supplier")
                        ? 6
                        : selected.title.includes("Listing")
                          ? 8
                          : 4;
                  const module = data.modules.find((m) => m.stage === stage),
                    l = data.lessons.find((l) => l.module_id === module?.id);
                  setSelected(null);
                  if (l) void openLesson(l.id);
                }}
              >
                Open related lesson
                <ArrowRight size={13} />
              </Button>
            </div>
          </>
        )}
      </Modal>
      <Modal
        open={add}
        onClose={() => setAdd(false)}
        title="Add a learning resource"
        description="Publish attributable guidance with an explicit evidence classification."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void task.run(async () => {
              await post("resources", {
                title,
                description,
                url: url || null,
                kind,
                classification,
              });
              await refresh();
              setAdd(false);
              notify("Learning resource saved.");
            });
          }}
        >
          <div className="form-grid">
            <label className="span-2">
              <span className="field-label">Resource title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label>
              <span className="field-label">Resource type</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {["SOP", "Policy", "Video", "Checklist", "Calculator"].map(
                  (k) => (
                    <option key={k}>{k}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              <span className="field-label">Evidence classification</span>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
              >
                {["pending", "internal", "synthetic", "verified"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="span-2">
              <span className="field-label">
                HTTPS reference URL (optional)
              </span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
            <label className="span-2">
              <span className="field-label">Guidance and source notes</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setAdd(false)}
            >
              Cancel
            </Button>
            <Button busy={task.busy}>Save resource</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
export function Assessments() {
  const { data, refresh, notify } = useAcademy(),
    [selected, setSelected] = useState<string | null>(null),
    [answers, setAnswers] = useState<Record<number, number>>({}),
    [result, setResult] = useState<{
      score: number;
      passed: boolean;
      message: string;
    } | null>(null),
    task = useTask(),
    assessment = data.assessments.find((a) => a.id === selected),
    student = data.user!.role === "student";
  return (
    <>
      <PageHeading
        eyebrow="UNDERSTANDING BEFORE AUTHORIZATION"
        title="Check what you know. Show what you can do."
        description="Knowledge checks support your practical evaluation. They never authorize live-account actions."
      />
      <div className="grid-3">
        {data.assessments.map((a) => {
          const attempt = data.attempts.find((t) => t.assessment_id === a.id);
          return (
            <article className="card exercise-card" key={a.id}>
              <Badge tone={attempt?.passed ? "green" : "blue"}>
                Gate {a.gate} knowledge check
              </Badge>
              <h3>{a.title}</h3>
              <p>
                {a.questions.length} questions · pass mark {a.pass_mark}%<br />
                {attempt
                  ? `Latest result: ${attempt.score}%`
                  : "No attempt recorded yet."}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelected(a.id);
                  setAnswers({});
                  setResult(null);
                }}
              >
                {student
                  ? attempt
                    ? "Retake assessment"
                    : "Start assessment"
                  : "View knowledge questions"}
                <ArrowRight size={13} />
              </Button>
            </article>
          );
        })}
      </div>
      <Modal
        open={Boolean(assessment)}
        onClose={() => setSelected(null)}
        wide
        title={assessment?.title ?? "Knowledge check"}
        description="Answers are marked on the server and your result is retained."
      >
        {assessment && (
          <>
            <div className="notice">
              Passing this assessment is one requirement. Practical evidence and
              trainer approvals still control your progression.
            </div>
            {assessment.questions.map((q, index) => (
              <section className="assessment-question" key={index}>
                <h3>
                  {index + 1}. {q.question}
                </h3>
                {q.choices.map((choice, i) => (
                  <label key={i}>
                    <input
                      type="radio"
                      name={"q" + index}
                      checked={answers[index] === i}
                      onChange={() => setAnswers({ ...answers, [index]: i })}
                      disabled={!student || Boolean(result)}
                    />
                    {choice}
                  </label>
                ))}
              </section>
            ))}
            {result && (
              <div
                className={
                  "notice " + (result.passed ? "notice-green" : "notice-amber")
                }
              >
                <strong>
                  {result.score}% ·{" "}
                  {result.passed ? "Passed" : "Keep practicing"}
                </strong>
                <p>{result.message}</p>
              </div>
            )}
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              {student && !result && (
                <Button
                  busy={task.busy}
                  onClick={() =>
                    void task.run(async () => {
                      if (
                        Object.keys(answers).length !==
                        assessment.questions.length
                      )
                        throw new Error(
                          "Answer every question before submitting.",
                        );
                      const r = await post<{
                        score: number;
                        passed: boolean;
                        message: string;
                      }>(
                        "assessments/" + assessment.id,
                        assessment.questions.map((_, i) => answers[i]),
                      );
                      setResult(r);
                      await refresh();
                      notify(r.message);
                    })
                  }
                >
                  Submit knowledge check
                  <ArrowRight size={13} />
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
export function About() {
  const { data } = useAcademy();
  return (
    <>
      <PageHeading
        eyebrow="LEARN · PRACTICE · QUALIFY"
        title="Dr. Commerce Academy"
        description="A Subsidiary of NGB Consultancy"
      />
      <div className="grid-2">
        <section className="card prose">
          <h2>Practical learning, with a clear next step.</h2>
          <p>
            The Professional eBay Dropshipping Operations Specialist program
            connects lessons, operational practice, evidence, feedback and
            competency approvals in a guided 45-day journey.
          </p>
          <p>
            Dr. Commerce is the training identity of NGB Consultancy. Its
            operating methodology is taught through supervised simulations
            before any authorized live-account work.
          </p>
          <div className="notice">
            Every lesson leads to a practical action. Every practical action has
            an evaluation mechanism.
          </div>
        </section>
        <section className="card">
          <h2>A connected operating journey</h2>
          {[
            ["45", "Days of structured learning"],
            ["14", "Operating stages in the supplied sequence"],
            ["15", "Persistent operational forms"],
            ["7", "Server-enforced competency gates"],
          ].map(([n, label]) => (
            <div className="payment-row" key={n}>
              <strong className="text-brand" style={{ fontSize: 23 }}>
                {n}
              </strong>
              <span>{label}</span>
            </div>
          ))}
          <div className="card-note">
            {data.demo
              ? "The active workspace uses synthetic people, records and demonstrations. "
              : " "}
            No verified live sales, suppliers, deliveries or bank payments are
            implied.
          </div>
        </section>
      </div>
      <section className="card mt-28">
        <h2>Source and operating verification</h2>
        <p className="small" style={{ lineHeight: 1.9 }}>
          Internal supplier thresholds and the 80–100% ROI target are retained.
          Recommendations and generated instructional material require
          management review. eBay policy and each proposed fulfillment
          arrangement must be verified before live work; a marketplace sourcing
          exercise does not establish an authorized live dropshipping model.
        </p>
        <ExternalLink href="https://www.ebay.com/help/selling/posting-items/setting-postage-options/drop-shipping?id=4176">
          Check eBay’s current dropshipping policy
        </ExternalLink>
      </section>
    </>
  );
}
