"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  X,
  Info,
  Clock3,
  Layers3,
  Presentation,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Save,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Play,
  Users,
  Lock,
  Edit3,
  MessageSquare,
  LoaderCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Lesson } from "@/lib/types";
import { getForm } from "@/lib/forms";
import { platforms } from "@/lib/curriculum";
import {
  Button,
  Badge,
  EvidenceBadge,
  PageHeading,
  Modal,
  ExternalLink,
  useAcademy,
  useTask,
  api,
  post,
} from "./ui";

export function LessonViewer({
  lesson,
  onPresent,
  onUpdated,
}: {
  lesson: Lesson;
  onPresent: () => void;
  onUpdated: (l: Lesson) => void;
}) {
  const { data, refresh, go, openLesson, openWorkspace, notify } = useAcademy(),
    [tab, setTab] = useState("understand"),
    [responses, setResponses] = useState<Record<string, boolean>>(
      lesson.responses ?? {},
    ),
    [saving, setSaving] = useState(false),
    [note, setNote] = useState(lesson.notes ?? ""),
    [assign, setAssign] = useState(false),
    [edit, setEdit] = useState(false),
    [cohort, setCohort] = useState(data.cohorts[0]?.id ?? ""),
    [deadline, setDeadline] = useState(
      new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Karachi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(new Date(Date.now() + 2 * 86400000))
        .replace(" ", "T"),
    ),
    [flashcard, setFlashcard] = useState<string | null>(null),
    [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const task = useTask(),
    student = data.user!.role === "student",
    instructor = ["trainer", "admin"].includes(data.user!.role),
    allReady = lesson.content.checklist.every((c) => responses[c.id]),
    content = lesson.content;
  useEffect(() => {
    if (instructor)
      void api<{ student_id: string; present: boolean }[]>(
        "attendance?lessonId=" + lesson.id,
      )
        .then((rows) =>
          setAttendance(
            Object.fromEntries(rows.map((r) => [r.student_id, r.present])),
          ),
        )
        .catch(() => {});
  }, [lesson.id, instructor]);
  async function toggle(id: string, checked: boolean) {
    const previous = responses,
      next = { ...responses, [id]: checked };
    setResponses(next);
    setSaving(true);
    try {
      await api("lessons/" + lesson.id + "/checklist", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      setResponses(next);
    } catch (error) {
      setResponses(previous);
      notify((error as Error).message, true);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={`DAY ${String(lesson.day).padStart(2, "0")} · ${getForm(lesson.form_key).short}`}
        title={lesson.title}
        description={lesson.objective}
        action={
          <div className="row wrap">
            {data.user!.role === "admin" && (
              <Button variant="secondary" onClick={() => setEdit(true)}>
                <Edit3 size={13} />
                Edit lesson
              </Button>
            )}
            {instructor && (
              <Button onClick={onPresent}>
                <Presentation size={14} />
                Start Teaching
              </Button>
            )}
          </div>
        }
      />
      <div className="row wrap" style={{ marginBottom: 23 }}>
        <Badge tone="blue">
          <Clock3 size={11} />
          {lesson.minutes} min
        </Badge>
        <Badge>
          <Layers3 size={11} />
          Lesson + practical assignment
        </Badge>
        <EvidenceBadge value={content.classification} />
      </div>
      <div className="page-tabs">
        {[
          ["understand", "Understand"],
          ["sop", "SOP & precautions"],
          ["assignment", "Practice & evidence"],
          ...(instructor ? [["teaching", "Trainer console"]] : []),
        ].map(([id, label]) => (
          <button
            className={"tab " + (tab === id ? "active" : "")}
            key={id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="lesson-content-grid">
        <section className="card prose">
          {tab === "understand" && (
            <>
              {content.video ? (
                <iframe
                  className="video-frame"
                  src={content.video}
                  title={lesson.title + " training video"}
                  allow="fullscreen; picture-in-picture"
                />
              ) : (
                <div className="media-placeholder">
                  <BookOpen />
                  <strong>{lesson.title}</strong>
                  <p>
                    Training media is pending upload. Study the written lesson
                    and SOP below.
                  </p>
                  <Badge tone="blue">
                    Media placeholder · not a live screenshot
                  </Badge>
                </div>
              )}
              <h2>What you’ll learn</h2>
              <p>{content.explanation}</p>
              {lesson.day <= 3 && (
                <>
                  <h3>One transaction, connected responsibilities.</h3>
                  <div className="commerce-flow">
                    {[
                      "Buyer places an order",
                      "Seller verifies details",
                      "Approved supplier fulfills",
                      "Carrier tracking",
                      "Evidence-confirmed delivery",
                    ].map((s, i) => (
                      <span className="row" key={s}>
                        <Badge tone="blue">{s}</Badge>
                        {i < 4 && <ChevronRight size={12} />}
                      </span>
                    ))}
                  </div>
                  <p className="small">
                    Synthetic demonstration. Every supplier arrangement and
                    live-account action requires management verification.
                  </p>
                  {lesson.day === 2 && (
                    <>
                      <h3>Platforms have different roles.</h3>
                      <div className="grid-2">
                        {platforms.map(([name, model, description]) => (
                          <button
                            className="platform-card"
                            key={name}
                            onClick={() =>
                              setFlashcard(flashcard === name ? null : name)
                            }
                            aria-expanded={flashcard === name}
                          >
                            <h3>{name}</h3>
                            <small>{model}</small>
                            <p>
                              {flashcard === name
                                ? description
                                : "Tap to explore how this platform works."}
                            </p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <h3>The 14-stage operating journey</h3>
                  <div className="commerce-flow">
                    {data.modules
                      .filter((m) => m.stage > 0)
                      .map((m) => (
                        <button
                          key={m.id}
                          onClick={() =>
                            void openLesson(
                              data.lessons.find((l) => l.module_id === m.id)!
                                .id,
                            )
                          }
                        >
                          {String(m.stage).padStart(2, "0")} · {m.title}
                        </button>
                      ))}
                  </div>
                </>
              )}
              <h3>A worked example</h3>
              <div className="notice">{content.example}</div>
              <h3>Keep a personal learning note</h3>
              <textarea
                aria-label="Personal lesson notes"
                placeholder="What did you learn? What would you like to ask your trainer?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                variant="secondary"
                className="mt-20"
                busy={task.busy}
                onClick={() =>
                  void task.run(async () => {
                    await api("lessons/" + lesson.id + "/notes", {
                      method: "PATCH",
                      body: JSON.stringify({ notes: note }),
                    });
                    notify("Your private lesson note is saved.");
                  })
                }
              >
                <Save size={13} />
                Save my note
              </Button>
            </>
          )}
          {tab === "sop" && (
            <>
              <h2>Your step-by-step operating procedure</h2>
              {content.steps.map((s, i) => (
                <div className="sop-step" key={i}>
                  <span className="step-dot">{i + 1}</span>
                  <p>{s}</p>
                </div>
              ))}
              <div className="grid-2 mt-28">
                <div>
                  <h3 className="text-green">Do</h3>
                  <ul className="do-list">
                    {content.dos.map((s) => (
                      <li key={s}>
                        <Check className="text-green" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-red">Avoid</h3>
                  <ul className="do-list">
                    {content.donts.map((s) => (
                      <li key={s}>
                        <X className="text-red" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <h3>Precautions before you act</h3>
              {content.precautions.map((s) => (
                <div
                  className="notice notice-amber"
                  key={s}
                  style={{ marginBottom: 12 }}
                >
                  {s}
                </div>
              ))}
              <h3>Tools & reference links</h3>
              <div className="stack">
                {content.resources.map((r) => (
                  <ExternalLink key={r.url} href={r.url}>
                    {r.label}
                  </ExternalLink>
                ))}
              </div>
            </>
          )}
          {tab === "assignment" && (
            <>
              <h2>Put the lesson into practice.</h2>
              <p>{content.assignment}</p>
              <div className="notice">
                <strong>Required evidence</strong>
                <p>{content.evidence}</p>
              </div>
              <h3>How your trainer evaluates the work</h3>
              {content.rubric.map((r) => (
                <div className="rubric-row" key={r.label}>
                  <span>{r.label}</span>
                  <strong>{r.weight}%</strong>
                </div>
              ))}
              <div className="notice notice-amber mt-20">
                Approval requires complete evidence, the readiness checklist, a
                passing rubric score and no critical operational failure.
                Correction notes identify the field that needs work.
              </div>
              {student && (
                <Button
                  className="mt-20"
                  disabled={!allReady}
                  onClick={() =>
                    void openWorkspace(
                      lesson.form_key,
                      lesson.id,
                      data.assignments.find((a) => a.lesson_id === lesson.id)
                        ?.id,
                    )
                  }
                >
                  <ClipboardCheck size={14} />
                  Start practical assignment
                  <ArrowRight size={14} />
                </Button>
              )}
            </>
          )}
          {tab === "teaching" && instructor && (
            <>
              <div className="between">
                <h2 className="mb-0">Your teaching console</h2>
                <Badge tone="purple">Instructor only</Badge>
              </div>
              <h3>Speaking script</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{lesson.script}</p>
              <h3>Questions to ask your learners</h3>
              <ul className="do-list">
                {lesson.questions?.map((q) => (
                  <li key={q}>
                    <MessageSquare size={13} className="text-brand" />
                    {q}
                  </li>
                ))}
              </ul>
              <div className="row mt-20 wrap">
                <Button onClick={onPresent}>
                  <Presentation size={14} />
                  Presentation Mode
                </Button>
                <Button variant="secondary" onClick={() => setAssign(true)}>
                  <ClipboardCheck size={14} />
                  Assign practical task
                </Button>
              </div>
              <h3 className="mt-28">Class roster & attendance</h3>
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
                      {s.cohort_name} · {s.completed}/45 lessons approved
                    </small>
                  </div>
                  <label className="row small">
                    <input
                      type="checkbox"
                      checked={attendance[s.id] ?? false}
                      onChange={(e) => {
                        const present = e.target.checked;
                        void task.run(async () => {
                          await post("lessons/" + lesson.id + "/attendance", {
                            studentId: s.id,
                            present,
                          });
                          setAttendance((a) => ({ ...a, [s.id]: present }));
                          notify("Attendance saved.");
                        });
                      }}
                    />
                    Present
                  </label>
                </div>
              ))}
            </>
          )}
          {!instructor && tab === "teaching" && (
            <p>This teaching plan is restricted to assigned trainers.</p>
          )}
        </section>
        <aside className="card check-panel">
          <div className="card-heading">
            <h2>{student ? "Before you practice" : "Lesson readiness"}</h2>
            <ClipboardCheck size={17} className="text-brand" />
          </div>
          <p className="small">
            Confirm each precaution before starting the practical task.
          </p>
          {content.checklist.map((c) => (
            <label className="checklist-item" key={c.id}>
              <input
                type="checkbox"
                checked={responses[c.id] ?? false}
                disabled={!student || saving}
                onChange={(e) => void toggle(c.id, e.target.checked)}
              />
              <span>{c.label}</span>
            </label>
          ))}
          {student ? (
            <>
              <div className="save-status mt-20">
                {saving ? (
                  <LoaderCircle size={12} className="spin" />
                ) : (
                  <CheckCircle2 size={12} />
                )}{" "}
                {saving ? "Saving checklist…" : "Checklist saved automatically"}
              </div>
              <Button
                className="full mt-20"
                disabled={!allReady || saving}
                onClick={() =>
                  void openWorkspace(
                    lesson.form_key,
                    lesson.id,
                    data.assignments.find((a) => a.lesson_id === lesson.id)?.id,
                  )
                }
              >
                Ready for practice
                <ArrowRight size={13} />
              </Button>
              <div className="notice">
                Your checklist prepares you for practice. Trainer-approved
                evidence unlocks progression.
              </div>
            </>
          ) : (
            <>
              <Button className="full mt-20" onClick={onPresent}>
                <Presentation size={14} />
                Start Teaching
              </Button>
              <Button
                variant="secondary"
                className="full mt-20"
                onClick={() => setAssign(true)}
                disabled={!instructor}
              >
                Assign this practical
              </Button>
              <div className="notice">
                Learner checklists and practical submissions are stored against
                their own accounts.
              </div>
            </>
          )}
          <div className="card-note">
            Understand → Practice → Evidence → Review
          </div>
        </aside>
      </div>
      <div className="form-actions">
        <Button variant="secondary" onClick={() => go("courses")}>
          <ArrowLeft size={13} />
          Back to course
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const l = data.lessons.find((l) => l.day === lesson.day + 1);
            if (l) void openLesson(l.id);
            else
              notify(
                "The final evaluation and certification decision complete the course.",
              );
          }}
        >
          {lesson.day < 45 ? "Next lesson" : "Final course step"}
          <ArrowRight size={13} />
        </Button>
      </div>
      <Modal
        open={assign}
        onClose={() => setAssign(false)}
        title="Assign the practical task"
        description="Allocate work to an authorized cohort without leaving the teaching console."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void task.run(async () => {
              await post("lessons/" + lesson.id + "/assign", {
                cohortId: cohort,
                deadline: new Date(deadline + ":00+05:00").toISOString(),
              });
              await refresh();
              setAssign(false);
              notify("Practical assigned. Your learners have been notified.");
            });
          }}
        >
          <label>
            <span className="field-label">Cohort</span>
            <select
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              required
            >
              {data.cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-20">
            <span className="field-label">
              Deadline · Pakistan time (UTC+5)
            </span>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setAssign(false)}
            >
              Cancel
            </Button>
            <Button busy={task.busy} type="submit">
              Assign task
            </Button>
          </div>
        </form>
      </Modal>
      {edit && (
        <LessonEditor
          lesson={lesson}
          onClose={() => setEdit(false)}
          onSaved={(updated) => {
            onUpdated(updated);
            setEdit(false);
          }}
        />
      )}
    </>
  );
}
function LessonEditor({
  lesson,
  onClose,
  onSaved,
}: {
  lesson: Lesson;
  onClose: () => void;
  onSaved: (l: Lesson) => void;
}) {
  const { refresh, notify } = useAcademy(),
    task = useTask(),
    [title, setTitle] = useState(lesson.title),
    [objective, setObjective] = useState(lesson.objective),
    [explanation, setExplanation] = useState(lesson.content.explanation),
    [steps, setSteps] = useState(lesson.content.steps.join("\n")),
    [script, setScript] = useState(lesson.script ?? ""),
    [sections, setSections] = useState({
      dos: lesson.content.dos,
      donts: lesson.content.donts,
      precautions: lesson.content.precautions,
      example: lesson.content.example,
      assignment: lesson.content.assignment,
      evidence: lesson.content.evidence,
      checklist: lesson.content.checklist,
      rubric: lesson.content.rubric,
      slides: lesson.content.slides,
    }),
    [questions, setQuestions] = useState((lesson.questions ?? []).join("\n")),
    [video, setVideo] = useState(lesson.content.video ?? "");
  return (
    <Modal
      open
      onClose={onClose}
      wide
      title="Edit the lesson & teaching script"
      description="Version history is retained; learner and instructor content remain separate."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void task.run(async () => {
            await api("lessons/" + lesson.id, {
              method: "PUT",
              body: JSON.stringify({
                title,
                objective,
                explanation,
                steps: steps.split("\n").filter(Boolean),
                script,
                sections,
                questions: questions.split("\n").filter(Boolean),
                video: video || null,
                version: lesson.version,
              }),
            });
            const updated = await api<Lesson>("lessons/" + lesson.id);
            await refresh();
            onSaved(updated);
            notify("Lesson and instructor script saved with a new version.");
          });
        }}
      >
        <div className="form-grid">
          <label className="span-2">
            <span className="field-label">Lesson title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="span-2">
            <span className="field-label">Learning objective</span>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              required
            />
          </label>
          <label className="span-2">
            <span className="field-label">Learner explanation</span>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              style={{ minHeight: 170 }}
              required
            />
          </label>
          <label className="span-2">
            <span className="field-label">SOP steps · one per line</span>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              style={{ minHeight: 170 }}
              required
            />
          </label>
          <label className="span-2">
            <span className="field-label">Instructor-only speaking script</span>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              style={{ minHeight: 180 }}
              required
            />
          </label>
          <label className="span-2">
            <span className="field-label">
              Instructor discussion questions · one per line
            </span>
            <textarea
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
            />
          </label>
          {(
            [
              ["dos", "Do"],
              ["donts", "Don’t"],
              ["precautions", "Precautions"],
            ] as const
          ).map(([key, label]) => (
            <label className="span-2" key={key}>
              <span className="field-label">{label} · one per line</span>
              <textarea
                value={sections[key].join("\n")}
                onChange={(e) =>
                  setSections({
                    ...sections,
                    [key]: e.target.value.split("\n"),
                  })
                }
                required
              />
            </label>
          ))}
          {(
            [
              ["example", "Clearly classified worked example"],
              ["assignment", "Practical instructions"],
              ["evidence", "Required evidence"],
            ] as const
          ).map(([key, label]) => (
            <label className="span-2" key={key}>
              <span className="field-label">{label}</span>
              <textarea
                value={sections[key]}
                onChange={(e) =>
                  setSections({ ...sections, [key]: e.target.value })
                }
                required
              />
            </label>
          ))}
          <div className="span-2">
            <h3>Readiness checklist</h3>
            {sections.checklist.map((item, index) => (
              <label key={item.id}>
                <span className="field-label">Item {index + 1}</span>
                <input
                  value={item.label}
                  onChange={(e) =>
                    setSections({
                      ...sections,
                      checklist: sections.checklist.map((c, i) =>
                        i === index ? { ...c, label: e.target.value } : c,
                      ),
                    })
                  }
                  required
                />
              </label>
            ))}
          </div>
          <div className="span-2">
            <h3>Assessment rubric · weights total 100%</h3>
            {sections.rubric.map((item, index) => (
              <div className="form-grid" key={index}>
                <label>
                  <span className="field-label">Criterion {index + 1}</span>
                  <input
                    value={item.label}
                    onChange={(e) =>
                      setSections({
                        ...sections,
                        rubric: sections.rubric.map((r, i) =>
                          i === index ? { ...r, label: e.target.value } : r,
                        ),
                      })
                    }
                    required
                  />
                </label>
                <label>
                  <span className="field-label">Weight %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.weight}
                    onChange={(e) =>
                      setSections({
                        ...sections,
                        rubric: sections.rubric.map((r, i) =>
                          i === index
                            ? { ...r, weight: Number(e.target.value) }
                            : r,
                        ),
                      })
                    }
                    required
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="span-2">
            <h3>Presentation slides</h3>
            {sections.slides.map((slide, index) => (
              <div key={index}>
                <label>
                  <span className="field-label">Slide {index + 1} title</span>
                  <input
                    value={slide.title}
                    onChange={(e) =>
                      setSections({
                        ...sections,
                        slides: sections.slides.map((s, i) =>
                          i === index ? { ...s, title: e.target.value } : s,
                        ),
                      })
                    }
                    required
                  />
                </label>
                <label>
                  <span className="field-label">Slide body</span>
                  <textarea
                    value={slide.body}
                    onChange={(e) =>
                      setSections({
                        ...sections,
                        slides: sections.slides.map((s, i) =>
                          i === index ? { ...s, body: e.target.value } : s,
                        ),
                      })
                    }
                    required
                  />
                </label>
              </div>
            ))}
          </div>
          <label className="span-2">
            <span className="field-label">
              Verified training video embed URL (optional)
            </span>
            <input
              type="url"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
            />
          </label>
        </div>
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={task.busy}>
            Save lesson version
            <Save size={13} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function PresentationMode({
  lesson,
  open,
  onClose,
}: {
  lesson: Lesson | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, notify } = useAcademy(),
    [index, setIndex] = useState(0),
    [notes, setNotes] = useState(true),
    [reveal, setReveal] = useState(false),
    [assign, setAssign] = useState(false),
    [deadline, setDeadline] = useState(""),
    [cohort, setCohort] = useState(""),
    task = useTask();
  useEffect(() => {
    if (open) {
      setIndex(0);
      setReveal(false);
    }
  }, [open, lesson?.id]);
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight")
        setIndex((i) =>
          Math.min(i + 1, (lesson?.content.slides.length ?? 1) - 1),
        );
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, lesson, onClose]);
  if (!open || !lesson || !["trainer", "admin"].includes(data.user!.role))
    return null;
  const slides = lesson.content.slides,
    slide = slides[index];
  return (
    <div
      className="presentation"
      role="dialog"
      aria-modal="true"
      aria-label="Trainer presentation"
    >
      <header className="presentation-bar">
        <div>
          <strong>Dr. Commerce Academy</strong>
          <p>
            Day {lesson.day} · {lesson.title}
          </p>
        </div>
        <div className="row">
          <Badge>Instructor presentation</Badge>
          <button
            className="icon-btn"
            aria-label="Toggle speaker notes"
            onClick={() => setNotes(!notes)}
          >
            {notes ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            className="icon-btn"
            aria-label="Enter full screen"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else
                void document.documentElement
                  .requestFullscreen()
                  .catch(() =>
                    notify(
                      "Full-screen mode is unavailable in this browser. The presentation remains open.",
                    ),
                  );
            }}
          >
            <Maximize size={17} />
          </button>
          <button
            className="icon-btn"
            aria-label="Exit presentation"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              onClose();
            }}
          >
            <X size={21} />
          </button>
        </div>
      </header>
      <div
        className="presentation-body"
        style={!notes ? { gridTemplateColumns: "1fr" } : undefined}
      >
        <AnimatePresence mode="wait">
          <motion.section
            className="slide"
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Badge>
              SLIDE {index + 1} / {slides.length}
            </Badge>
            <h2>{slide.title}</h2>
            {reveal ? (
              <p>{slide.body}</p>
            ) : (
              <Button variant="secondary" onClick={() => setReveal(true)}>
                Reveal this step
                <ChevronRight size={14} />
              </Button>
            )}
          </motion.section>
        </AnimatePresence>
        {notes && (
          <aside className="speaker-notes">
            <h3>Speaker notes · instructor only</h3>
            <p>{lesson.script}</p>
            <h3>Ask the class</h3>
            {lesson.questions?.map((q) => (
              <p key={q}>{q}</p>
            ))}
            <Button
              variant="secondary"
              className="full"
              onClick={() => {
                setCohort(data.cohorts[0]?.id ?? "");
                setDeadline(
                  new Intl.DateTimeFormat("sv-SE", {
                    timeZone: "Asia/Karachi",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                    .format(new Date(Date.now() + 2 * 86400000))
                    .replace(" ", "T"),
                );
                setAssign(true);
              }}
            >
              <ClipboardCheck size={14} />
              Assign the practical
            </Button>
          </aside>
        )}
      </div>
      <footer className="presentation-footer">
        <Button
          variant="secondary"
          disabled={index === 0}
          onClick={() => {
            setIndex(index - 1);
            setReveal(false);
          }}
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        <p>
          Arrow keys navigate · Escape exits · Evidence makes learning
          measurable
        </p>
        <Button
          disabled={index === slides.length - 1}
          onClick={() => {
            setIndex(index + 1);
            setReveal(false);
          }}
        >
          Next slide
          <ChevronRight size={16} />
        </Button>
      </footer>
      <Modal
        open={assign}
        onClose={() => setAssign(false)}
        title="Assign from the classroom"
        description="Send the practical to an authorized cohort."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void task.run(async () => {
              await post("lessons/" + lesson.id + "/assign", {
                cohortId: cohort,
                deadline: new Date(deadline + ":00+05:00").toISOString(),
              });
              setAssign(false);
              notify("Practical assigned from Presentation Mode.");
            });
          }}
        >
          <label>
            <span className="field-label">Cohort</span>
            <select
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              required
            >
              {data.cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-20">
            <span className="field-label">Deadline · Pakistan time</span>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAssign(false)}
            >
              Cancel
            </Button>
            <Button busy={task.busy}>Assign practical</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
