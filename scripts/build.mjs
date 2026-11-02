import { cp, rm, writeFile } from "node:fs/promises";
import { publicConfig } from "../server/config.js";
const config = publicConfig();
await rm("dist", { recursive: true, force: true });
await cp("public", "dist", { recursive: true });
await writeFile("dist/config.js", "window.GENYU_CONFIG = " + JSON.stringify(config).replace(/</g, "\\u003c") + ";\n");
console.log(config.supabaseUrl ? "Build siap. Konfigurasi terisi; koneksi Supabase belum diuji." : "Build siap. Supabase belum dikonfigurasi.");
