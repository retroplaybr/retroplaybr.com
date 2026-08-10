import { handleUpload } from '@vercel/blob/client';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido',
      route: 'upload-v3.5',
    });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: 'BLOB_READ_WRITE_TOKEN não está disponível neste deployment. Faça um novo Redeploy depois de salvar a conexão do Blob.',
        route: 'upload-v3.5',
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          error: 'O servidor recebeu um corpo de upload inválido.',
          route: 'upload-v3.5',
        });
      }
    }

    const jsonResponse = await handleUpload({
      token,
      body,
      request: req,

      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        let payload = {};
        try {
          payload = typeof clientPayload === 'string'
            ? JSON.parse(clientPayload || '{}')
            : (clientPayload || {});
        } catch {}

        const expected = process.env.ADMIN_PASSWORD;
        if (!expected) {
          throw new Error('ADMIN_PASSWORD não está disponível no deployment.');
        }

        if (!payload.adminPassword || payload.adminPassword !== expected) {
          throw new Error('Senha administrativa inválida para gerar o token de upload.');
        }

        const cleanPath = String(pathname || '');
        if (!cleanPath.startsWith('games/')) {
          throw new Error('Caminho de upload inválido.');
        }

        return {
          // Não restringimos MIME: ISOs/ROMs podem chegar com tipos diferentes
          // dependendo do navegador/Windows.
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024 * 1024,
          addRandomSuffix: false,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({
            pathname: cleanPath,
            multipart: Boolean(multipart),
          }),
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('RetroHub v3.5 upload completed', {
          pathname: blob?.pathname,
          size: blob?.size,
          tokenPayload,
        });
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('RetroHub v3.5 client upload error:', error);
    return res.status(400).json({
      error: error?.message || String(error),
      route: 'upload-v3.5',
    });
  }
}
