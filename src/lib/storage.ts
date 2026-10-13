import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { query, transaction } from "./db";
import { ApiError, requireRole, supabaseFor } from "./auth";
import { canAccessStudent, getSubmission, getBranding } from "./queries";
import { audit } from "./workflows";
import type { Profile } from "./types";

const dataDir = () =>
  path.resolve(process.env.ACADEMY_DATA_DIR ?? ".academy-data");
const mimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
];
function verifyFile(buffer: Buffer, mime: string) {
  if (mime === "image/png")
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/jpeg") return buffer[0] === 255 && buffer[1] === 216;
  if (mime === "image/webp")
    return (
      buffer.subarray(0, 4).toString() === "RIFF" &&
      buffer.subarray(8, 12).toString() === "WEBP"
    );
  if (mime === "application/pdf")
    return buffer.subarray(0, 5).toString() === "%PDF-";
  return mime === "text/plain" && !buffer.includes(0);
}
export async function uploadFile(user: Profile, request: NextRequest) {
  if (Number(request.headers.get("content-length") ?? 0) > 11 * 1024 * 1024)
    throw new ApiError(413, "Evidence uploads are limited to 10 MB.");
  const data = await request.formData(),
    file = data.get("file"),
    kind = String(data.get("kind") ?? "evidence"),
    submissionId = String(data.get("submissionId") ?? ""),
    title = String(data.get("title") ?? "Training resource");
  if (
    !(file instanceof File) ||
    !file.size ||
    file.size > 10 * 1024 * 1024 ||
    !mimeTypes.includes(file.type)
  )
    throw new ApiError(
      422,
      "Upload PNG, JPEG, WebP, PDF or plain text up to 10 MB.",
    );
  if (kind === "logo" || kind === "parentLogo") {
    requireRole(user, ["admin"]);
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
      throw new ApiError(
        422,
        "Logos must be PNG, JPEG or WebP images up to 5 MB.",
      );
  } else if (kind === "resource") requireRole(user, ["admin"]);
  else {
    requireRole(user, ["student"]);
    const s = await getSubmission(user, submissionId);
    if (
      s.student_id !== user.id ||
      !["draft", "changes_requested", "rejected"].includes(s.status)
    )
      throw new ApiError(
        403,
        "Evidence may be added only to your editable submission.",
      );
  }
  const classification = String(data.get("classification") ?? "synthetic");
  if (!["synthetic", "internal", "pending"].includes(classification))
    throw new ApiError(422, "Only a reviewer can mark evidence verified.");
  const id = randomUUID(),
    buffer = Buffer.from(await file.arrayBuffer()),
    filename = file.name.replace(/[^a-zA-Z0-9 ._()-]/g, "_").slice(0, 160);
  if (!verifyFile(buffer, file.type))
    throw new ApiError(
      422,
      "The file content does not match its declared type.",
    );
  const branding = kind === "logo" || kind === "parentLogo",
    bucket = branding
      ? "academy-branding"
      : kind === "resource"
        ? "academy-resources"
        : "academy-evidence";
  const key = `${branding || kind === "resource" ? user.organization_id : user.id}/${id}`;
  let url = branding ? `/api/brand-assets/${id}` : `/api/files/${id}`;
  if (process.env.AUTH_MODE === "supabase") {
    const { client } = supabaseFor(request),
      { error } = await client.storage
        .from(bucket)
        .upload(key, buffer, { contentType: file.type, upsert: false });
    if (error)
      throw new ApiError(
        503,
        "Storage upload failed. Confirm the Supabase bucket and access policies.",
      );
    if (branding)
      url = client.storage.from(bucket).getPublicUrl(key).data.publicUrl;
  } else {
    await mkdir(path.join(dataDir(), "files", path.dirname(key)), {
      recursive: true,
      mode: 0o700,
    });
    await writeFile(path.join(dataDir(), "files", key), buffer, {
      mode: 0o600,
    });
  }
  await transaction(async (client) => {
    if (branding) {
      await query(
        "INSERT INTO branding_assets(id,organization_id,storage_key,filename,mime_type,size) VALUES($1,$2,$3,$4,$5,$6)",
        [id, user.organization_id, key, filename, file.type, file.size],
        client,
      );
      const settings = await getBranding(user.organization_id, client);
      await query(
        "UPDATE organizations SET settings=$1 WHERE id=$2",
        [JSON.stringify({ ...settings, [kind]: url }), user.organization_id],
        client,
      );
    } else if (kind === "resource") {
      url = `/api/resources/${id}/download`;
      await query(
        "INSERT INTO training_assets(id,organization_id,title,kind,url,classification,description,storage_key,mime_type,size) VALUES($1,$2,$3,'File',$4,$5,$6,$7,$8,$9)",
        [
          id,
          user.organization_id,
          title,
          url,
          classification,
          filename,
          key,
          file.type,
          file.size,
        ],
        client,
      );
    } else
      await query(
        "INSERT INTO submission_evidence(id,submission_id,student_id,filename,mime_type,size,storage_key,classification) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          id,
          submissionId,
          user.id,
          filename,
          file.type,
          file.size,
          key,
          classification,
        ],
        client,
      );
    await audit(client, user, "file.uploaded", id, {
      kind,
      filename,
      size: file.size,
      classification,
    });
  });
  return { id, url, filename, classification };
}
export async function downloadFile(
  user: Profile | null,
  request: NextRequest,
  id: string,
  kind: "evidence" | "branding" | "resource",
) {
  let record:
    | {
        storage_key: string;
        filename: string;
        mime_type: string;
        student_id?: string;
        organization_id?: string;
      }
    | undefined;
  if (kind === "branding")
    record = (
      await query<typeof record>(
        "SELECT storage_key,filename,mime_type FROM branding_assets WHERE id=$1",
        [id],
      )
    )[0];
  else if (kind === "resource") {
    if (!user) throw new ApiError(401, "Sign in to view this resource.");
    record = (
      await query<typeof record>(
        "SELECT storage_key,description AS filename,mime_type,organization_id FROM training_assets WHERE id=$1",
        [id],
      )
    )[0];
    if (record?.organization_id !== user.organization_id)
      throw new ApiError(403, "This resource belongs to another organization.");
  } else {
    if (!user) throw new ApiError(401, "Sign in to view private evidence.");
    record = (
      await query<typeof record>(
        "SELECT storage_key,filename,mime_type,student_id FROM submission_evidence WHERE id=$1",
        [id],
      )
    )[0];
    if (record?.student_id) await canAccessStudent(user, record.student_id);
  }
  if (!record?.storage_key) throw new ApiError(404, "File not found.");
  if (process.env.AUTH_MODE === "supabase" && kind !== "branding") {
    const { client } = supabaseFor(request),
      { data, error } = await client.storage
        .from(kind === "resource" ? "academy-resources" : "academy-evidence")
        .createSignedUrl(record.storage_key, 60);
    if (error || !data)
      throw new ApiError(403, "Private storage access denied.");
    return NextResponse.redirect(data.signedUrl);
  }
  const buffer = await readFile(
    path.join(dataDir(), "files", record.storage_key),
  );
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": record.mime_type,
      "Content-Disposition": `${kind === "branding" ? "inline" : "attachment"}; filename="${record.filename.replace(/["\r\n]/g, "_")}"`,
      "Cache-Control":
        kind === "branding" ? "public, max-age=86400" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
