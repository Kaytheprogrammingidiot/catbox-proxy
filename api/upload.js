const fetch = require('node-fetch');
const FormData = require('form-data');
const Busboy = require('busboy');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Catbox proxy alive' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    if (req.headers['content-type']?.includes('application/json')) {
      // ---------- URL UPLOAD ----------
      let rawBody = '';
      for await (const chunk of req) rawBody += chunk;
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
        return res.status(200).json({ url: result });
      } else {
        return res.status(400).json({ error: `Catbox error: ${result}` });
      }
    } else {
      // ---------- FILE UPLOAD ----------
      const busboy = Busboy({ headers: req.headers });
      const form = new FormData();
      let HASHfound = false;

      const resultPromise = new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
          form.append('fileToUpload', file, { filename, contentType: mimetype });
        });

        busboy.on('field', (fieldname, val) => {
          if (fieldname === 'HASH') {
            form.append('userhash', val);
            HASHfound = true;
          }
        });

        busboy.on('finish', async () => {
          try {
            if (!HASHfound) return reject(new Error('Missing HASH'));

            form.append('reqtype', 'fileupload');

            const response = await fetch('https://catbox.moe/user/api.php', {
              method: 'POST',
              body: form
            });

            const result = await response.text();
            if (result.startsWith('https://')) {
              resolve({ url: result });
            } else {
              reject(new Error(`Catbox error: ${result}`));
            }
          } catch (err) {
            reject(err);
          }
        });

        busboy.on('error', reject);
      });

      req.pipe(busboy);
      const result = await resultPromise;
      return res.status(200).json(result);
    }
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
