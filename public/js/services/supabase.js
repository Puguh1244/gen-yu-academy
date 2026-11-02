import { createClient } from "@supabase/supabase-js";
const config = window.GENYU_CONFIG || {};
export const configured = Boolean(config.supabaseUrl && config.supabaseKey);
// User sessions stay within this browser tab. No service_role key is used anywhere.
export const db = configured
  ? createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        storage: sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
export async function result(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function uploadFile(bucket, ownerId, file) {
  if (!file || !file.size) return null;
  const media = bucket === "learning-files";
  const types = new Set(
    media
      ? [
          "image/jpeg",
          "image/png",
          "application/pdf",
          "video/mp4",
          "video/webm",
        ]
      : bucket === "school-media"
        ? ["image/jpeg", "image/png"]
        : ["image/jpeg", "image/png", "application/pdf"],
  );
  const limit = (media ? 25 : 10) * 1024 * 1024;
  if (!types.has(file.type) || file.size > limit)
    throw new Error(
      media
        ? "Use JPG, PNG, PDF, MP4 or WebM up to 25 MB."
        : "Use JPG, PNG or PDF up to 10 MB (public media: images only).",
    );
  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
    "video/mp4": "mp4",
    "video/webm": "webm",
  }[file.type];
  const path = `${ownerId}/${crypto.randomUUID()}.${extension}`;
  await result(
    db.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type }),
  );
  return path;
}
export async function fileUrl(bucket, path) {
  const data = await result(db.storage.from(bucket).createSignedUrl(path, 60));
  return data.signedUrl;
}
export async function cleanupFile(bucket, path) {
  if (path) await db.storage.from(bucket).remove([path]);
}
