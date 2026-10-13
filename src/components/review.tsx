"use client";
import { useState } from "react";
import {
  FileText,
  CheckCircle2,
  MessageSquare,
  XCircle,
  Plus,
  Trash2,
  AlertTriangle,
  Send,
  Link2,
  UploadCloud,
  History,
} from "lucide-react";
import type { Submission } from "@/lib/types";
import { getForm } from "@/lib/forms";
import {
  Button,
  Badge,
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
import { CalculatorPanel } from "./practice-form";

export function ReviewDialog({
  initial,
  onClose,
}: {
  initial: Submission;
  onClose: () => void;
}) {
  const { data, refresh, notify } = useAcademy(),
    [record, setRecord] = useState(initial),
    [comments, setComments] = useState(""),
    [field, setField] = useState(getForm(initial.form_key).fields[0].key),
    [fieldComment, setFieldComment] = useState(""),
    [fieldComments, setFieldComments] = useState<
      { field: string; comment: string }[]
    >([]),
    [score, setScore] = useState(""),
    [critical, setCritical] = useState(false),
    [verified, setVerified] = useState(false),
    [override, setOverride] = useState(false),
    [overrideReason, setOverrideReason] = useState(""),
    [deadline, setDeadline] = useState(""),
    [decision, setDecision] = useState<
      "approved" | "rejected" | "changes_requested" | null
    >(null),
    [grades, setGrades] = useState<Record<string, string>>({}),
    task = useTask();
  const spec = getForm(record.form_key),
    rubric = record.rubric ?? [
      { label: "Accuracy and verified inputs", weight: 40 },
      { label: "Evidence and traceability", weight: 30 },
      { label: "Operating controls and reasoning", weight: 20 },
      { label: "Clear documentation", weight: 10 },
    ],
    canReview =
      record.status === "submitted" ||
      (data.user?.role === "admin" &&
        override &&
        ["approved", "changes_requested", "rejected"].includes(record.status));
  function grade(label: string, value: string) {
    const next = { ...grades, [label]: value };
    setGrades(next);
    setScore(
      rubric.every((r) => next[r.label] !== undefined && next[r.label] !== "")
        ? String(
            Math.round(
              rubric.reduce(
                (sum, r) => sum + (Number(next[r.label]) * r.weight) / 100,
                0,
              ) * 10,
            ) / 10,
          )
        : "",
    );
  }
  function choose(value: typeof decision) {
    if (override && overrideReason.trim().length < 20) {
      notify(
        "Document the reason and supporting evidence for management reassessment.",
        true,
      );
      return;
    }
    if (score === "" || Number(score) < 0 || Number(score) > 100) {
      notify("Enter a numerical score between 0 and 100.", true);
      return;
    }
    if (comments.trim().length < 10) {
      notify(
        "Add meaningful trainer feedback before recording the decision.",
        true,
      );
      return;
    }
    if (value === "changes_requested" && !fieldComments.length) {
      notify("Add a comment to the exact field that needs correction.", true);
      return;
    }
    setDecision(value);
  }
  async function submit() {
    if (!decision) return;
    const selected = decision;
    setDecision(null);
    await task.run(async () => {
      const r = await post<Submission>("submissions/" + record.id + "/review", {
        revision: record.revision,
        decision: selected,
        score: Number(score),
        comments,
        fieldComments,
        critical,
        deadline: deadline
          ? new Date(deadline + ":00+05:00").toISOString()
          : null,
        verified,
        overrideReason: override ? overrideReason : undefined,
      });
      setRecord(r);
      await refresh();
      notify(
        selected === "approved"
          ? "Review recorded. Eligible learner progression is updated."
          : "Review and field-specific feedback sent to the learner.",
      );
    });
  }
  return (
    <>
      <Modal
        open
        onClose={onClose}
        wide
        title={record.title || "Submission review"}
        description={`${record.student_name} · ${spec.title} · exact revision ${record.revision}`}
      >
        <div className="row wrap" style={{ marginBottom: 24 }}>
          <StatusBadge status={record.status} />
          <EvidenceBadge value={record.classification} />
          <span className="small muted">
            Record {record.id.slice(0, 8)} ·{" "}
            {record.cohort_name ?? "Authorized learner"}
          </span>
        </div>
        <div className="review-split">
          <section>
            <h3>Submission details</h3>
            <dl>
              {spec.fields.map((f) => (
                <div className="data-pair" key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>
                    {f.type === "url" &&
                    /^https?:\/\//.test(String(record.data[f.key])) ? (
                      <ExternalLink href={String(record.data[f.key])}>
                        {String(record.data[f.key])}
                      </ExternalLink>
                    ) : typeof record.data[f.key] === "boolean" ? (
                      record.data[f.key] ? (
                        "Confirmed"
                      ) : (
                        "Not confirmed"
                      )
                    ) : (
                      String(record.data[f.key] ?? "Not supplied")
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {record.form_key === "F06" && (
              <CalculatorPanel values={record.data} />
            )}
            <h3 className="mt-28">Evidence & source trail</h3>
            {record.evidence?.map((file) => (
              <div className="evidence-file" key={file.id}>
                <span className="row">
                  <FileText size={15} className="text-brand" />
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={"/api/files/" + file.id}
                  >
                    {file.filename}
                  </a>
                </span>
                <EvidenceBadge value={file.classification} />
              </div>
            ))}
            {!record.evidence?.length && (
              <div className="notice notice-red">
                No evidence is attached. This submission cannot be approved.
              </div>
            )}
            <h3 className="mt-28">Feedback & revision history</h3>
            {record.feedback?.map((f) => (
              <div className="history-item" key={f.id}>
                <div className="between">
                  <StatusBadge status={f.decision} />
                  <small>
                    {f.score}/100 · revision {f.revision}
                  </small>
                </div>
                <p>{f.comments}</p>
                {f.field_comments.map((c, i) => (
                  <div className="field-comment" key={i}>
                    <strong>{c.field}</strong>: {c.comment}
                  </div>
                ))}
                <small>
                  {f.reviewer_name} · {dateLabel(f.created_at)}
                </small>
              </div>
            ))}
            {record.history?.slice(0, 8).map((h, i) => (
              <div className="history-item" key={i}>
                <span>
                  Revision {h.revision} · {h.status.replaceAll("_", " ")} ·{" "}
                  {dateLabel(h.created_at)}
                </span>
              </div>
            ))}
            {!record.feedback?.length && !record.history?.length && (
              <p className="small">This is the first saved revision.</p>
            )}
          </section>
          <aside className="card review-controls">
            {data.user?.role === "admin" &&
              ["approved", "changes_requested", "rejected"].includes(
                record.status,
              ) && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setOverride(!override)}
                  >
                    {override
                      ? "Cancel reassessment"
                      : "Override assessed result"}
                  </Button>
                  {override && (
                    <label className="mt-20">
                      <span className="field-label">
                        Reason and supporting evidence
                      </span>
                      <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        minLength={20}
                        required
                      />
                      <p className="small">
                        This creates a new audited decision. Withdrawing
                        approval can relock progression and suspend
                        certification.
                      </p>
                    </label>
                  )}
                </>
              )}
            {canReview ? (
              <>
                <h3>Evaluate with the rubric</h3>
                <p className="small">
                  Mark each criterion or enter your reasoned overall score. Pass
                  mark: {data.branding.passMark}%.
                </p>
                {rubric.map((r) => (
                  <label className="grading-row" key={r.label}>
                    <span>
                      {r.label}
                      <small style={{ display: "block", fontSize: 9 }}>
                        {r.weight}% weight
                      </small>
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      aria-label={r.label + " score"}
                      value={grades[r.label] ?? ""}
                      placeholder="/100"
                      onChange={(e) => grade(r.label, e.target.value)}
                    />
                  </label>
                ))}
                <label className="mt-20">
                  <span className="field-label">Overall score / 100</span>
                  <input
                    aria-label="Overall score"
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter the assessed score"
                  />
                </label>
                <label className="mt-20">
                  <span className="field-label">Trainer feedback</span>
                  <textarea
                    aria-label="Trainer feedback"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Explain what is correct, what needs work, and how to improve."
                  />
                </label>
                <h3 className="mt-28">Point to the exact field</h3>
                <select
                  aria-label="Feedback field"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                >
                  {spec.fields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                  <option value="evidence">Evidence attachments</option>
                </select>
                <textarea
                  aria-label="Field-specific comment"
                  className="mt-20"
                  value={fieldComment}
                  onChange={(e) => setFieldComment(e.target.value)}
                  placeholder="What is incorrect in this field? What should the learner change?"
                />
                <Button
                  variant="secondary"
                  className="full mt-20"
                  onClick={() => {
                    if (fieldComment.trim().length < 3) {
                      notify("Add a clear field-specific correction.", true);
                      return;
                    }
                    setFieldComments([
                      ...fieldComments,
                      { field, comment: fieldComment.trim() },
                    ]);
                    setFieldComment("");
                  }}
                >
                  <Plus size={13} />
                  Add field comment
                </Button>
                {fieldComments.map((c, i) => (
                  <div className="field-comment" key={i}>
                    <div className="between">
                      <strong>
                        {spec.fields.find((f) => f.key === c.field)?.label ??
                          c.field}
                      </strong>
                      <button
                        className="icon-btn"
                        aria-label="Remove field comment"
                        onClick={() =>
                          setFieldComments(
                            fieldComments.filter((_, n) => n !== i),
                          )
                        }
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {c.comment}
                  </div>
                ))}
                <label className="mt-20">
                  <span className="field-label">
                    Resubmission deadline · Pakistan time
                  </span>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={critical}
                    onChange={(e) => setCritical(e.target.checked)}
                  />
                  <span>
                    Critical operational failure — blocks approval and
                    certification until remediated.
                  </span>
                </label>
                {record.classification !== "synthetic" && (
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={verified}
                      onChange={(e) => setVerified(e.target.checked)}
                    />
                    <span>
                      I verified the source evidence. Mark this record verified.
                    </span>
                  </label>
                )}
                <div className="notice notice-amber">
                  An approval evaluates training competence. It does not
                  authorize live publishing, purchasing, refunds or
                  client-account changes.
                </div>
                <div className="stack mt-20">
                  <Button
                    busy={task.busy}
                    disabled={critical}
                    onClick={() => choose("approved")}
                  >
                    <CheckCircle2 size={15} />
                    Approve submission
                  </Button>
                  <Button
                    variant="secondary"
                    busy={task.busy}
                    onClick={() => choose("changes_requested")}
                  >
                    <MessageSquare size={14} />
                    Request changes
                  </Button>
                  <Button
                    variant="danger"
                    busy={task.busy}
                    onClick={() => choose("rejected")}
                  >
                    <XCircle size={14} />
                    Reject submission
                  </Button>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={27} className="text-brand" />
                <h3 className="mt-20">This revision has been reviewed.</h3>
                <p className="small">
                  The decision, grade, evidence and field-specific feedback are
                  retained in the record. A new submitted revision can be
                  reviewed again.
                </p>
                {record.feedback?.[0] && (
                  <>
                    <StatusBadge status={record.feedback[0].decision} />
                    <p className="mt-20 small">{record.feedback[0].comments}</p>
                  </>
                )}
              </>
            )}
          </aside>
        </div>
      </Modal>
      <Modal
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        title={
          decision === "approved"
            ? "Approve this exact revision?"
            : decision === "rejected"
              ? "Record this rejection?"
              : "Send the correction request?"
        }
        description="The decision is recorded in the learner’s audit history."
      >
        <p className="small">
          {decision === "approved"
            ? "The learner is notified, and any fully satisfied competency gate is unlocked."
            : "The learner receives your feedback and can correct and resubmit their work. Rejected and previous revisions remain available for learning."}
        </p>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => setDecision(null)}>
            Back to review
          </Button>
          <Button
            variant={decision === "rejected" ? "danger" : "primary"}
            busy={task.busy}
            onClick={() => void submit()}
          >
            Confirm decision
            <Send size={14} />
          </Button>
        </div>
      </Modal>
    </>
  );
}
