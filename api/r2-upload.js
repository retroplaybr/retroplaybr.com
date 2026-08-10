import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { checkAdmin, r2Client, bucketName, publicUrl } from './_r2.js';

export const config = { maxDuration: 30 };

function cleanKey(key) {
  const k = String(key || '').replace(/^\/+/, '');
  if (!k.startsWith('games/')) throw new Error('Caminho de arquivo inválido.');
  if (k.includes('..')) throw new Error('Caminho de arquivo inválido.');
  return k;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    checkAdmin(req);

    if (req.method === 'GET') {
      r2Client();
      bucketName();
      publicUrl('test.txt');
      return res.status(200).json({
        ok: true,
        version: '3.9',
        storage: 'Cloudflare R2',
        multipart: true
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido.' });
    }

    const body = req.body || {};
    const action = String(body.action || '');
    const client = r2Client();
    const Bucket = bucketName();

    if (action === 'put-url') {
      const Key = cleanKey(body.key);
      const ContentType = String(body.contentType || 'application/octet-stream');
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({ Bucket, Key, ContentType }),
        { expiresIn: 3600 }
      );
      return res.status(200).json({ ok: true, url, key: Key, publicUrl: publicUrl(Key) });
    }

    if (action === 'create-multipart') {
      const Key = cleanKey(body.key);
      const ContentType = String(body.contentType || 'application/octet-stream');
      const result = await client.send(new CreateMultipartUploadCommand({ Bucket, Key, ContentType }));
      return res.status(200).json({
        ok: true,
        key: Key,
        uploadId: result.UploadId,
        publicUrl: publicUrl(Key)
      });
    }

    if (action === 'part-url') {
      const Key = cleanKey(body.key);
      const UploadId = String(body.uploadId || '');
      const PartNumber = Number(body.partNumber);
      if (!UploadId || !Number.isInteger(PartNumber) || PartNumber < 1 || PartNumber > 10000) {
        return res.status(400).json({ error: 'Dados da parte inválidos.' });
      }
      const url = await getSignedUrl(
        client,
        new UploadPartCommand({ Bucket, Key, UploadId, PartNumber }),
        { expiresIn: 3600 }
      );
      return res.status(200).json({ ok: true, url, partNumber: PartNumber });
    }

    if (action === 'complete-multipart') {
      const Key = cleanKey(body.key);
      const UploadId = String(body.uploadId || '');
      const parts = Array.isArray(body.parts) ? body.parts : [];
      if (!UploadId || !parts.length) {
        return res.status(400).json({ error: 'Upload multipart incompleto.' });
      }
      const Parts = parts.map(p => ({
        ETag: String(p.ETag || ''),
        PartNumber: Number(p.PartNumber)
      })).sort((a,b) => a.PartNumber - b.PartNumber);

      await client.send(new CompleteMultipartUploadCommand({
        Bucket,
        Key,
        UploadId,
        MultipartUpload: { Parts }
      }));

      return res.status(200).json({ ok: true, key: Key, publicUrl: publicUrl(Key) });
    }

    if (action === 'abort-multipart') {
      const Key = cleanKey(body.key);
      const UploadId = String(body.uploadId || '');
      if (UploadId) {
        await client.send(new AbortMultipartUploadCommand({ Bucket, Key, UploadId }));
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Ação de upload desconhecida.' });
  } catch (error) {
    console.error('RetroHub v3.9 R2 upload:', error);
    return res.status(error.statusCode || 500).json({
      error: error?.message || String(error),
      version: '3.9'
    });
  }
}
