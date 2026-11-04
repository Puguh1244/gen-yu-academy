import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "./config.js";
import { sendEnquiryReceipt } from "./enquiry-email.js";

const send = (res, status, value) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(value));
};

async function body(req) {
  let text;
  if (req.body !== undefined) {
    // Vercel parses JSON before invoking the handler; the local Node server does not.
    text = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  } else {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 16384) throw new Error("Request too large");
      chunks.push(Buffer.from(chunk));
    }
    text = Buffer.concat(chunks).toString("utf8");
  }
  if (!text || Buffer.byteLength(text) > 16384) throw new Error("Invalid body");
  return JSON.parse(text);
}

function enquiryFields(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const message = input.message ?? "";
  const visit = input.date || null;
  const age =
    ["string", "number"].includes(typeof input.age) && String(input.age).trim()
      ? Number(input.age)
      : NaN;
  if (
    !name ||
    name.length > 120 ||
    !/^[^\s@,;<>"\\]+@[^\s@,;<>"\\]+\.[^\s@,;<>"\\]+$/.test(email) ||
    email.length > 254 ||
    phone.length < 5 ||
    phone.length > 30 ||
    !["Toddler", "Playgroup", "Pre-Kindergarten", "Kindergarten"].includes(
      input.programme,
    ) ||
    !Number.isFinite(age) ||
    age < 0 ||
    age > 10 ||
    typeof message !== "string" ||
    message.length > 3000 ||
    input.consent !== true ||
    (input.website ?? "") !== "" ||
    (visit !== null &&
      (typeof visit !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(visit) ||
        !Number.isFinite(Date.parse(visit)) ||
        new Date(visit).toISOString().slice(0, 10) !== visit))
  )
    return null;
  return {
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_programme: input.programme,
    p_age: age,
    p_visit: visit,
    p_message: message,
    p_consent: true,
    p_website: "",
  };
}

export async function enquiryApi(req, res, env = process.env) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "POST required" });
  }
  try {
    if (
      req.headers.origin &&
      new URL(req.headers.origin).host !== req.headers.host
    )
      return send(res, 403, { error: "Origin not permitted" });
  } catch {
    return send(res, 403, { error: "Origin not permitted" });
  }
  if (
    req.headers["content-type"]?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return send(res, 415, { error: "JSON required" });
  let input;
  let enquiry;
  try {
    input = await body(req);
    enquiry = enquiryFields(input);
  } catch {
    return send(res, 400, { error: "Invalid enquiry" });
  }
  if (!enquiry)
    return send(res, 400, { error: "Check the enquiry fields and consent" });
  let id;
  try {
    const config = publicConfig(env);
    if (!config.supabaseUrl)
      return send(res, 503, { error: "Admissions service unavailable" });
    const db = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) =>
          fetch(url, { ...options, signal: AbortSignal.timeout(8000) }),
      },
    });
    // Reuse database validation and the durable limit of three requests per email per hour.
    const result = await db.rpc("submit_enquiry", enquiry);
    if (result.error) {
      if (result.error.message?.includes("Please wait before submitting"))
        return send(res, 429, {
          error:
            "Please wait before submitting another enquiry / Mohon tunggu sebelum mengirim permintaan lagi.",
        });
      return send(res, 400, {
        error:
          "Check the enquiry fields and visit date / Periksa isian dan tanggal kunjungan.",
      });
    }
    id = result.data;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
      throw new Error("Invalid enquiry reference");
  } catch {
    return send(res, 503, {
      error:
        "Admissions service unavailable / Layanan pendaftaran belum tersedia.",
    });
  }
  let emailSent = false;
  try {
    emailSent = await sendEnquiryReceipt(env, enquiry, id, input.language);
  } catch (error) {
    // Log only a code; SMTP errors may contain addresses or credentials.
    const code =
      typeof error.code === "string" && /^[A-Z0-9_]{1,30}$/.test(error.code)
        ? error.code
        : "SEND_FAILED";
    console.error("Enquiry confirmation email failed:", code);
  }
  return send(res, 200, { ok: true, id, emailSent });
}
