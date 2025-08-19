const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let rawBody = '';
  req.on('data', chunk => {
    rawBody += chunk;
  });

  req.on('end', async () => {
    try {
      console.log('Raw body:', rawBody);

      let parsed;
      try {
        parsed = JSON.parse(rawBody);
      } catch (err) {
        console.error('JSON parse error:', err);
        return res.status(400).json({ error: 'Invalid JSON' });
      }

      const { HASH, URL } = parsed;
      console.log('Parsed HASH:', HASH);
      console.log('Parsed URL:', URL);

      if (!HASH || !URL) {
        return res.status(400).json({ error: 'Missing HASH or URL' });
      }

      const form = new FormData();
      form.append('reqtype', 'urlupload');
      form.append('userhash', HASH);
      form.append('url', URL);

      let response;
      try {
        response = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: form
        });
      } catch (err) {
        console.error('Fetch to Catbox failed:', err);
        return res.status(502).json({ error: 'Failed to reach Catbox' });
      }

      const result = await response.text();
      console.log('Catbox response:', result);

      if (result.startsWith('https://')) {
        res.status(200).json({ url: result });
      } else {
        res.status(400).json({ error: `Catbox error: ${result}` });
      }
    } catch (err) {
      console.error('Unexpected server error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};
