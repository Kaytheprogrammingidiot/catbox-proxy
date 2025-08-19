const Busboy = require('busboy');
const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Health check
  if (req.method === 'GET') return res.status(200).json({ message: 'Proxy alive' });

  // Method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const busboy = new Busboy({ headers: req.headers });
    const fields = {};
    let fileBuffer = null;
    let filename = '';
    let mimetype = '';

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, file, fname, encoding, mime) => {
      console.log(`Incoming file: ${fname} (${mime})`);
      filename = fname;
      mimetype = mime;
      const chunks = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
        console.log(`File size: ${fileBuffer.length} bytes`);
      });
    });

    busboy.on('finish', async () => {
      if (!fileBuffer) {
        return res.status(400).json({ error: 'No file received' });
      }

      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', fileBuffer, filename);

      try {
        const catboxRes = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: form,
          headers: form.getHeaders()
        });

        const url = await catboxRes.text();
        console.log('Catbox response:', url);

        return res.status(200).json({
          message: 'File uploaded to Catbox',
          url,
          fields,
          filename,
          mimetype
        });
      } catch (err) {
        console.error('Catbox upload failed:', err);
        return res.status(500).json({ error: 'Catbox upload failed' });
      }
    });

    req.pipe(busboy);
  } catch (err) {
    console.error('Busboy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
