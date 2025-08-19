// /api/upload.mjs

import fetch from 'node-fetch';
import FormData from 'form-data';

/** @type {import('@vercel/node').VercelApiHandler} */
export default async function handler(req, res) {
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let rawBody = '';
    for await (const chunk of req) {
      rawBody += chunk;
    }

    const { HASH, URL } = JSON.parse(rawBody);

    if (!HASH || !URL) {
      return res.status(400).json({ error: 'Missing HASH or URL' });
    }

    const form = new FormData();
    form.append('reqtype', 'urlupload');
    form.append('userhash', HASH);
    form.append('url', URL);

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form
    });

    const result = await response.text();

    if (result.startsWith('https://')) {
      res.status(200).json({ url: result });
    } else {
      res.status(400).json({ error: `Catbox error: ${result}` });
    }
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
