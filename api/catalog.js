import {
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { checkAdmin, r2Client, bucketName } from './_r2.js';

export const config = { maxDuration: 30 };

async function bodyToString(body) {
  if (!body) return '';
  if (typeof body.transformToString === 'function') return body.transformToString();
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const client = r2Client();
    const Bucket = bucketName();

    if (req.method === 'GET') {
      const listed = await client.send(new ListObjectsV2Command({
        Bucket,
        Prefix: 'catalog/'
      }));

      const keys = (listed.Contents || [])
        .map(x => x.Key)
        .filter(k => k && k.endsWith('.json'));

      const games = [];
      for (const Key of keys) {
        try {
          const obj = await client.send(new GetObjectCommand({ Bucket, Key }));
          const text = await bodyToString(obj.Body);
          games.push(JSON.parse(text));
        } catch {}
      }

      games.sort((a,b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      return res.status(200).json({ ok: true, version: '3.9', storage: 'Cloudflare R2', games });
    }

    checkAdmin(req);

    if (req.method === 'POST') {
      const g = req.body || {};
      if (!g.id || !g.name || !g.system || !g.rom) {
        return res.status(400).json({ error: 'Dados incompletos do jogo.' });
      }

      const game = {
        id: String(g.id),
        name: String(g.name),
        system: String(g.system),
        cover: String(g.cover || ''),
        rom: String(g.rom),
        coverKey: String(g.coverKey || ''),
        romKey: String(g.romKey || ''),
        romName: String(g.romName || ''),
        createdAt: Number(g.createdAt || Date.now()),
        scope: 'public',
        storage: 'r2'
      };

      await client.send(new PutObjectCommand({
        Bucket,
        Key: `catalog/${game.id}.json`,
        Body: JSON.stringify(game),
        ContentType: 'application/json'
      }));

      return res.status(200).json({ ok: true, game });
    }

    if (req.method === 'DELETE') {
      const id = String(req.query?.id || req.body?.id || '');
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' });

      await client.send(new DeleteObjectCommand({
        Bucket,
        Key: `catalog/${id}.json`
      }));

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    console.error('RetroHub v3.9 catalog:', error);
    return res.status(error.statusCode || 500).json({
      error: error?.message || String(error),
      version: '3.9'
    });
  }
}
