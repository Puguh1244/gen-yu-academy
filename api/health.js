import { publicConfig } from '../server/config.js';

export default function handler(req, res) {
  if (!['GET','HEAD'].includes(req.method)) {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  const config = publicConfig();
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify({
    ok: true,
    supabaseConfigured: !!config.supabaseUrl,
    adminAccountsConfigured: !!process.env.SUPABASE_SECRET_KEY && !!config.supabaseUrl
  }));
}
