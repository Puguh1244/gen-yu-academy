import { adminApi } from "./admin-api.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { publicConfig } from "./config.js";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
};
export function createApp(root, env = process.env) {
  const base = resolve(root);
  const config = publicConfig(env);
  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    if (req.url.startsWith("/api/admin/")) return adminApi(req, res, env);
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end("Method not allowed");
    }
    try {
      const path = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (path === "/api/health") {
        res.setHeader("Content-Type", mime[".json"]);
        return res.end(
          JSON.stringify({
            ok: true,
            supabaseConfigured: !!config.supabaseUrl,
            adminAccountsConfigured:
              !!env.SUPABASE_SECRET_KEY && !!config.supabaseUrl,
          }),
        );
      }
      if (path === "/config.js") {
        res.setHeader("Content-Type", mime[".js"]);
        return res.end(
          "window.GENYU_CONFIG = " +
            JSON.stringify(config).replace(/</g, "\\u003c") +
            ";",
        );
      }
      if (
        path.includes("\0") ||
        path.split("/").some((x) => x.startsWith("."))
      ) {
        res.writeHead(404);
        return res.end("Not found");
      }
      const file = resolve(base, "." + (path === "/" ? "/index.html" : path));
      if (!file.startsWith(base + sep) || !(await stat(file)).isFile()) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.setHeader(
        "Content-Type",
        mime[extname(file)] || "application/octet-stream",
      );
      if (req.method === "HEAD") return res.end();
      res.end(await readFile(file));
    } catch (error) {
      res.writeHead(error instanceof URIError ? 400 : 404);
      res.end("Not found");
    }
  });
}
