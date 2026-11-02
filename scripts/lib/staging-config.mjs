import { resolve, relative, isAbsolute } from "node:path";
import { publicConfig } from "../../server/config.js";
export function stagingConfig(env = process.env) {
  const cfg = publicConfig(env);
  if (!cfg.supabaseUrl || !cfg.supabaseKey || !env.SUPABASE_SECRET_KEY)
    throw new Error(
      "Staging requires SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and a server-only SUPABASE_SECRET_KEY.",
    );
  const origin = new URL(cfg.supabaseUrl);
  if (origin.hostname !== `${env.GENYU_STAGING_PROJECT_REF}.supabase.co`)
    throw new Error(
      "Set GENYU_STAGING_PROJECT_REF to the exact confirmed staging project reference.",
    );
  if (env.GENYU_ENV !== "staging")
    throw new Error(
      "GENYU_ENV must be staging. Never run this fixture setup on production.",
    );
  const credentials = resolve(
    env.GENYU_STAGING_CREDENTIALS_FILE ||
      "../genyu-private/staging-accounts.json",
  );
  const rel = relative(process.cwd(), credentials);
  if (!rel.startsWith("..") && !isAbsolute(rel))
    throw new Error(
      "The credentials file must be outside the repository and public directory.",
    );
  return { ...cfg, serverKey: env.SUPABASE_SECRET_KEY, credentials };
}
export async function unwrap(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}
