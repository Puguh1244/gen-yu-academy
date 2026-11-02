import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "./config.js";
const quotas = new Map();
const send = (res, status, value) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
};
async function body(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (Buffer.byteLength(text) > 8192) throw new Error("Request too large");
  }
  return JSON.parse(text);
}
export async function adminApi(req, res, env) {
  if (
    !env.SUPABASE_SECRET_KEY ||
    !env.SUPABASE_URL ||
    !env.SUPABASE_PUBLISHABLE_KEY
  )
    return send(res, 503, {
      error:
        "Account invitations require the Node server with its private Supabase server key configured.",
    });
  if (req.method !== "POST") return send(res, 405, { error: "POST required" });
  try {
    if (
      req.headers.origin &&
      new URL(req.headers.origin).host !== req.headers.host
    )
      return send(res, 403, { error: "Origin not permitted" });
  } catch {
    return send(res, 403, { error: "Origin not permitted" });
  }
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token || token === req.headers.authorization)
    return send(res, 401, { error: "Sign in required" });
  const cfg = publicConfig(env),
    userClient = createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  try {
    const {
      data: { user },
      error,
    } = await userClient.auth.getUser(token);
    if (error || !user) return send(res, 401, { error: "Invalid session" });
    const { data: profile } = await userClient
      .from("profiles")
      .select("role,active")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.active || profile.role !== "admin")
      return send(res, 403, { error: "School administrator required" });
    const now = Date.now(),
      timestamps = (quotas.get(user.id) || []).filter((t) => t > now - 60000);
    if (timestamps.length >= 10)
      return send(res, 429, {
        error: "Please wait before making another account change",
      });
    timestamps.push(now);
    quotas.set(user.id, timestamps);
    const input = await body(req),
      admin = createClient(cfg.supabaseUrl, env.SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    if (req.url === "/api/admin/invite") {
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || "") ||
        !["parent", "teacher", "admin"].includes(input.role) ||
        typeof input.name !== "string" ||
        !input.name.trim() ||
        input.name.length > 100
      )
        return send(res, 400, { error: "Check email, display name and role" });
      const { data, error: inviteError } =
        await admin.auth.admin.inviteUserByEmail(input.email, {
          redirectTo: env.APP_ORIGIN
            ? new URL("/portal.html", env.APP_ORIGIN).href
            : undefined,
        });
      if (inviteError) throw inviteError;
      const { error: insertError } = await admin.from("profiles").insert({
        id: data.user.id,
        display_name: input.name.trim(),
        role: input.role,
      });
      if (insertError) {
        return send(res, 409, {
          error:
            "Invitation processed, but the school profile needs administrator review. No existing account was deleted.",
        });
      }
      await admin.from("audit_logs").insert({
        actor_id: user.id,
        action: "INVITE",
        table_name: "profiles",
        record_id: data.user.id,
      });
      return send(res, 200, { ok: true, id: data.user.id });
    }
    if (req.url === "/api/admin/account-status") {
      if (
        !/^[0-9a-f-]{36}$/i.test(input.id) ||
        typeof input.active !== "boolean" ||
        input.id === user.id
      )
        return send(res, 400, {
          error: "Select another account and an explicit status",
        });
      if (!input.active) {
        const { error: e } = await admin
          .from("profiles")
          .update({ active: false })
          .eq("id", input.id);
        if (e) throw e;
      }
      const { error: statusError } = await admin.auth.admin.updateUserById(
        input.id,
        { ban_duration: input.active ? "none" : "876000h" },
      );
      if (statusError) throw statusError;
      if (input.active) {
        const { error: e } = await admin
          .from("profiles")
          .update({ active: true })
          .eq("id", input.id);
        if (e) throw e;
      }
      await admin.from("audit_logs").insert({
        actor_id: user.id,
        action: input.active ? "ACTIVATE" : "DEACTIVATE",
        table_name: "profiles",
        record_id: input.id,
      });
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: "Not found" });
  } catch (error) {
    return send(res, 400, {
      error: error.message || "Account operation failed",
    });
  }
}
