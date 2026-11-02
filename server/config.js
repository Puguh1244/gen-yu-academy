export function publicConfig(env = process.env) {
  const supabaseUrl = env.SUPABASE_URL || "";
  const supabaseKey = env.SUPABASE_PUBLISHABLE_KEY || "";
  if (!!supabaseUrl !== !!supabaseKey)
    throw new Error("Set both Supabase URL and publishable key.");
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    if (
      url.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname)
    )
      throw new Error("Supabase URL must use HTTPS.");
    if (url.username || url.password || url.search || url.hash)
      throw new Error(
        "Use the project origin, without credentials or query parameters.",
      );
    let legacyAnon = false;
    try {
      legacyAnon =
        JSON.parse(Buffer.from(supabaseKey.split(".")[1], "base64url")).role ===
        "anon";
    } catch {}
    if (!supabaseKey.startsWith("sb_publishable_") && !legacyAnon)
      throw new Error(
        "Only publishable or legacy anon keys may enter the browser. Never use service_role or secret keys.",
      );
  }
  return { supabaseUrl, supabaseKey };
}
