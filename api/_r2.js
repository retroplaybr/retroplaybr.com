import { S3Client } from '@aws-sdk/client-s3';

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não está configurado na Vercel.`);
  return value;
}

export function checkAdmin(req) {
  const expected = requireEnv('ADMIN_PASSWORD');
  const supplied = String(req.headers['x-admin-password'] || '');
  if (!supplied || supplied !== expected) {
    const err = new Error('Senha administrativa inválida.');
    err.statusCode = 401;
    throw err;
  }
}

export function r2Client() {
  const accountId = requireEnv('R2_ACCOUNT_ID');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY')
    }
  });
}

export function bucketName() {
  return process.env.R2_BUCKET || 'retrohub-games';
}

export function publicBase() {
  return requireEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, '');
}

export function publicUrl(key) {
  return `${publicBase()}/${String(key).split('/').map(encodeURIComponent).join('/')}`;
}
