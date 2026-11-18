import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { httpError } from './http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');

async function uploadToCloudinary(buffer, mimeType) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'hungry-hut';
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${secret}`)
    .digest('hex');
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), 'upload');
  form.append('api_key', key);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    const text = await response.text();
    throw httpError(502, `Cloud image storage failed: ${text.slice(0, 160)}`);
  }
  const json = await response.json();
  return json.secure_url;
}

export async function storeImage(file) {
  if (!file || !file.buffer?.length) throw httpError(400, 'Choose an image to upload.');
  if (!/^image\/(jpeg|png|webp|avif|gif)$/.test(file.mimetype)) {
    throw httpError(400, 'Only JPG, PNG, WEBP, AVIF or GIF images are allowed.');
  }
  if (file.size > 6 * 1024 * 1024) throw httpError(400, 'Images must be smaller than 6 MB.');

  const cloudUrl = await uploadToCloudinary(file.buffer, file.mimetype);
  if (cloudUrl) return cloudUrl;

  await fs.mkdir(uploadDir, { recursive: true });
  const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(uploadDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

export { uploadDir };
