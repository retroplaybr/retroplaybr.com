import { put, list, del } from '@vercel/blob';

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD || 'retro123';
  return req.headers['x-admin-password'] === expected;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findUploadedBlob(pathname) {
  // Signed PUT uploads can be visible a fraction of a second after the browser
  // finishes. Resolve by pathname instead of calling head() on a not-yet-known URL.
  for (const wait of [0, 250, 600, 1200, 2000]) {
    if (wait) await sleep(wait);
    const result = await list({ prefix: pathname, limit: 20 });
    const exact = result.blobs.find((blob) => blob.pathname === pathname);
    if (exact) return exact;
  }
  return null;
}

async function readCatalog() {
  const result = await list({ prefix: 'catalog/', limit: 1000 });
  const items = await Promise.all(
    result.blobs
      .filter((b) => b.pathname.endsWith('.json'))
      .map(async (b) => {
        try {
          const r = await fetch(b.url, { cache: 'no-store' });
          if (!r.ok) return null;
          const j = await r.json();
          return { ...j, metadataPath: b.pathname };
        } catch {
          return null;
        }
      }),
  );
  return items
    .filter(Boolean)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (req.query?.adminCheck === '1' && !authorized(req)) {
        return res.status(401).json({ error: 'Senha inválida' });
      }
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.status(200).json({ games: await readCatalog(), apiVersion: '2.1' });
    }

    if (!authorized(req)) {
      return res.status(401).json({ error: 'Senha administrativa inválida' });
    }

    if (req.method === 'POST') {
      const { id, name, system, coverPath, romPath, romName } = req.body || {};
      if (!id || !name || !system || !romPath) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }

      const rom = await findUploadedBlob(String(romPath));
      if (!rom) {
        return res.status(409).json({
          error: 'A ROM terminou de enviar, mas ainda não apareceu no Blob. Aguarde alguns segundos e tente Publicar para todos novamente.',
        });
      }

      let cover = null;
      if (coverPath) {
        cover = await findUploadedBlob(String(coverPath));
      }

      const game = {
        id: String(id),
        name: String(name),
        system: String(system),
        cover: cover?.url || '',
        rom: rom.url,
        coverPath: cover?.pathname || coverPath || '',
        romPath: rom.pathname,
        romName: romName || '',
        createdAt: Date.now(),
      };

      const metadataPath = `catalog/${id}.json`;
      const metadata = await put(metadataPath, JSON.stringify(game), {
        access: 'public',
        contentType: 'application/json',
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      });

      return res.status(200).json({
        ok: true,
        game: { ...game, metadataPath: metadata.pathname },
      });
    }

    if (req.method === 'DELETE') {
      const { coverUrl, romUrl, metadataPath } = req.body || {};
      const targets = [coverUrl, romUrl, metadataPath].filter(Boolean);
      if (targets.length) await del(targets);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (e) {
    console.error('catalog api error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
