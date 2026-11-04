import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import nodemailer from "nodemailer";
import { enquiryApi } from "../server/enquiry-api.js";
import { createApp } from "../server/app.js";

const realFetch = globalThis.fetch;
const reference = "00000000-0000-0000-0000-000000000001";
const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  GMAIL_USER: "sender@example.test",
  GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop",
};
const input = {
  name: "Test Parent",
  email: " Parent@Example.test ",
  phone: "0800000000",
  programme: "Pre-Kindergarten",
  age: "4",
  date: "2099-12-01",
  message: "PRIVATE QUESTION THAT MUST NOT APPEAR IN EMAIL",
  consent: true,
  website: "",
  language: "id",
};

async function setup(
  t,
  { dbError, mailError, mailAccepted = true, config = env, parsedBody } = {},
) {
  const calls = [];
  const mails = [];
  let transportOptions;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(
      String(url),
      "https://example.supabase.co/rest/v1/rpc/submit_enquiry",
    );
    calls.push({ kind: "save", fields: JSON.parse(options.body) });
    return new Response(JSON.stringify(dbError || reference), {
      status: dbError ? 400 : 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  t.mock.method(nodemailer, "createTransport", (options) => {
    transportOptions = options;
    return {
      sendMail: async (mail) => {
        calls.push({ kind: "email" });
        mails.push(mail);
        if (mailError) throw mailError;
        return { accepted: mailAccepted ? [mail.to.address] : [] };
      },
    };
  });
  const server =
    parsedBody === undefined
      ? createApp(new URL("../dist", import.meta.url).pathname, config)
      : createServer((req, res) => {
          req.body = parsedBody;
          return enquiryApi(req, res, config);
        });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    calls,
    mails,
    base,
    options: () => transportOptions,
    post: (value = input, headers = {}) =>
      realFetch(base + "/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: typeof value === "string" ? value : JSON.stringify(value),
      }),
  };
}

test("a saved enquiry sends one fixed receipt to the entered email, with server-only Gmail credentials", async (t) => {
  const s = await setup(t);
  const response = await s.post();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    id: reference,
    emailSent: true,
  });
  assert.deepEqual(
    s.calls.map((x) => x.kind),
    ["save", "email"],
  );
  assert.equal(s.calls[0].fields.p_email, "parent@example.test");
  assert.equal(s.calls[0].fields.p_age, 4);
  assert.equal(s.calls[0].fields.p_message, input.message);
  assert.equal(s.mails[0].to.address, "parent@example.test");
  assert.equal(s.mails[0].from.address, env.GMAIL_USER);
  assert.match(s.mails[0].text, /Permintaan pendaftaran/);
  assert.ok(s.mails[0].text.includes(reference));
  assert.ok(!s.mails[0].text.includes(input.message));
  assert.ok(!s.mails[0].cc && !s.mails[0].bcc);
  assert.equal(s.options().auth.pass, "abcdefghijklmnop");
  const browserConfig = await (await realFetch(s.base + "/config.js")).text();
  assert.ok(!browserConfig.includes(env.GMAIL_USER));
  assert.ok(!browserConfig.includes("abcdefghijklmnop"));
  const health = await (await realFetch(s.base + "/api/health")).json();
  assert.equal(health.enquiryEmailConfigured, true);
});

test("Vercel pre-parsed bodies work and English receives an English receipt", async (t) => {
  const s = await setup(t, {
    parsedBody: { ...input, language: "en", date: null },
  });
  assert.equal((await (await s.post()).json()).emailSent, true);
  assert.match(s.mails[0].text, /We have received/);
  assert.match(s.mails[0].text, /Not selected/);
  assert.equal(s.calls[0].fields.p_visit, null);
});

test("invalid fields, multi-recipient/header injection, bots and oversized requests never save or send", async (t) => {
  const s = await setup(t);
  for (const changes of [
    { name: " " },
    { consent: false },
    { website: "bot" },
    { age: "" },
    { age: true },
    { age: "11" },
    { age: "NaN" },
    { date: "2099-02-30" },
    { programme: "Other" },
    { phone: "1" },
    { message: {} },
    { message: "x".repeat(3001) },
    { email: "a@example.test,b@example.test" },
    { email: "a@example.test; b@example.test" },
    { email: "a@example.test\r\nBcc: other@example.test" },
    { email: '"Parent" <a@example.test>' },
  ]) {
    assert.equal(
      (await s.post({ ...input, ...changes })).status,
      400,
      JSON.stringify(changes),
    );
  }
  for (const value of [null, [], "{bad json", "x".repeat(16385)])
    assert.equal((await s.post(value)).status, 400);
  assert.equal(
    (await s.post(input, { Origin: "https://other.example" })).status,
    403,
  );
  assert.equal((await s.post(input, { Origin: "not-a-url" })).status, 403);
  assert.equal(
    (await s.post(input, { "Content-Type": "text/plain" })).status,
    415,
  );
  assert.equal((await realFetch(s.base + "/api/enquiries")).status, 405);
  assert.equal(s.calls.length, 0);
});

test("database validation failures and its per-email rate limit never send email", async (t) => {
  for (const [message, status] of [
    ["Please wait before submitting another enquiry", 429],
    ["Please check the enquiry fields and consent", 400],
  ]) {
    await t.test(message, async (t) => {
      const s = await setup(t, { dbError: { message } });
      assert.equal((await s.post()).status, status);
      assert.equal(s.mails.length, 0);
      assert.equal(s.calls.length, 1);
    });
  }
});

test("SMTP failures, rejected recipients and missing Gmail keep the saved request and report emailSent=false", async (t) => {
  for (const options of [
    {
      mailError: Object.assign(new Error("PRIVATE SMTP DETAILS"), {
        code: "EAUTH",
      }),
    },
    { mailAccepted: false },
    { config: { ...env, GMAIL_APP_PASSWORD: "" } },
  ]) {
    await t.test(JSON.stringify(Object.keys(options)), async (t) => {
      const logs = [];
      t.mock.method(console, "error", (...args) => logs.push(args.join(" ")));
      const s = await setup(t, options);
      const response = await s.post();
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        ok: true,
        id: reference,
        emailSent: false,
      });
      assert.equal(s.calls.filter((x) => x.kind === "save").length, 1);
      assert.ok(!logs.join("").includes("PRIVATE SMTP DETAILS"));
    });
  }
});

test("missing Supabase refuses the request without attempting Gmail", async (t) => {
  const s = await setup(t, { config: {} });
  assert.equal((await s.post()).status, 503);
  assert.equal(s.calls.length, 0);
});
