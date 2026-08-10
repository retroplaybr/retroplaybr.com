import { handleUpload } from '@vercel/blob/client';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      version: '3.7',
      route: '/api/upload',
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
      hasStoreId: Boolean(process.env.BLOB_STORE_ID)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido', version: '3.7' });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN não está disponível neste deployment.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); }
      catch { return res.status(400).json({ error: 'Body do client upload inválido.' }); }
    }

    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      body,
      request: req,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || '{}'); } catch {}

        const expected = process.env.ADMIN_PASSWORD || '';
        if (!expected) throw new Error('ADMIN_PASSWORD não está disponível.');
        if (!payload.adminPassword || payload.adminPassword !== expected) {
          throw new Error('Senha administrativa inválida.');
        }

        const p = String(pathname || '');
        if (!p.startsWith('games/')) throw new Error('Caminho de upload inválido.');

        return {
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024 * 1024,
          addRandomSuffix: false,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({ pathname: p })
        };
      },

      onUploadCompleted: async ({ blob }) => {
        console.log('RetroHub v3.7 upload concluído:', blob?.pathname || blob?.url);
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('RetroHub v3.7 /api/upload:', error);
    return res.status(400).json({
      error: error?.message || String(error),
      version: '3.7'
    });
  }
}
