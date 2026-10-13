"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  UploadCloud,
  FileText,
  CheckCircle2,
  LoaderCircle,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Link2,
  Eye,
  Check,
  Clock3,
} from "lucide-react";
import type { CostInputs, Submission, Evidence } from "@/lib/types";
import { getForm, formErrors, type Field } from "@/lib/forms";
import { calculateCost, supplierChecks, selectionScore } from "@/lib/domain";
import {
  Button,
  Badge,
  StatusBadge,
  EvidenceBadge,
  PageHeading,
  Modal,
  ExternalLink,
  useAcademy,
  api,
  post,
  RequestError,
  dateLabel,
} from "./ui";

export function clientCostInputs(d: Record<string, unknown>): CostInputs {
  return {
    item: Number(d.item ?? 0),
    shipping: Number(d.shipping ?? 0),
    selling: Number(d.selling ?? 0),
    mode: d.mode === "actual" ? "actual" : "allowance",
    allowance: Number(d.allowance ?? 20),
    feePercent: Number(d.feePercent ?? 0),
    fixedFee: Number(d.fixedFee ?? 0),
    promotionPercent: Number(d.promotionPercent ?? 0),
    conversion: Number(d.conversion ?? 0),
    tax: Number(d.tax ?? 0),
    other: Number(d.other ?? 0),
  };
}
export function CalculatorPanel({
  values,
}: {
  values: Record<string, unknown>;
}) {
  let result;
  try {
    result = calculateCost(clientCostInputs(values));
  } catch (error) {
    return (
      <div className="notice mt-20">
        <Info size={14} style={{ display: "inline", marginRight: 7 }} />
        {(error as Error).message}
      </div>
    );
  }
  const currency = String(values.currency ?? "USD"),
    money = (n: number) =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        maximumFractionDigits: 3,
      }).format(n);
  return (
    <>
      <div className="calculation-grid">
        <div className="calculation-tile">
          <small>Total investment</small>
          <strong>{money(result.investment)}</strong>
        </div>
        <div className="calculation-tile">
          <small>Expected net profit</small>
          <strong style={{ color: result.profit < 0 ? "#cf4e58" : undefined }}>
            {money(result.profit)}
          </strong>
        </div>
        <div className="calculation-tile">
          <small>Estimated ROI</small>
          <strong>{result.roi.toFixed(1)}%</strong>
        </div>
        <div className="calculation-tile">
          <small>Profit margin</small>
          <strong>{result.margin.toFixed(1)}%</strong>
        </div>
      </div>
      <div className="between small">
        <span className="muted">
          Break-even selling price: {money(result.minimumPrice)}
        </span>
        <Badge tone={result.inTarget ? "green" : "amber"}>
          {result.inTarget
            ? "Within 80–100% target"
            : "Trainer review required"}
        </Badge>
      </div>
      {result.warnings.map((w) => (
        <div
          className="notice notice-amber"
          key={w}
          style={{ marginTop: 12, fontSize: 11 }}
        >
          {w}
        </div>
      ))}
      <p className="small muted mt-20">
        ROI = net profit ÷ total investment × 100.{" "}
        {values.mode === "actual"
          ? "Percentage fees are calculated against selling price. The allowance is excluded."
          : "The allowance replaces actual additional-cost fields, which are excluded to prevent double-counting."}
      </p>
    </>
  );
}
function InputField({
  field,
  value,
  onChange,
  error,
  disabled,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
  disabled: boolean;
}) {
  const id = "field-" + field.key;
  return (
    <div
      className={
        (field.type === "textarea" || field.type === "checkbox"
          ? "span-2 "
          : "") + (error ? "field-invalid" : "")
      }
    >
      {field.type === "checkbox" ? (
        <label className="check-label">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
          <span>
            {field.label}
            {field.required && <span className="text-red"> *</span>}
          </span>
        </label>
      ) : (
        <>
          <label className="field-label" htmlFor={id}>
            {field.label}
            {field.required && <span className="text-red">*</span>}
            {field.help && (
              <span title={field.help}>
                <Info size={12} className="muted" aria-label={field.help} />
              </span>
            )}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={id}
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={
                field.help ?? "Record your observations and reasoning…"
              }
            />
          ) : field.type === "select" ? (
            <select
              id={id}
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            >
              <option value="">Choose an option</option>
              {field.options?.map((o) => (
                <option key={o} value={o}>
                  {o === "allowance"
                    ? "Estimated allowance (replaces actual extra costs)"
                    : o === "actual"
                      ? "Actual documented costs (no allowance)"
                      : o}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={id}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "url"
                    ? "url"
                    : "text"
              }
              step={
                field.type === "number"
                  ? field.integer
                    ? "1"
                    : "any"
                  : undefined
              }
              min={field.min}
              max={field.max}
              value={String(value ?? "")}
              placeholder={
                field.type === "url"
                  ? "https://…"
                  : field.type === "number"
                    ? "0.00"
                    : field.label
              }
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
          )}
        </>
      )}
      {field.help && <div className="field-help">{field.help}</div>}
      {error && (
        <div className="field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
export function PracticeForm({ initial }: { initial: Submission }) {
  const {
      data,
      refresh,
      notify,
      go,
      openLesson,
      openWorkspace,
      registerPendingSave,
    } = useAcademy(),
    [record, setRecord] = useState(initial),
    [values, setValues] = useState<Record<string, unknown>>(initial.data),
    [dirty, setDirty] = useState(false),
    [saving, setSaving] = useState(false),
    [busy, setBusy] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [saveError, setSaveError] = useState(""),
    [confirm, setConfirm] = useState(false),
    [preview, setPreview] = useState(false);
  const recordRef = useRef(record),
    valuesRef = useRef(values),
    savingRef = useRef<Promise<Submission> | null>(null),
    timerRef = useRef<ReturnType<typeof setTimeout> | null>(null),
    editCounter = useRef(0),
    savedCounter = useRef(0),
    mounted = useRef(true);
  recordRef.current = record;
  valuesRef.current = values;
  const spec = getForm(record.form_key),
    editable = ["draft", "changes_requested", "rejected"].includes(
      record.status,
    ),
    parent = data.submissions.find((s) => s.id === record.parent_id),
    lesson = data.lessons.find((l) => l.id === record.lesson_id),
    nextForm =
      record.form_key === "F02"
        ? "F04"
        : record.form_key === "F04"
          ? "F06"
          : record.form_key === "F06"
            ? "F08"
            : record.form_key === "F08"
              ? "F10"
              : record.form_key === "F10"
                ? "F11"
                : null;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  useEffect(
    () =>
      registerPendingSave(async () => {
        if (savingRef.current) await savingRef.current;
        if (
          editCounter.current > savedCounter.current &&
          ["draft", "changes_requested", "rejected"].includes(
            recordRef.current.status,
          )
        )
          await save();
      }),
    [registerPendingSave],
  );
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (editCounter.current > savedCounter.current || savingRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  useEffect(() => {
    if (!["submitted", "approved"].includes(record.status)) return;
    const update = () => {
      void api<Submission>("submissions/" + record.id)
        .then((s) => {
          if (mounted.current) {
            setRecord(s);
            recordRef.current = s;
          }
        })
        .catch(() => {});
    };
    const timer = setInterval(update, 4000);
    window.addEventListener("academy:changed", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("academy:changed", update);
    };
  }, [record.id, record.status]);
  async function save(): Promise<Submission> {
    if (savingRef.current) {
      await savingRef.current;
    }
    if (editCounter.current === savedCounter.current) return recordRef.current;
    if (timerRef.current) clearTimeout(timerRef.current);
    const count = editCounter.current,
      payload = {
        id: recordRef.current.id,
        revision: recordRef.current.revision,
        formKey: spec.key,
        data: valuesRef.current,
        classification:
          recordRef.current.classification === "verified"
            ? "pending"
            : recordRef.current.classification,
      };
    setSaving(true);
    setSaveError("");
    const work = api<Submission>("submissions", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    savingRef.current = work;
    try {
      const updated = await work;
      recordRef.current = updated;
      savedCounter.current = count;
      if (mounted.current) {
        setRecord(updated);
        if (editCounter.current === count) setDirty(false);
      }
      return updated;
    } catch (error) {
      if (mounted.current) setSaveError((error as Error).message);
      throw error;
    } finally {
      savingRef.current = null;
      if (mounted.current) setSaving(false);
    }
  }
  function change(key: string, value: unknown) {
    const next = { ...valuesRef.current, [key]: value };
    valuesRef.current = next;
    setValues(next);
    setDirty(true);
    editCounter.current++;
    setErrors((e) => ({ ...e, [key]: "" }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save().catch(() => {});
    }, 850);
  }
  async function validate() {
    const found = formErrors(spec.key, valuesRef.current);
    if (!recordRef.current.evidence?.length)
      found.evidence = "Attach at least one clearly classified evidence file.";
    setErrors(found);
    notify(
      Object.keys(found).length
        ? "Review the highlighted fields and evidence requirements."
        : "Your fields and evidence are ready. The server will also verify the readiness checklist.",
      Object.keys(found).length > 0,
    );
  }
  async function upload(file: File) {
    setBusy(true);
    try {
      if (dirty) await save();
      const form = new FormData();
      form.set("file", file);
      form.set("submissionId", record.id);
      form.set(
        "classification",
        record.classification === "verified"
          ? "pending"
          : record.classification,
      );
      await api("uploads", { method: "POST", body: form });
      const updated = await api<Submission>("submissions/" + record.id);
      recordRef.current = updated;
      setRecord(updated);
      notify("Evidence uploaded and linked to your record.");
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setBusy(true);
    setConfirm(false);
    try {
      const latest =
        dirty || savingRef.current ? await save() : recordRef.current;
      const updated = await post<Submission>(
        "submissions/" + record.id + "/submit",
        { revision: latest.revision },
      );
      recordRef.current = updated;
      setRecord(updated);
      setDirty(false);
      savedCounter.current = editCounter.current;
      await refresh();
      notify(
        "Submitted for trainer review. Your evidence and revision history are preserved.",
      );
    } catch (error) {
      if (error instanceof RequestError) setErrors(error.fields);
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    if (
      dirty &&
      !window.confirm(
        "Reload the saved record? Your unsaved edits will be replaced.",
      )
    )
      return;
    try {
      const latest = await api<Submission>("submissions/" + record.id);
      recordRef.current = latest;
      valuesRef.current = latest.data;
      setRecord(latest);
      setValues(latest.data);
      setDirty(false);
      savedCounter.current = editCounter.current;
      setSaveError("");
    } catch (error) {
      notify((error as Error).message, true);
    }
  }
  const sourceIssues =
    spec.key === "F04"
      ? supplierChecks(
          Number(values.rating ?? 0),
          Number(values.feedback ?? 0),
          String(values.country),
          Number(values.deliveryDays ?? 0),
        )
      : null;
  return (
    <>
      <PageHeading
        eyebrow={`${spec.key} · PRACTICAL OPERATING WORKSPACE`}
        title={spec.title}
        description="Work carefully, preserve your sources, and give your trainer a clear evidence trail."
        action={
          <Button
            variant="secondary"
            onClick={() => {
              if (dirty)
                void save()
                  .then(() => go("submissions"))
                  .catch((error) => notify((error as Error).message, true));
              else go("submissions");
            }}
          >
            <ArrowLeft size={13} />
            My submissions
          </Button>
        }
      />
      <div className="row wrap" style={{ marginBottom: 22 }}>
        <StatusBadge status={record.status} />
        <EvidenceBadge value={record.classification} />
        <span className="form-identifier">
          Record {record.id.slice(0, 8)} · revision {record.revision}
        </span>
        {parent && (
          <span className="small muted">
            <Link2 size={11} style={{ display: "inline", marginRight: 4 }} />
            From approved {parent.form_key}: {parent.title}
          </span>
        )}
      </div>
      {record.feedback?.length ? (
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="card-heading">
            <h2>Your trainer’s feedback</h2>
            <StatusBadge status={record.feedback[0].decision} />
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--ink)",
              whiteSpace: "pre-wrap",
            }}
          >
            {record.feedback[0].comments}
          </p>
          {record.feedback[0].field_comments.map((c, i) => (
            <div className="field-comment" key={i}>
              <strong>
                {spec.fields.find((f) => f.key === c.field)?.label ?? c.field}
              </strong>
              : {c.comment}
            </div>
          ))}
          <div className="small muted">
            Score: {record.feedback[0].score ?? "—"} / 100 ·{" "}
            {record.feedback[0].reviewer_name} ·{" "}
            {record.feedback[0].deadline
              ? "Resubmit by " + dateLabel(record.feedback[0].deadline)
              : "Follow the correction notes and resubmit."}
          </div>
        </div>
      ) : null}
      {record.status === "approved" && nextForm && (
        <div className="notice notice-green" style={{ marginBottom: 22 }}>
          <div className="between wrap">
            <div>
              <strong>Your next step is ready.</strong>
              <p>
                Approved product details and identifiers will carry into{" "}
                {getForm(nextForm).short.toLowerCase()}.
              </p>
            </div>
            <Button
              onClick={() =>
                void openWorkspace(nextForm, null, null, record.id)
              }
            >
              Continue to {getForm(nextForm).short}
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
      <div className="work-grid">
        <aside className="card work-instructions">
          <Badge tone="blue">Learn → practice → review</Badge>
          <h3>Your operating checklist</h3>
          <p>{spec.description}</p>
          {lesson && (
            <Button
              variant="secondary"
              className="full"
              onClick={() => {
                if (dirty)
                  void save()
                    .then(() => openLesson(lesson.id))
                    .catch((error) => notify((error as Error).message, true));
                else void openLesson(lesson.id);
              }}
            >
              <BookOpenIcon />
              Day {lesson.day}: readiness checklist
            </Button>
          )}
          <div className="instruction-detail">
            <h3 className="mt-28">Before you submit</h3>
            <ul>
              <li>Confirm the target marketplace and assigned scenario.</li>
              <li>
                Record the source, exact variant and relevant observation.
              </li>
              <li>Separate observed facts from estimates.</li>
              <li>Attach clearly classified evidence.</li>
              <li>Complete the linked lesson checklist.</li>
            </ul>
            <h3 className="mt-28">What happens next?</h3>
            <p>
              Your assigned trainer reviews the exact revision. If corrections
              are needed, feedback points to the specific field. Approval
              unlocks the eligible next step.
            </p>
            <div className="notice notice-amber">
              No live account changes, purchases, publishing or messages are
              performed here.
            </div>
          </div>
        </aside>
        <section className="card operating-form">
          <h2>{record.title || "Your practical record"}</h2>
          <p>{spec.description}</p>
          {saveError && (
            <div className="notice notice-red" style={{ marginBottom: 20 }}>
              {saveError}{" "}
              <button className="text-brand" onClick={() => void reload()}>
                Reload saved record
              </button>
            </div>
          )}
          <div className="form-grid">
            {spec.fields.map((f) => (
              <InputField
                key={f.key}
                field={f}
                value={values[f.key]}
                onChange={(v) => change(f.key, v)}
                error={errors[f.key]}
                disabled={!editable || busy}
              />
            ))}
          </div>
          {spec.key === "F03" && (
            <div className="notice mt-20">
              <strong>
                Weighted selection score: {selectionScore(values).toFixed(1)} /
                100
              </strong>
              <p>
                Dr. Commerce Recommendation. This scorecard flags potential; it
                does not grant product approval.
              </p>
            </div>
          )}
          {sourceIssues && (
            <div
              className={
                "notice mt-20 " +
                (sourceIssues.numericQualified
                  ? "notice-green"
                  : "notice-amber")
              }
            >
              <strong>
                {sourceIssues.numericQualified
                  ? "Numeric thresholds met — evidence review still required"
                  : "Supplier checks need attention"}
              </strong>
              {sourceIssues.issues.map((issue) => (
                <p key={issue}>{issue}</p>
              ))}
              <p>
                Desired free-shipping thresholds apply only when actually
                offered and verified at checkout.
              </p>
            </div>
          )}
          {spec.key === "F06" && (
            <>
              <CalculatorPanel values={values} />
              <div className="notice mt-20">
                <strong>Internal stopwatch exercise</strong>
                <p>
                  $2.01 × 1.20 = $2.412 investment. At $5.88, profit is $3.468
                  and ROI is 143.8% before unrecorded costs. The original 101%
                  claim is unsupported without additional documented costs.
                </p>
                {editable && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      for (const [key, value] of Object.entries({
                        item: 2.01,
                        shipping: 0,
                        selling: 5.88,
                        mode: "allowance",
                        allowance: 20,
                      }))
                        change(key, value);
                    }}
                  >
                    Load internal example (pending verification)
                  </Button>
                )}
              </div>
            </>
          )}
          {(spec.key === "F07" || spec.key === "F08") && (
            <section className="mt-28">
              <div className="card-heading">
                <h2>Variation & SKU builder</h2>
                {editable && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      change("variations", [
                        ...(Array.isArray(values.variations)
                          ? values.variations
                          : []),
                        { sku: "", variant: "", sourceVariant: "" },
                      ])
                    }
                  >
                    <Plus size={13} />
                    Add variation
                  </Button>
                )}
              </div>
              {(
                (values.variations ?? []) as {
                  sku: string;
                  variant: string;
                  sourceVariant: string;
                }[]
              ).map((variation, index) => (
                <div className="variation-row" key={index}>
                  {(["sku", "variant", "sourceVariant"] as const).map((key) => (
                    <input
                      key={key}
                      aria-label={`${key} ${index + 1}`}
                      placeholder={
                        key === "sku"
                          ? "Internal SKU"
                          : key === "variant"
                            ? "Listing variant"
                            : "Exact supplier variant"
                      }
                      value={variation[key]}
                      disabled={!editable}
                      onChange={(e) => {
                        const array = [
                          ...(values.variations as (typeof variation)[]),
                        ];
                        array[index] = {
                          ...array[index],
                          [key]: e.target.value,
                        };
                        change("variations", array);
                      }}
                    />
                  ))}
                  <button
                    className="icon-btn"
                    aria-label={`Remove variation ${index + 1}`}
                    disabled={!editable}
                    onClick={() =>
                      change(
                        "variations",
                        (values.variations as (typeof variation)[]).filter(
                          (_, i) => i !== index,
                        ),
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {!(values.variations as unknown[] | undefined)?.length && (
                <p className="small">
                  Add the exact variant and its supplier mapping. Do not invent
                  a SKU match.
                </p>
              )}
            </section>
          )}
          {spec.key === "F08" && (
            <Button
              variant="secondary"
              className="mt-20"
              onClick={() => setPreview(!preview)}
            >
              <Eye size={14} />
              {preview ? "Hide" : "Show"} simulated listing preview
            </Button>
          )}
          {preview && (
            <div className="listing-preview">
              <Badge tone="purple">Simulated listing · not published</Badge>
              <h3 className="mt-20">
                {String(values.title ?? "Listing title")}
              </h3>
              <div className="price">
                {String(values.price ?? "—")}{" "}
                <small>+ {String(values.shipping ?? 0)} shipping</small>
              </div>
              <p className="mt-20">
                {String(
                  values.description ?? "Your description will appear here.",
                )}
              </p>
              <div className="row wrap">
                <Badge>{String(values.condition ?? "Condition pending")}</Badge>
                <Badge>{String(values.brand ?? "Brand pending")}</Badge>
                <Badge>{String(values.origin ?? "Origin pending")}</Badge>
              </div>
            </div>
          )}
          {spec.key === "F10" && (
            <div className="notice notice-amber mt-20">
              <strong>Fictional order brief</strong>
              <p>
                Two blue units. Dummy recipient: Training Buyer, 10 Example
                Road, Demonstration City. Check the exact SKU, changed source
                price and any unexpected shipping cost. Choosing a red unit or
                one unit is an accuracy error.
              </p>
            </div>
          )}
          {spec.key === "F11" && (
            <div className="notice mt-20">
              <strong>Synthetic tracking reference</strong>
              <p>
                Day 1: processing · Day 3: carrier acceptance · Day 6:
                international transit · Day 9: customs · Day 11: final-mile
                handoff · Day 13: example delivery. This reference is not a
                guaranteed schedule; record only the event actually supplied in
                your scenario.
              </p>
            </div>
          )}
          <section className="mt-28">
            <div className="card-heading">
              <h2>Evidence & attachments</h2>
              <EvidenceBadge value={record.classification} />
            </div>
            {editable && (
              <label className="upload-box" style={{ display: "block" }}>
                <UploadCloud size={26} />
                <strong className="small">
                  Attach evidence to this record
                </strong>
                <p>PNG, JPEG, WebP, PDF or text · up to 10 MB</p>
                <input
                  type="file"
                  aria-label="Upload evidence"
                  accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {errors.evidence && (
              <p className="field-error">{errors.evidence}</p>
            )}
            {record.evidence?.map((file) => (
              <div className="evidence-file" key={file.id}>
                <span className="row">
                  <FileText size={15} className="text-brand" />
                  <a
                    href={"/api/files/" + file.id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {file.filename}
                  </a>
                </span>
                <span className="muted">
                  {Math.ceil(file.size / 1024)} KB · {file.classification}
                </span>
              </div>
            ))}
            {!record.evidence?.length && !editable && (
              <p className="small">No evidence files are attached.</p>
            )}
          </section>
          <div className="form-actions">
            <span className="save-status">
              {saving ? (
                <LoaderCircle size={13} className="spin" />
              ) : dirty ? (
                <Clock3 size={13} />
              ) : (
                <CheckCircle2 size={13} />
              )}{" "}
              {saving
                ? "Saving to your workspace…"
                : saveError
                  ? "Not saved"
                  : dirty
                    ? "Unsaved changes"
                    : "Saved to your workspace"}
            </span>
            {editable ? (
              <div className="row wrap">
                <Button
                  variant="secondary"
                  busy={saving}
                  onClick={() =>
                    void save()
                      .then(() => notify("Draft saved."))
                      .catch((error) => notify((error as Error).message, true))
                  }
                >
                  <Save size={13} />
                  Save draft
                </Button>
                <Button variant="secondary" onClick={() => void validate()}>
                  Validate form
                </Button>
                <Button busy={busy} onClick={() => setConfirm(true)}>
                  <Send size={13} />
                  Submit for review
                </Button>
              </div>
            ) : (
              <Badge tone={record.status === "approved" ? "green" : "amber"}>
                {record.status === "approved"
                  ? "Approved by your trainer"
                  : "Awaiting trainer review"}
              </Badge>
            )}
          </div>
          <div className="workflow-timeline">
            <span className="done">
              <CheckCircle2 />
              Draft
            </span>
            <ArrowRight size={12} />
            <span className={record.submitted_at ? "done" : ""}>Submitted</span>
            <ArrowRight size={12} />
            <span className={record.feedback?.length ? "done" : ""}>
              Trainer review
            </span>
            <ArrowRight size={12} />
            <span className={record.status === "approved" ? "done" : ""}>
              Approval & next step
            </span>
          </div>
        </section>
      </div>
      <section className="card mt-28">
        <div className="card-heading">
          <h2>Your record history</h2>
          <span className="small muted">
            Evidence, corrections and revisions remain traceable.
          </span>
        </div>
        {record.feedback?.map((f) => (
          <div className="history-item" key={f.id}>
            <div className="between">
              <StatusBadge status={f.decision} />
              <small>
                Revision {f.revision} · {dateLabel(f.created_at)}
              </small>
            </div>
            <p>{f.comments}</p>
            {f.field_comments.map((c, i) => (
              <div className="field-comment" key={i}>
                <strong>{c.field}</strong>: {c.comment}
              </div>
            ))}
          </div>
        ))}
        {record.history?.slice(0, 8).map((h, i) => (
          <div className="history-item" key={i}>
            <div className="between">
              <span>
                Revision {h.revision} · {h.status.replaceAll("_", " ")}
              </span>
              <small>{dateLabel(h.created_at)}</small>
            </div>
          </div>
        ))}
        {!record.history?.length && !record.feedback?.length && (
          <p className="small mb-0">
            Your draft is saved. Revision history starts when you edit or submit
            it.
          </p>
        )}
      </section>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Submit this revision for review?"
        description="Your trainer will review the saved fields and attached evidence."
      >
        <p className="small">
          The record becomes read-only while it is under review. If changes are
          requested, you can correct the indicated fields and resubmit with the
          history intact.
        </p>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Keep working
          </Button>
          <Button busy={busy} onClick={() => void submit()}>
            Submit for review
            <Send size={14} />
          </Button>
        </div>
      </Modal>
    </>
  );
}
function BookOpenIcon() {
  return <FileText size={13} />;
}
