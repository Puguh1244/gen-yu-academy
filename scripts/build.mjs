import { cp, rm, writeFile, readFile, readdir } from "node:fs/promises";
import { Script } from "node:vm";
import { publicConfig } from "../server/config.js";
import { build } from "esbuild";
// Check the classic homepage scripts before deploying: they are not bundled by esbuild.
for (const file of await readdir("public/js/demo")) {
  if (file.endsWith(".js")) {
    const path = `public/js/demo/${file}`;
    new Script(await readFile(path, "utf8"), { filename: path });
  }
}
const config = publicConfig();
await rm("dist", { recursive: true, force: true });
await cp("public", "dist", { recursive: true });
// Browser modules cannot resolve bare npm imports directly. Bundle the
// public Supabase integration as part of the production build.
await build({
  entryPoints: ["public/js/public-school.js"],
  outfile: "dist/js/public-school.js",
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
});
await writeFile("dist/config.js", "window.GENYU_CONFIG = " + JSON.stringify(config).replace(/</g, "\\u003c") + ";\n");
console.log(config.supabaseUrl ? "Build siap. Konfigurasi terisi; koneksi Supabase belum diuji." : "Build siap. Supabase belum dikonfigurasi.");
