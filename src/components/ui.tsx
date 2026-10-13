"use client";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  LoaderCircle,
  Image as ImageIcon,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import type { Bootstrap, Lesson, Submission } from "@/lib/types";
import { classificationLabels } from "@/lib/domain";

export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api/" + path, {
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new RequestError(
      data.error ?? "The request failed.",
      response.status,
      data.fields,
    );
  return data as T;
}
export const post = <T,>(path: string, data: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(data) });
export function Button({
  children,
  variant = "primary",
  busy = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      className={clsx("btn", `btn-${variant}`, className)}
      {...props}
      disabled={props.disabled || busy}
    >
      {busy ? <LoaderCircle size={16} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      tone={
        status === "approved"
          ? "green"
          : status === "submitted"
            ? "blue"
            : status === "changes_requested"
              ? "amber"
              : status === "rejected"
                ? "red"
                : "neutral"
      }
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
export function EvidenceBadge({ value }: { value: string }) {
  return (
    <Badge
      tone={
        value === "verified"
          ? "green"
          : value === "synthetic"
            ? "purple"
            : "amber"
      }
    >
      {classificationLabels[value as keyof typeof classificationLabels] ??
        value}
    </Badge>
  );
}
export function Logo({
  src,
  parent = false,
}: {
  src: string | null;
  parent?: boolean;
}) {
  return src ? (
    <img
      className={parent ? "parent-logo" : "brand-logo"}
      src={src}
      alt={parent ? "NGB Consultancy logo" : "Dr. Commerce logo"}
    />
  ) : (
    <span
      className={clsx("logo-placeholder", parent && "parent-placeholder")}
      title="Official logo file pending upload"
    >
      <ImageIcon size={parent ? 16 : 21} />
      <span>Logo</span>
    </span>
  );
}
export function Ring({
  value,
  size = 78,
  label,
}: {
  value: number;
  size?: number;
  label?: ReactNode;
}) {
  const radius = 32,
    circ = 2 * Math.PI * radius;
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={
            circ * (1 - Math.min(100, Math.max(0, value)) / 100)
          }
          transform="rotate(-90 40 40)"
        />
      </svg>
      <span>{label ?? `${Math.round(value)}%`}</span>
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={clsx("modal", wide && "modal-wide")}>
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>
                {description ?? "Dr. Commerce Academy workspace"}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-btn" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Check size={24} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a className="external-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
export interface AcademyContextValue {
  registerPendingSave: (save: () => Promise<void>) => () => void;
  data: Bootstrap;
  refresh: () => Promise<void>;
  go: (view: string) => void;
  openLesson: (id: string, present?: boolean) => Promise<void>;
  openWorkspace: (
    formKey: string,
    lessonId?: string | null,
    assignmentId?: string | null,
    parentId?: string | null,
  ) => Promise<void>;
  openRecord: (id: string) => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}
export const AcademyContext = createContext<AcademyContextValue | null>(null);
export function useAcademy() {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error("Academy context unavailable");
  return ctx;
}
export function useTask() {
  const [busy, setBusy] = useState(false),
    { notify } = useAcademy();
  return {
    busy,
    run: async (work: () => Promise<void>) => {
      setBusy(true);
      try {
        await work();
      } catch (error) {
        notify((error as Error).message, true);
      } finally {
        setBusy(false);
      }
    },
  };
}
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date(value));
}
