const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Friendly GET response
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Catbox proxy is alive. Use POST with HASH and URL to upload.'
    });
  }

  // Reject other methods
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Only attach listeners for POST
  let rawBody = '';
  req.on('data', chunk => {
    rawBody += chunk;
  });

  req.on('end', async () => {
    try {
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
  });
};
