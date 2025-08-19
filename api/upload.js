import Busboy from 'busboy';
import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ message: 'Proxy alive' });
  if (req.method !== 'POST') return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  try {
    const contentType = req.headers['content-type'] || '';

    // 🔹 Case 1: JSON body for uploadURL
    if (contentType.includes('application/json')) {
      let rawBody = '';
      for await (const chunk of req) rawBody += chunk;
      const { URL, HASH } = JSON.parse(rawBody);

      if (!URL || !HASH) return res.status(400).json({ error: 'Missing URL or HASH' });

      const form = new FormData();
      form.append('reqtype', 'urlupload');
      form.append('userhash', HASH);
      form.append('url', URL);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });

      const url = await catboxRes.text();
      return res.status(200).json({ url });
    }

    // 🔹 Case 2: multipart/form-data for uploadFile
    if (contentType.includes('multipart/form-data')) {
      const busboy = Busboy({ headers: req.headers });
      let fileBuffer = null;
      let filename = '';
      let userhash = '';

      const busboyPromise = new Promise((resolve, reject) => {
        busboy.on('field', (name, val) => {
          if (name === 'userhash') userhash = val;
        });

        busboy.on('file', (name, file, fname) => {
          filename = fname;
          const chunks = [];
          file.on('data', chunk => chunks.push(chunk));
          file.on('end', () => {
            fileBuffer = Buffer.concat(chunks);
          });
        });

        busboy.on('finish', resolve);
        busboy.on('error', reject);
      });

      req.pipe(busboy);
      await busboyPromise;

      if (!fileBuffer || !userhash) {
        return res.status(400).json({ error: 'Missing file or userhash' });
      }

      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('userhash', userhash);
      form.append('fileToUpload', fileBuffer, filename);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });

      const url = await catboxRes.text();
      return res.status(200).json({ url });
    }

    return res.status(400).json({ error: 'Unsupported Content-Type' });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
