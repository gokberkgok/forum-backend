// ====================================================
// UPLOAD SERVICE
// ====================================================
// Handles server-side uploads (Imgur)

import logger from '../utils/logger.js';

export async function uploadToImgur(fileStream) {
  // Read stream into Buffer
  const chunks = [];
  for await (const chunk of fileStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const base64 = buffer.toString('base64');

  const clientId = process.env.IMGUR_CLIENT_ID;
  if (!clientId) {
    throw new Error('IMGUR_CLIENT_ID is not configured on server');
  }

  // Use Imgur anonymous image upload
  const res = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: `Client-ID ${clientId}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ image: base64 }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    logger.error({ status: res.status, body: json }, 'Imgur upload failed');
    throw new Error('Failed to upload image to Imgur');
  }

  return json.data.link;
}

export default { uploadToImgur };
