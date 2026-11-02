import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { publicConfig } from "../server/config.js";
import { createApp } from "../server/app.js";

test("configuration allows only browser-safe key types", () => {
  assert.deepEqual(publicConfig({}), { supabaseUrl: "", supabaseKey: "" });
  assert.throws(() =>
    publicConfig({ SUPABASE_URL: "https://example.supabase.co" }),
  );
  assert.throws(() =>
    publicConfig({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_secret_danger",
    }),
  );
  const roleKey = (role) =>
    "header." +
    Buffer.from(JSON.stringify({ role })).toString("base64url") +
    ".signature";
  assert.throws(() =>
    publicConfig({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: roleKey("service_role"),
    }),
  );
  assert.equal(
    publicConfig({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: roleKey("anon"),
    }).supabaseUrl,
    "https://example.supabase.co",
  );
});
test("Node serves public content without exposing source or secrets", async (t) => {
  const app = createApp(fileURLToPath(new URL("../dist", import.meta.url)), {});
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => app.close(resolve)));
  const base = `http://127.0.0.1:${app.address().port}`;
  assert.equal((await fetch(base)).status, 200);
  assert.equal(
    (await fetch(base + "/api/admin/invite", { method: "POST" })).status,
    503,
  );
  const config = await (await fetch(base + "/config.js")).text();
  assert.ok(config.includes("supabaseUrl"));
  for (const path of [
    "/.env",
    "/package.json",
    "/server/config.js",
    "/%2e%2e%2fpackage.json",
  ])
    assert.equal((await fetch(base + path)).status, 404);
  assert.equal(
    (await fetch(base + "/api/health", { method: "POST" })).status,
    405,
  );
  assert.deepEqual(await (await fetch(base + "/api/health")).json(), {
    ok: true,
    supabaseConfigured: false,
    adminAccountsConfigured: false,
  });
});

test("account administration rejects unsigned and cross-origin requests before contacting Auth", async (t) => {
  const app = createApp(fileURLToPath(new URL("../dist", import.meta.url)), {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    SUPABASE_SECRET_KEY: "server-test-only",
  });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => app.close(resolve)));
  const base = `http://127.0.0.1:${app.address().port}`;
  assert.equal(
    (await fetch(base + "/api/admin/invite", { method: "POST" })).status,
    401,
  );
  assert.equal(
    (
      await fetch(base + "/api/admin/invite", {
        method: "POST",
        headers: { origin: "https://untrusted.test" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + "/api/admin/invite", {
        method: "POST",
        headers: { origin: "invalid-origin" },
      })
    ).status,
    403,
  );
  assert.equal((await fetch(base + "/api/admin/invite")).status, 405);
  assert.ok(
    !(await (await fetch(base + "/config.js")).text()).includes(
      "server-test-only",
    ),
  );
});
