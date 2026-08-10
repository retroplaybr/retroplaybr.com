export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método não permitido.' });
  }

  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return res.status(500).json({
      ok: false,
      error: 'ADMIN_PASSWORD não está configurada na Vercel.'
    });
  }

  const supplied = String(req.headers['x-admin-password'] || '');

  if (!supplied || supplied !== expected) {
    return res.status(401).json({ ok: false, error: 'Senha incorreta.' });
  }

  return res.status(200).json({ ok: true });
}
