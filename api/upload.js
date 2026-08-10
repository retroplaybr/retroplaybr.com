import { handleUpload } from '@vercel/blob/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 * 1024; // 5 TB

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const body = req.body;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = JSON.parse(clientPayload || '{}'); } catch {}

        const expected = process.env.ADMIN_PASSWORD || 'retro123';
        if (!payload.adminPassword || payload.adminPassword !== expected) {
          throw new Error('Senha administrativa inválida');
        }

        if (!pathname || !String(pathname).startsWith('games/')) {
          throw new Error('Caminho de upload inválido');
        }

        return {
          allowedContentTypes: [
            'application/octet-stream',
            'application/x-iso9660-image',
            'application/x-cd-image',
            'application/zip',
            'application/x-7z-compressed',
            'application/x-rar-compressed',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
          ],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async () => {
        // O catálogo é atualizado pelo admin após o upload concluir no navegador.
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('large upload error', error);
    return res.status(400).json({ error: error?.message || String(error) });
  }
}
