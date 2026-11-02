import { adminApi } from '../../server/admin-api.js';

export default async function handler(req, res) {
  const action = req.query?.action;
  if (typeof action !== 'string' || !['invite', 'account-status'].includes(action)) {
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'Not found' }));
  }
  // adminApi relies on an exact route path.
  req.url = `/api/admin/${action}`;
  return adminApi(req, res, process.env);
}
