export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const supplied = req.headers['x-admin-password'] || '';
  const expected = process.env.ADMIN_PASSWORD || '';

  if (!expected || supplied !== expected) {
    return res.status(401).json({
      ok: false,
      error: 'Senha administrativa inválida.',
    });
  }

  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const hasStoreId = Boolean(process.env.BLOB_STORE_ID);

  if (!hasBlobToken) {
    return res.status(500).json({
      ok: false,
      error: 'BLOB_READ_WRITE_TOKEN não chegou a este deployment.',
      hasBlobToken,
      hasStoreId,
    });
  }

  return res.status(200).json({
    ok: true,
    uploadVersion: '3.5',
    hasBlobToken,
    hasStoreId,
  });
}
