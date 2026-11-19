import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

function wrappingKey() {
  const master = process.env.SUPPORT_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!master) throw new Error('SUPPORT_SECRET_NOT_CONFIGURED');
  return Buffer.from(hkdfSync('sha256', master, 'nexopos-support-v1', 'gemini-api-key', 32));
}
export function encryptSupportKey(value: string): string {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', wrappingKey(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join('.');
}
export function decryptSupportKey(value: string): string {
  const [version, iv, tag, data] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('SUPPORT_KEY_INVALID');
  const decipher = createDecipheriv('aes-256-gcm', wrappingKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}
